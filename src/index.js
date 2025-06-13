const express = require('express');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Keep service alive
app.get('/', (req, res) => res.send('✅ Crazy Bot is running!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// Discord client setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

// Helper: Get uploads playlist ID
async function getUploadsPlaylistId(channelId) {
  try {
    const res = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    return res.data.items[0]?.contentDetails.relatedPlaylists.uploads || null;
  } catch (err) {
    console.error('⚠️ Error fetching uploads playlist:', err.message);
    return null;
  }
}

// Fetch + post latest video
async function fetchLatest(uploadsPlaylistId) {
  try {
    const res = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });

    const video = res.data.items[0];
    if (!video) return;

    const videoId = video.snippet.resourceId.videoId;
    if (videoId === lastVideoId) {
      console.log('🔁 No new video detected.');
      return;
    }

    lastVideoId = videoId;

    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;

    console.log(`🎬 New video: ${title} (${url})`);

    const embed = {
      title,
      url,
      image: { url: thumbnail },
      color: 0xff0000,
    };

    // Post in multiple channels
    const channelIds = process.env.DISCORD_CHANNEL_IDS.split(',');
    channelIds.forEach(id => {
      const ch = client.channels.cache.get(id.trim());
      if (ch) {
        ch.send({
          content: `🎬 **New Video Alert!**\n**${title}**\n👉 Watch now: ${url}`,
          embeds: [embed],
        }).catch(err => console.error(`❌ Failed to send to ${id}: ${err.message}`));
      } else {
        console.error(`❌ Channel ${id} not found in cache.`);
      }
    });

  } catch (err) {
    console.error('⚠️ Error fetching latest video:', err.message);
  }
}

(async () => {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    console.error('❌ No YOUTUBE_CHANNEL_ID in .env');
    return;
  }

  console.log(`✅ Monitoring YouTube channel: ${channelId}`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) {
    console.error('❌ Could not get uploads playlist.');
    return;
  }

  console.log(`✅ Uploads playlist ID: ${uploadsPlaylistId}`);

  await fetchLatest(uploadsPlaylistId);

  setInterval(() => fetchLatest(uploadsPlaylistId), 60 * 1000);
})();
