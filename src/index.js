// ✅ CRAZY BOT – index.js (Fixed Version: No posted_videos.json, In-Memory Cache)

const express = require('express');
const { google } = require('googleapis');
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('✅ Crazy Bot is running!'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// === Slash Commands ===
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

// === Button Handlers ===
client.buttons = new Collection();
const buttonsPath = path.join(__dirname, 'buttons');
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    if (button.customId && button.execute) {
      client.buttons.set(button.customId, button);
    }
  }
}

// === Interaction Handler ===
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error executing command '${interaction.commandName}':`, error);
      await interaction.reply({
        content: '❌ There was an error executing this command.',
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    const button = [...client.buttons.values()].find(handler =>
      typeof handler.customId === 'string'
        ? handler.customId === interaction.customId
        : handler.customId instanceof RegExp && handler.customId.test(interaction.customId)
    );
    if (!button) return;
    try {
      await button.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error in button '${interaction.customId}':`, error);
    }
  }
});

// === Deploy Slash Commands ===
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log('✅ Slash commands deployed.');
  } catch (err) {
    console.error('❌ Failed to deploy slash commands:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);

// === YOUTUBE CHECKER (NO FILE STORAGE) ===
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let postedVideos = new Set();

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
    console.log('⏱️ Checking for new video at:', new Date().toLocaleString());
    const res = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });

    const video = res.data.items[0];
    if (!video) return;

    const videoId = video.snippet.resourceId.videoId;
    const publishedAt = new Date(video.snippet.publishedAt);
    const today = new Date();

    if (
      publishedAt.getDate() !== today.getDate() ||
      publishedAt.getMonth() !== today.getMonth() ||
      publishedAt.getFullYear() !== today.getFullYear()
    ) return;

    if (postedVideos.has(videoId)) {
      console.log('🔁 Video already posted before.');
      return;
    }

    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;
    const channelIds = process.env.DISCORD_CHANNEL_IDS.split(',').map(id => id.trim());

    for (const channelId of channelIds) {
      try {
        const ch = await client.channels.fetch(channelId);
        if (ch && ch.isTextBased()) {
          await ch.send({
            content: `just uploaded a video!\n${url}`,
            embeds: [
              {
                author: {
                  name: 'YouTube',
                  icon_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
                },
                title: 'CRAZY 亗',
                description: `[${title}](${url})`,
                image: { url: thumbnail },
                thumbnail: { url: 'https://i.postimg.cc/t48vhgTw/Untitled39-20250616210053.png' },
                color: 0xff0000,
                footer: { text: new Date().toLocaleDateString('en-GB') },
              },
            ],
          });
          console.log(`✅ Sent update to channel: ${channelId}`);
        }
      } catch (err) {
        console.error(`❌ Failed to send to channel ${channelId}: ${err.message}`);
      }
    }

    postedVideos.add(videoId);
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
  if (!channelId) return;
  console.log(`✅ Monitoring channel ID: ${channelId}`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) return;
  console.log(`✅ Uploads playlist ID: ${uploadsPlaylistId}`);

  await fetchLatestFromPlaylist(uploadsPlaylistId);
  setInterval(() => fetchLatestFromPlaylist(uploadsPlaylistId), 10 * 1000); // every 10 seconds
})();
