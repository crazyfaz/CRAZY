const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fake web server for Render (keeps it alive)
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

// ---------------- YouTube Bot Code ----------------
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

async function fetchLatest(channelId) {
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
}

async function getChannelId(handle) {
  const res = await youtube.search.list({
    part: ['snippet'],
    q: handle,
    type: ['channel'],
    maxResults: 1,
  });

  return res.data.items[0]?.snippet.channelId;
}

(async () => {
  const handle = '@crazyechoo';
  const channelId = await getChannelId(handle.replace('@', ''));

  if (!channelId) {
    console.error('❌ Could not find channel.');
    return;
  }

  console.log(`✅ Monitoring channel ID: ${channelId}`);

  await fetchLatest(channelId); // Run once now

  setInterval(() => {
    fetchLatest(channelId);     // Then every 10 mins
  }, 10 * 60 * 1000);
})();
