const express = require('express');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Keep alive endpoint
app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

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

// File-based tracking of posted videos
const POSTED_FILE = path.join(__dirname, 'posted_videos.json');
let postedVideos = [];

try {
  if (fs.existsSync(POSTED_FILE)) {
    postedVideos = JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
  }
} catch (err) {
  console.error('⚠️ Failed to load posted_videos.json:', err.message);
}

async function getUploadsPlaylistId(channelId) {
  try {
    const res = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    return res.data.items[0].contentDetails.relatedPlaylists.uploads;
  } catch (err) {
    console.error('⚠️ Error fetching uploads playlist:', err.message);
    return null;
  }
}

async function fetchLatestFromPlaylist(uploadsPlaylistId) {
  try {
    const res = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
      order: 'desc',
    });

    const video = res.data.items[0];
    if (!video) {
      console.log('❌ No video found.');
      return;
    }

    const videoId = video.snippet.resourceId.videoId;

    // Check if already posted
    if (postedVideos.includes(videoId)) {
      console.log('🔁 Video already posted before.');
      return;
    }

    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;

    console.log(`🎬 New video: ${title} (${url})`);

    const channelIds = process.env.DISCORD_CHANNEL_IDS.split(',').map(id => id.trim());
    for (const channelId of channelIds) {
      try {
        const ch = await client.channels.fetch(channelId);
        if (ch && ch.isTextBased()) {
          await ch.send({
            content: `CRAZY just uploaded a video!\n${url}`,
            embeds: [
              {
                author: {
                  name: 'YouTube',
                  icon_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
                },
                title: 'CRAZY·亗',
                description: `[${title}](${url})`,
                image: { url: thumbnail },
                color: 0xff0000,
              },
            ],
          });

          // Save video ID after posting
          postedVideos.push(videoId);
          fs.writeFileSync(POSTED_FILE, JSON.stringify(postedVideos, null, 2));

          console.log(`✅ Sent update to channel: ${channelId}`);
        } else {
          console.error(`❌ Channel ${channelId} is not text-based.`);
        }
      } catch (err) {
        console.error(`❌ Failed to send to channel ${channelId}: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('⚠️ Failed to fetch latest video:', err.message);
  }
}

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

(async () => {
  const handle = '@crazyechoo';
  const channelId = await getChannelId(handle.replace('@', ''));

  if (!channelId) {
    console.error('❌ Could not find channel.');
    return;
  }

  console.log(`✅ Monitoring channel ID: ${channelId}`);
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);

  if (!uploadsPlaylistId) {
    console.error('❌ Could not find uploads playlist.');
    return;
  }

  console.log(`✅ Uploads playlist ID: ${uploadsPlaylistId}`);

  await fetchLatestFromPlaylist(uploadsPlaylistId);
  setInterval(() => {
    fetchLatestFromPlaylist(uploadsPlaylistId);
  }, 60 * 1000); // every 1 min
})();
