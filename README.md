# 🤖 Mini WhatsApp Bot

A lightweight, production-ready WhatsApp bot built with **[Baileys](https://github.com/WhiskeySockets/Baileys)**, **MongoDB**, and **Express.js**. Connect your WhatsApp account, run commands, and automate messaging with an intuitive web-based pairing interface.

---

## ✨ Features

- 🔐 **Secure Pairing**: Web-based QR/pairing code generator for WhatsApp authentication
- 💾 **Persistent Sessions**: MongoDB-backed authentication state—resume sessions across restarts
- ⚡ **Command System**: Modular command handling with extensible architecture
- 🌐 **Web Interface**: Beautiful UI for easy pairing and configuration
- 🎯 **Group & DM Support**: Handle both direct messages and group conversations
- 🔄 **Auto-Reconnect**: Automatic reconnection on connection loss
- 🎨 **Customizable**: Full configuration via environment variables

---

## 📋 Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/kamindu9747-png/Bot.git
cd Bot
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Bot Identity
BOT_NAME=Mini-Bot
PREFIX=.
OWNER_NUMBER=94700000000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=whatsapp_bot
SESSION_COLLECTION=auth_sessions
SESSION_ID=default-session

# Web Server
PORT=3000

# Pairing (optional—auto-request code on boot)
PAIRING_NUMBER=

# Behavior
AUTO_READ=true
PUBLIC_MODE=true
WATERMARK=Mini-Bot • Baileys + MongoDB
```

### 3. Start the Bot

```bash
npm start
```

The web interface will be available at `http://localhost:3000`

---

## 🔧 Configuration

All settings are in `config.js` and can be overridden via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_NAME` | Mini-Bot | Name shown in WhatsApp |
| `PREFIX` | `.` | Command prefix (e.g., `.help`) |
| `OWNER_NUMBER` | 94700000000 | Bot owner's phone (digits only) |
| `MONGODB_URI` | mongodb://127.0.0.1:27017 | MongoDB connection string |
| `DB_NAME` | whatsapp_bot | Database name |
| `SESSION_COLLECTION` | auth_sessions | Collection for auth storage |
| `SESSION_ID` | default-session | Session identifier |
| `PORT` | 3000 | Express server port |
| `PAIRING_NUMBER` | *(empty)* | Auto-pair this number on boot |
| `AUTO_READ` | true | Auto-mark messages as read |
| `PUBLIC_MODE` | true | Allow public command usage |
| `WATERMARK` | Mini-Bot • Baileys + MongoDB | Footer watermark |

---

## 📁 Project Structure

```
Bot/
├── index.js          # Main entry point, WhatsApp socket & Express server
├── config.js         # Configuration management
├── id.js             # Phone number utilities
├── msg.js            # Message parsing utilities
├── pair.js           # Command handling & routing
├── main.html         # Web-based pairing UI
├── package.json      # Dependencies
├── LICENSE           # Apache 2.0
└── README.md         # This file
```

### Key Files

- **`index.js`**: Bootstraps MongoDB connection, Baileys WhatsApp socket, and Express server
- **`config.js`**: Centralized configuration (environment + defaults)
- **`pair.js`**: Command handler—extend here to add new commands
- **`main.html`**: Frontend for requesting pairing codes
- **`id.js`**: Phone number validation & formatting
- **`msg.js`**: Message extraction & parsing

---

## 🎯 How It Works

### Pairing Flow

1. **Start the bot** → `npm start`
2. **Open web UI** → Navigate to `http://localhost:3000`
3. **Enter phone number** → Click "Request Pairing Code"
4. **Confirm on WhatsApp** → Use the code to pair your account
5. **Connected!** → Bot is now authenticated and ready

### Session Persistence

- Credentials are stored in MongoDB, not on disk
- Sessions survive bot restarts—no re-pairing needed
- Multiple session support (configure `SESSION_ID` per bot instance)

### Message Handling

```
Incoming Message
    ↓
Extracted text & metadata
    ↓
Command parser (pair.js)
    ↓
Command handlers
    ↓
Response sent back
```

---

## 💬 Extending Commands

Edit `pair.js` to add custom commands:

```javascript
// Example: .hello command
if (text === '.hello') {
  await sock.sendMessage(jid, { text: 'Hello! 👋' });
}
```

---

## 🛠️ Technology Stack

| Component | Library | Version |
|-----------|---------|---------|
| WhatsApp API | @whiskeysockets/baileys | ^6.7.9 |
| Database | MongoDB | ^6.8.0 |
| Web Framework | Express.js | ^4.19.2 |
| Logging | Pino | ^9.3.2 |
| QR Code | qrcode | ^1.5.4 |
| Config | dotenv | ^16.4.5 |
| Error Handling | @hapi/boom | ^10.0.1 |

---

## 🔒 Security Best Practices

1. **Never commit `.env`** to version control—keep credentials private
2. **MongoDB Authentication**: Use a strong password and restricted network access
3. **Phone Numbers**: Store owner numbers securely; avoid hardcoding
4. **Rate Limiting**: Consider adding rate limits for production deployments
5. **HTTPS**: Use HTTPS in production (proxy with nginx/Apache)

---

## 🐛 Troubleshooting

### "WhatsApp socket not ready yet"
- The bot is still initializing. Wait a few seconds and retry.

### Connection drops frequently
- Check your network stability
- Verify MongoDB connectivity
- Review Baileys version compatibility

### Messages not being received
- Ensure `AUTO_READ` is configured correctly
- Check that the bot is connected: `GET /status`

### Port already in use
- Change `PORT` in `.env` (e.g., `PORT=3001`)
- Or: `lsof -ti:3000 | xargs kill -9` (macOS/Linux)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve pairing UI |
| POST | `/pair` | Request pairing code (`{ number: "94700000000" }`) |
| GET | `/status` | Check connection status |

---

## 📝 License

Licensed under **Apache License 2.0**. See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs via Issues
- 💡 Suggest features with PRs
- 📖 Improve documentation
- 🔧 Optimize code

---

## ⚠️ Disclaimer

This bot uses WhatsApp's unofficial API via Baileys. Usage is at your own risk—your account may be banned if used excessively or for spam. Use responsibly.

---

## 📞 Support & Questions

- Check existing issues for solutions
- Review the [Baileys documentation](https://github.com/WhiskeySockets/Baileys)
- Open an issue for bugs or feature requests

---

**Made with ❤️ by [kamindu9747-png](https://github.com/kamindu9747-png)**

Happy botting! 🚀
