const express = require('express');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🌐 Keep Render service alive
app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// 🎮 Discord Client Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// 🔐 Login with Discord token
client.login(process.env.DISCORD_TOKEN);

// 📺 YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

// 📤 Function to fetch latest video
async function fetchLatest(channelId) {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      channelId,
      maxResults: 1,
      order: 'date',
      type: ['video'],
    });

    const video = response.data.items[0];
    if (!video) {
      console.log('❌ No video found.');
      return;
    }

    if (video.id.videoId === lastVideoId) {
      console.log('🔁 No new video.');
      return;
    }

    lastVideoId = video.id.videoId;
    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${lastVideoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;

    console.log(`
🎬 **New Video Alert!**
**${title}**
👉 Watch now: ${url}
Thumbnail: ${thumbnail}
    `);

    // Fetch the Discord channel fresh (fix for "channel not found")
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID).catch(() => null);
    if (channel) {
      await channel.send({
        content: `🎬 **New Video Alert!**\n**${title}**\n👉 Watch now: ${url}`,
        embeds: [
          {
            title,
            url,
            image: { url: thumbnail },
            color: 0xff0000,
          },
        ],
      });
    } else {
      console.log('❌ Discord channel not found.');
    }
  } catch (err) {
    console.error('⚠️ Failed to fetch latest video or send message:', err.message);
  }
}

// 🔍 Resolve YouTube channel ID from handle
async function getChannelId(handle) {
  try {
    const res = await youtube.search.list({
      part: ['snippet'],
      q: handle,
      type: ['channel'],
      maxResults: 1,
    });

    return res.data.items[0]?.snippet.channelId;
  } catch (err) {
    console.error('⚠️ Error resolving handle:', err.message);
    return null;
  }
}

// 🚀 Bot start logic
(async () => {
  const handle = '@crazyechoo';
  const channelId = await getChannelId(handle.replace('@', ''));

  if (!channelId) {
    console.error('❌ Could not find channel.');
    return;
  }

  console.log(`✅ Monitoring channel ID: ${channelId}`);

  await fetchLatest(channelId); // Check immediately

  setInterval(() => {
    fetchLatest(channelId);
  }, 1 * 60 * 1000); // Check every 1 mins
})();
