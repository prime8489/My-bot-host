const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let runningBots = {};

app.post("/start-bot", (req, res) => {
  const token = req.body.token;

  if (!token) return res.send("❌ Please enter a bot token.");

  if (runningBots[token]) {
    return res.send("⚠️ This bot is already running.");
  }

  try {
    const bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(msg.chat.id, "👋 Hello! I'm alive.");
    });

    runningBots[token] = bot;

    res.send("✅ Bot started successfully!");
  } catch (err) {
    res.send("❌ Failed to start bot: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
