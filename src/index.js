const { google } = require('googleapis');
const youtube = google.youtube({
  version: 'v3',
  auth: 'AIzaSyAzbB6FVre9cIud-UXrP4EFahHrOHg4G8k', // Your new API key
});

// Helper function to get channel ID from handle
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
    console.error('Error fetching channel ID:', error);
    throw error;
  }
}

// Function to announce the latest video
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
      console.log('No videos found for this channel.');
      return;
    }

    const video = response.data.items[0];
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.high.url;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Pretty announcement
    const announcement = `
🎬 **New Video Alert!**

**${title}**

👉 Watch now: ${videoUrl}

Thumbnail: ${thumbnail}
    `;

    // For console:
    console.log(announcement);

    // If using Discord.js or other platform, you can send embed message here
  } catch (error) {
    console.error('Failed to fetch or announce video:', error);
  }
}

// Main function to coordinate
async function main() {
  const handle = '@crazyechoo'; // your channel handle (including '@')
  // Remove '@' from handle for search
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  try {
    const channelId = await getChannelIdFromHandle(cleanHandle);
    console.log(`Resolved channel ID: ${channelId}`);

    await announceLatestVideo(channelId);
  } catch (error) {
    console.error('Error in main execution:', error);
  }
}

main();
