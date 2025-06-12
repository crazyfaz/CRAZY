const express = require('express');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Keep Render service alive
app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// Discord Client Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Show status and activity when bot is ready
client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("ㄈＲΛＺƳ   亗 YouTube", {
    type: "WATCHING",
  });
});

// Allow only bot owner to delete bot messages
const OWNER_ID = '1354501822429265921';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (
    message.reference &&
    message.content.trim().toLowerCase() === '!delete' &&
    message.author.id === OWNER_ID
  ) {
    try {
      const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMsg.author.id === client.user.id) {
        await repliedMsg.delete();
        await message.delete(); // Delete the command message too
        console.log(`🗑️ Bot message deleted by owner.`);
      }
    } catch (err) {
      console.error('⚠️ Failed to delete message:', err.message);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

// Notify only the test channel
async function notifyAllDiscordChannels(title, url, thumbnail) {
  const channelIds = process.env.DISCORD_CHANNEL_IDS.split(',');
  for (const id of channelIds) {
    const channelId = id.trim();
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        console.warn(`⚠️ Channel ID ${channelId} not found or inaccessible.`);
        continue;
      }

      await channel.send({
        content: `CRAZY just posted a video!`,
        embeds: [
          {
            title: title,
            url: url,
            image: { url: thumbnail },
            color: 0xff0000,
          },
        ],
      });
    } catch (err) {
      console.warn(`⚠️ Failed to send to ${channelId}: ${err.message}`);
    }
  }
}

// Fetch latest video from the uploads playlist
async function fetchLatestFromPlaylist(uploadsPlaylistId) {
  try {
    const response = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
      order: 'desc',
    });

    const video = response.data.items[0];
    if (!video) {
      console.log('❌ No video found in uploads playlist.');
      return;
    }

    const videoId = video.snippet.resourceId.videoId;
    if (videoId === lastVideoId) {
      console.log('🔁 No new video detected.');
      return;
    }

    lastVideoId = videoId;

    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;

    console.log(`CRAZY just posted a video!\n${url}\nThumbnail: ${thumbnail}`);

    await notifyAllDiscordChannels(title, url, thumbnail);
  } catch (err) {
    console.error('⚠️ Failed to fetch latest video from playlist:', err.message);
  }
}

// Start monitoring
(async () => {
  const uploadsPlaylistId = "UUkKyIbpw_q9KKok7ED0u4hA"; // Hardcoded for @crazyechoo
  console.log(`✅ Using hardcoded uploads playlist ID: ${uploadsPlaylistId}`);

  await fetchLatestFromPlaylist(uploadsPlaylistId); // Initial check

  setInterval(() => {
    fetchLatestFromPlaylist(uploadsPlaylistId);
  }, 60 * 1000); // Check every 1 minute
})();
