require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity('ㄈＲΛＺƳ   亗  YouTube', { type: 'WATCHING' });
});

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
        await message.delete();
        console.log(`🗑️ Bot message deleted by owner.`);
      }
    } catch (err) {
      console.error('⚠️ Failed to delete message:', err.message);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// YouTube setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

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

async function getChannelIdBySearch(query) {
  try {
    const res = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults: 1,
    });
    const id = res.data.items[0]?.snippet?.channelId;
    if (!id) {
      console.error('❌ No channel found.');
    }
    return id;
  } catch (err) {
    console.error('⚠️ Error searching channel:', err.message);
    return null;
  }
}

async function getUploadsPlaylistId(channelId) {
  try {
    const response = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });

    const playlistId = response.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!playlistId) {
      console.error('❌ Uploads playlist not found for channel.');
      return null;
    }

    console.log(`✅ Uploads playlist ID: ${playlistId}`);
    return playlistId;
  } catch (err) {
    console.error('⚠️ Error fetching uploads playlist:', err.message);
    return null;
  }
}

async function fetchLatestFromPlaylist(playlistId) {
  try {
    const response = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId,
      maxResults: 1,
      order: 'date',
    });

    const video = response.data.items[0];
    if (!video) {
      console.log('❌ No video found in playlist.');
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

    console.log(`📢 New video found: ${url}`);
    await notifyAllDiscordChannels(title, url, thumbnail);
  } catch (err) {
    console.error('⚠️ Failed to fetch latest video from playlist:', err.message);
  }
}

(async () => {
  const searchQuery = 'CRAZY ECHOO'; // Exact name of your channel
  const channelId = await getChannelIdBySearch(searchQuery);

  if (!channelId) return;
  console.log(`✅ Monitoring channel ID: ${channelId}`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) return;

  await fetchLatestFromPlaylist(uploadsPlaylistId);

  setInterval(() => {
    fetchLatestFromPlaylist(uploadsPlaylistId);
  }, 60 * 1000);
})();
