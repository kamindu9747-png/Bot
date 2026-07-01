/**
 * pair.js
 * Despite the name matching the pairing feature, this file is the bot's
 * command router: it takes an incoming message, figures out the command,
 * and dispatches it via a switch/case block.
 */

const config = require('./config');
const msgUtils = require('./msg');

const startTime = Date.now();

/**
 * Main entry point called from index.js for every incoming message.
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {object} m - normalized message { jid, sender, text, raw, isGroup }
 */
async function handleCommand(sock, m) {
  const { jid, text, raw } = m;
  if (!text || !text.startsWith(config.PREFIX)) return;

  const body = text.slice(config.PREFIX.length).trim();
  const [cmdRaw, ...args] = body.split(/\s+/);
  const cmd = (cmdRaw || '').toLowerCase();
  const argText = args.join(' ');

  try {
    switch (cmd) {
      case 'ping': {
        const start = Date.now();
        const sent = await msgUtils.reply(sock, jid, 'Pinging...', raw);
        const latency = Date.now() - start;
        await sock.sendMessage(jid, { text: `🏓 Pong! ${latency}ms`, edit: sent.key });
        break;
      }

      case 'alive': {
        const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
        await msgUtils.reply(
          sock,
          jid,
          `${msgUtils.getGreeting()} 👋\n${config.BOT_NAME} is alive.\nUptime: ${uptimeSec}s`,
          raw
        );
        break;
      }

      case 'menu':
      case 'help': {
        const list = [
          `${config.PREFIX}ping - check bot latency`,
          `${config.PREFIX}alive - check bot status`,
          `${config.PREFIX}menu - show this menu`,
          `${config.PREFIX}owner - get owner contact`,
          `${config.PREFIX}fakecontact <name> - send a custom contact card`,
        ].join('\n');
        await msgUtils.reply(sock, jid, `📜 *${config.BOT_NAME} Menu*\n\n${list}`, raw);
        break;
      }

      case 'owner': {
        await msgUtils.sendFakeContact(sock, jid, {
          name: `${config.BOT_NAME} Owner`,
          number: config.OWNER_NUMBER,
          orgName: config.BOT_NAME,
        });
        break;
      }

      case 'fakecontact': {
        const name = argText || 'Unknown';
        await msgUtils.sendFakeContact(sock, jid, { name, number: config.OWNER_NUMBER });
        break;
      }

      default: {
        // Unknown command: stay silent to avoid spamming groups,
        // unless it's a DM in public mode.
        if (config.PUBLIC_MODE && !m.isGroup) {
          await msgUtils.reply(sock, jid, `Unknown command. Try ${config.PREFIX}menu`, raw);
        }
      }
    }
  } catch (err) {
    console.error('[pair.js] command error:', err);
    await msgUtils.reply(sock, jid, '⚠️ Something went wrong running that command.', raw);
  }
}

module.exports = { handleCommand };
