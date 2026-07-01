/**
 * msg.js
 * Reusable message-building / sending helpers used by pair.js commands.
 */

const config = require('./config');

/** Prepend the bot watermark to any outgoing text. */
function withWatermark(text = '') {
  return `${text}\n\n> ${config.WATERMARK}`;
}

/**
 * Build & send a vCard "contact card" message. Useful for a .fakecontact
 * style command that shares a custom contact card in a chat.
 */
async function sendFakeContact(sock, jid, { name = 'Mini Bot', number = config.OWNER_NUMBER, orgName = config.BOT_NAME } = {}) {
  const cleanNum = String(number).replace(/[^0-9]/g, '');
  const vcard =
    'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    `FN:${name}\n` +
    `ORG:${orgName};\n` +
    `TEL;type=CELL;type=VOICE;waid=${cleanNum}:+${cleanNum}\n` +
    'END:VCARD';

  return sock.sendMessage(jid, {
    contacts: {
      displayName: name,
      contacts: [{ vcard }],
    },
  });
}

/** Simple text reply wrapper so every command replies the same way. */
async function reply(sock, jid, text, quoted) {
  return sock.sendMessage(jid, { text: withWatermark(text) }, { quoted });
}

/** Build a quick button message (Baileys interactive/buttons style). */
async function sendButtons(sock, jid, { text = '', footer = config.BOT_NAME, buttons = [] } = {}) {
  const formatted = buttons.map((b, i) => ({
    buttonId: b.id || `btn_${i}`,
    buttonText: { displayText: b.text },
    type: 1,
  }));

  return sock.sendMessage(jid, {
    text: withWatermark(text),
    footer,
    buttons: formatted,
    headerType: 1,
  });
}

/** Extract the plain-text body from any incoming message type Baileys gives us. */
function extractText(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.buttonsResponseMessage?.selectedButtonId ||
    ''
  );
}

/** Time-of-day based greeting, handy for menu/alive commands. */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

module.exports = {
  withWatermark,
  sendFakeContact,
  reply,
  sendButtons,
  extractText,
  getGreeting,
};
