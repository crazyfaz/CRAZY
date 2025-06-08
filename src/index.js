const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 👻 Fake web server (keeps Render alive)
app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// 🔧 YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

// 📺 Fetch latest video
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
  } catch (err) {
    console.error('⚠️ Failed to fetch latest video:', err.message);
  }
}

// 🔍 Get Channel ID from Handle
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

// 🚀 Start the bot
(async () => {
  const handle = '@crazyechoo';
  const channelId = await getChannelId(handle.replace('@', ''));

  if (!channelId) {
    console.error('❌ Could not find channel.');
    return;
  }

  console.log(`✅ Monitoring channel ID: ${channelId}`);

  await fetchLatest(channelId); // Check once at start

  setInterval(() => {
    fetchLatest(channelId);
  }, 10 * 60 * 1000); // Every 10 mins
})();
