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

app.get('/', (req, res) => {
  res.send('✅ Crazy Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// ===== Load Slash Commands =====
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ Invalid command file: ${file}`);
    }
  }
}

// ===== Load Button Handlers =====
client.buttons = new Collection();
const buttonsPath = path.join(__dirname, 'buttons');
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    if (button.customId && button.execute) {
      client.buttons.set(button.customId, button);
    } else {
      console.warn(`⚠️ Invalid button handler: ${file}`);
    }
  }
}

// ===== Interaction Handler =====
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

    if (!button) {
      console.warn(`⚠️ No handler for button ID: ${interaction.customId}`);
      return;
    }

    try {
      await button.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error in button '${interaction.customId}':`, error);
    }
  }
});

// ===== On Ready & Slash Deployment =====
client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('⏳ Refreshing application (/) commands for GUILD...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('⏳ Deploying global application (/) commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Successfully reloaded guild and global (/) commands.');
  } catch (err) {
    console.error('❌ Failed to reload slash commands:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);

// ====== YouTube Upload Checker with API Key Rotation ======
const POSTED_FILE = path.join(__dirname, 'posted_videos.json');
let postedVideos = [];

try {
  if (fs.existsSync(POSTED_FILE)) {
    postedVideos = JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
  }
} catch (_) {}

const apiKeys = process.env.YOUTUBE_API_KEYS.split(',');
let currentKeyIndex = 0;

function getYouTubeClient() {
  return google.youtube({ version: 'v3', auth: apiKeys[currentKeyIndex] });
}

async function rotateApiKeyAndRetry(task) {
  const maxTries = apiKeys.length;
  for (let i = 0; i < maxTries; i++) {
    const youtube = getYouTubeClient();
    try {
      return await task(youtube);
    } catch (err) {
      const reason = err?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        continue;
      }
      break; // fail silently for other issues
    }
  }
  return null;
}

async function savePostedVideos(data) {
  try {
    fs.writeFileSync(POSTED_FILE, JSON.stringify(data, null, 2));
  } catch (_) {}
}

async function getUploadsPlaylistId(channelId) {
  return await rotateApiKeyAndRetry(async youtube => {
    const res = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });
    return res.data.items[0].contentDetails.relatedPlaylists.uploads;
  });
}

async function fetchLatestFromPlaylist(uploadsPlaylistId) {
  const video = await rotateApiKeyAndRetry(async youtube => {
    const res = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });
    return res.data.items[0];
  });

  if (!video) return;

  const videoId = video.snippet.resourceId.videoId;
  const publishedAt = new Date(video.snippet.publishedAt);
  const today = new Date();

  const isToday =
    publishedAt.getUTCFullYear() === today.getUTCFullYear() &&
    publishedAt.getUTCMonth() === today.getUTCMonth() &&
    publishedAt.getUTCDate() === today.getUTCDate();

  if (!isToday || postedVideos.includes(videoId)) return;

  const title = video.snippet.title;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = video.snippet.thumbnails.high.url;
  const dateString = publishedAt.toLocaleDateString('en-GB');

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
              thumbnail: {
                url: 'https://i.postimg.cc/t48vhgTw/Untitled39-20250616210053.png',
              },
              color: 0xff0000,
              footer: { text: dateString },
            },
          ],
        });

        postedVideos.push(videoId);
        await savePostedVideos(postedVideos);
      }
    } catch (_) {}
  }
}

async function getChannelId(handle) {
  return await rotateApiKeyAndRetry(async youtube => {
    const res = await youtube.search.list({
      part: ['snippet'],
      q: handle,
      type: ['channel'],
      maxResults: 1,
    });
    return res.data.items[0]?.snippet.channelId;
  });
}

(async () => {
  const handle = '@crazyechoo';
  const channelId = await getChannelId(handle.replace('@', ''));
  if (!channelId) return;
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) return;
  await fetchLatestFromPlaylist(uploadsPlaylistId);
  setInterval(() => fetchLatestFromPlaylist(uploadsPlaylistId), 10 * 1000); // every 10 seconds
})();
