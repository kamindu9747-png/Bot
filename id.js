/**
 * id.js
 * Support functions used by the pairing-code flow (number cleanup,
 * validation, session id generation, code formatting, etc).
 */

const crypto = require('crypto');

/** Strip everything except digits from a phone number string. */
function cleanNumber(number = '') {
  return String(number).replace(/[^0-9]/g, '');
}

/** Very loose validation: WhatsApp numbers are ~7-15 digits (E.164 without +). */
function isValidNumber(number) {
  const n = cleanNumber(number);
  return n.length >= 7 && n.length <= 15;
}

/** Generate a random session identifier, used as the Mongo document key. */
function generateSessionId(prefix = 'SESSION') {
  const rand = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
}

/**
 * Baileys returns pairing codes as an 8-character string.
 * This just makes sure it is displayed as WA does, e.g. "ABCD-1234".
 */
function formatPairingCode(code = '') {
  const clean = String(code).replace(/-/g, '').toUpperCase();
  if (clean.length !== 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

/** Small sleep helper used while waiting on socket/connection events. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a short random request id, useful for logging/tracing pair requests. */
function generateRequestId() {
  return crypto.randomBytes(4).toString('hex');
}

module.exports = {
  cleanNumber,
  isValidNumber,
  generateSessionId,
  formatPairingCode,
  delay,
  generateRequestId,
};
