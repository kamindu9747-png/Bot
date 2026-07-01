/**
 * config.js
 * Central configuration for the bot. Reads overrides from a .env file
 * if present, otherwise falls back to the defaults below.
 */
require('dotenv').config();

module.exports = {
  // Identity
  BOT_NAME: process.env.BOT_NAME || 'Mini-Bot',
  PREFIX: process.env.PREFIX || '.',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '94700000000', // digits only, no +

  // Mongo
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME || 'whatsapp_bot',
  SESSION_COLLECTION: process.env.SESSION_COLLECTION || 'auth_sessions',
  SESSION_ID: process.env.SESSION_ID || 'default-session',

  // Web server (pairing page)
  PORT: process.env.PORT || 3000,

  // Pairing
  // If set, the bot will request a pairing code for this number automatically
  // on boot instead of waiting for someone to submit main.html.
  PAIRING_NUMBER: process.env.PAIRING_NUMBER || '',

  // Behaviour
  AUTO_READ: (process.env.AUTO_READ || 'true') === 'true',
  PUBLIC_MODE: (process.env.PUBLIC_MODE || 'true') === 'true',

  // Misc
  WATERMARK: process.env.WATERMARK || 'Mini-Bot • Baileys + MongoDB',
};
