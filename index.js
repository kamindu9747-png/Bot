/**
 * index.js
 * Main entry point:
 *  - connects to MongoDB and stores/loads Baileys auth state there
 *  - boots the WhatsApp socket
 *  - starts an Express server that serves main.html and a /pair endpoint
 *    used by the browser to request a WhatsApp pairing code
 *  - wires incoming messages into pair.js
 */

const path = require('path');
const express = require('express');
const pino = require('pino');
const { MongoClient } = require('mongodb');
const { Boom } = require('@hapi/boom');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  initAuthCreds,
  BufferJSON,
} = require('@whiskeysockets/baileys');

const config = require('./config');
const idUtils = require('./id');
const msgUtils = require('./msg');
const { handleCommand } = require('./pair');

const logger = pino({ level: 'silent' });

let sock = null;
let latestPairingCode = null;
let mongoClient = null;
let authCollection = null;

// ---------------------------------------------------------------------------
// MongoDB-backed auth state (drop-in replacement for useMultiFileAuthState)
// ---------------------------------------------------------------------------
async function useMongoAuthState(collection, sessionId) {
  const writeData = async (key, data) => {
    await collection.updateOne(
      { _id: `${sessionId}:${key}` },
      { $set: { value: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) } },
      { upsert: true }
    );
  };

  const readData = async (key) => {
    const doc = await collection.findOne({ _id: `${sessionId}:${key}` });
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
  };

  const removeData = async (key) => {
    await collection.deleteOne({ _id: `${sessionId}:${key}` });
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                // baileys expects a proto class instance for this type
                value = value;
              }
              result[id] = value;
            })
          );
          return result;
        },
        set: async (data) => {
          const tasks = [];
          for (const type in data) {
            for (const id in data[type]) {
              const value = data[type][id];
              const key = `${type}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
  };
}

// ---------------------------------------------------------------------------
// WhatsApp connection
// ---------------------------------------------------------------------------
async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMongoAuthState(authCollection, config.SESSION_ID);

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: [config.BOT_NAME, 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[index.js] connection closed. reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`[index.js] ${config.BOT_NAME} connected ✅`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const raw = messages[0];
    if (!raw?.message || raw.key.fromMe) return;

    if (config.AUTO_READ) {
      try {
        await sock.readMessages([raw.key]);
      } catch (_) {}
    }

    const jid = raw.key.remoteJid;
    const text = msgUtils.extractText(raw.message);

    await handleCommand(sock, {
      jid,
      sender: raw.key.participant || raw.key.remoteJid,
      text,
      raw,
      isGroup: jid.endsWith('@g.us'),
    });
  });

  return sock;
}

/** Request a pairing code for a phone number (called from the /pair endpoint). */
async function requestPairingCode(number) {
  if (!idUtils.isValidNumber(number)) {
    throw new Error('Invalid phone number');
  }
  if (!sock) {
    throw new Error('WhatsApp socket not ready yet, try again shortly');
  }
  const clean = idUtils.cleanNumber(number);
  const code = await sock.requestPairingCode(clean);
  latestPairingCode = idUtils.formatPairingCode(code);
  return latestPairingCode;
}

// ---------------------------------------------------------------------------
// Web server (serves main.html pairing UI + /pair API)
// ---------------------------------------------------------------------------
function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(__dirname));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
  });

  app.post('/pair', async (req, res) => {
    try {
      const { number } = req.body;
      const code = await requestPairingCode(number);
      res.json({ ok: true, code });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get('/status', (_req, res) => {
    res.json({ connected: !!sock?.user, user: sock?.user || null });
  });

  app.listen(config.PORT, () => {
    console.log(`[index.js] pairing web UI running at http://localhost:${config.PORT}`);
  });
}

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------
(async () => {
  try {
    mongoClient = new MongoClient(config.MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db(config.DB_NAME);
    authCollection = db.collection(config.SESSION_COLLECTION);
    console.log('[index.js] connected to MongoDB ✅');

    await startBot();
    startServer();

    if (config.PAIRING_NUMBER) {
      await idUtils.delay(2000);
      try {
        const code = await requestPairingCode(config.PAIRING_NUMBER);
        console.log(`[index.js] pairing code for ${config.PAIRING_NUMBER}: ${code}`);
      } catch (err) {
        console.error('[index.js] failed to auto-request pairing code:', err.message);
      }
    }
  } catch (err) {
    console.error('[index.js] fatal boot error:', err);
    process.exit(1);
  }
})();
