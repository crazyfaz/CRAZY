const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const { parseStringPromise } = require('xml2js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// On bot ready
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  startYouTubeCheck();
});

// Handle commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

// === YouTube Notifier ===
let lastVideoId = null;
const YT_CHANNEL_ID = 'UCcgSBkJ9UkQZkxRGazqgR_g';
const DISCORD_CHANNEL_ID = '1367902502892081323';

async function checkYouTube() {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)'
      }
    });

    const text = await res.text();

    if (!text.startsWith('<?xml')) {
      throw new Error('Invalid response from YouTube (not XML)');
    }

    const data = await parseStringPromise(text);
    const latest = data.feed.entry?.[0];
    if (!latest) return;

    const videoId = latest['yt:videoId'][0];
    const videoTitle = latest.title[0];
    const videoUrl = latest.link[0].$.href;

    if (videoId !== lastVideoId) {
      lastVideoId = videoId;
      const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
      if (channel) {
        channel.send(`🎬 **New YouTube Video Uploaded!**\n📌 **${videoTitle}**\n▶️ ${videoUrl}`);
        console.log(`📢 Sent ping for: ${videoTitle}`);
      }
    } else {
      console.log('⏱️ No new video.');
    }
  } catch (err) {
    console.error('YouTube check failed:', err.message);
  }
}

function startYouTubeCheck() {
  checkYouTube();
  setInterval(checkYouTube, 5 * 60 * 1000); // every 5 mins
}

// === Render keep-alive ===
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// Login
client.login(process.env.TOKEN)
