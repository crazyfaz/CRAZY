const { google } = require('googleapis');
const fs = require('fs');

// YouTube setup
const youtube = google.youtube({
  version: 'v3',
  auth: 'AIzaSyAzbB6FVre9cIud-UXrP4EFahHrOHg4G8k', // Your API key
});

const handle = '@crazyechoo'; // your YouTube handle
const CHECK_INTERVAL = 60 * 1000; // check every 60 seconds
const lastVideoFile = 'lastVideo.json';
let lastVideoId = null;

// Load last known video ID
if (fs.existsSync(lastVideoFile)) {
  try {
    const data = fs.readFileSync(lastVideoFile);
    lastVideoId = JSON.parse(data).videoId;
  } catch (err) {
    console.error("Failed to read last video file:", err);
  }
}

// Helper: get channel ID from handle
async function getChannelIdFromHandle(handle) {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: handle,
      type: ['channel'],
      maxResults: 1,
    });
    const channels = response.data.items;
    if (channels.length === 0) {
      throw new Error(`No channel found for handle: ${handle}`);
    }
    return channels[0].snippet.channelId;
  } catch (error) {
    console.error('Error fetching channel ID:', error.message);
    throw error;
  }
}

// Announce latest video
async function announceLatestVideo(channelId) {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      channelId: channelId,
      maxResults: 1,
      order: 'date',
      type: ['video'],
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log('No videos found.');
      return;
    }

    const video = response.data.items[0];
    const videoId = video.id.videoId;

    if (videoId === lastVideoId) {
      console.log('🔁 No new video.');
      return;
    }

    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.high.url;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const announcement = `
🎬 **New Video Alert!**

**${title}**

👉 Watch now: ${videoUrl}

Thumbnail: ${thumbnail}
    `;

    console.log(announcement);

    // Save last video ID to file
    lastVideoId = videoId;
    fs.writeFileSync(lastVideoFile, JSON.stringify({ videoId }));

  } catch (error) {
    console.error('❌ Error announcing video:', error.message);
  }
}

// Main loop
async function startBot() {
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  try {
    const channelId = await getChannelIdFromHandle(cleanHandle);
    console.log(`Resolved channel ID: ${channelId}`);

    // Run once immediately, then every minute
    await announceLatestVideo(channelId);
    setInterval(() => announceLatestVideo(channelId), CHECK_INTERVAL);

    // Keep alive
    process.stdin.resume();

  } catch (error) {
    console.error('🔥 Fatal error in bot:', error.message);
  }
}

startBot();
