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

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// Only allow this user to delete bot messages
const OWNER_ID = '1354501822429265921';

// Command: Delete bot message by replying with !delete
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

// Login with Discord token
client.login(process.env.DISCORD_TOKEN);

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

// Send to multiple channels
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

// Get Uploads Playlist ID
async function getUploadsPlaylistId(channelId) {
  try {
    const response = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    return response.data.items[0].contentDetails.relatedPlaylists.uploads;
  } catch (err) {
    console.error('⚠️ Error fetching uploads playlist:', err.message);
    return null;
  }
}

// Check for latest video
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

// Resolve channel ID from handle
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

// Start monitoring
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

  await fetchLatestFromPlaylist(uploadsPlaylistId); // Initial check

  setInterval(() => {
    fetchLatestFromPlaylist(uploadsPlaylistId);
  }, 60 * 1000); // Check every 1 minute
})();
