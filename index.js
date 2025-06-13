const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let runningBots = {};

app.post("/start-bot", async (req, res) => {
  const token = req.body.token;

  if (!token) return res.status(400).json({ error: "❌ Please enter a bot token." });

  if (runningBots[token]) {
    return res.json({
      first_name: runningBots[token].info?.first_name || "Unknown",
      username: runningBots[token].info?.username || "",
      alreadyRunning: true
    });
  }

  try {
    const bot = new TelegramBot(token, { polling: true });
    const info = await bot.getMe();
    const commands = {};

    bot.on("message", (msg) => {
      const text = msg.text.trim();
      if (commands[text]) {
        let userCode = commands[text];
        let parsedCode = userCode.replace(/sent\(.*?)\/g, `bot.sendMessage(msg.chat.id, $1);`);
        try {
          eval(parsedCode);
        } catch (err) {
          bot.sendMessage(msg.chat.id, "❌ Error in command code.");
        }
      }
    });

    bot.onText(/\\/start/, (msg) => {
      bot.sendMessage(msg.chat.id, "👋 Hello! I'm alive.");
    });

    runningBots[token] = { bot, commands, info };

    res.json({
      first_name: info.first_name,
      username: "@" + info.username,
      alreadyRunning: false
    });
  } catch (err) {
    console.log("❌ Error starting bot:", err.message);
    res.status(500).json({ error: "❌ Failed to start bot." });
  }
});

app.post("/add-command", (req, res) => {
  const { token, command, code } = req.body;

  if (!token || !command || !code) {
    return res.status(400).send("❌ Token, command, and code are required.");
  }

  if (!runningBots[token]) {
    return res.status(404).send("❌ Bot not running.");
  }

  runningBots[token].commands[command] = code;
  res.send("✅ Command added.");
});

app.post("/stop-bot", (req, res) => {
  const token = req.body.token;

  if (runningBots[token]) {
    runningBots[token].bot.stopPolling();
    delete runningBots[token];
    return res.send("🛑 Bot stopped.");
  }

  res.send("⚠️ No running bot found.");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
