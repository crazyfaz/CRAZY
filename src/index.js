const express = require('express');
const { google } = require('googleapis');
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes
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

// ====== Slash Commands Loader ======
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

// ====== Button Handlers Loader ======
client.buttons = new Collection();
const buttonsPath = path.join(__dirname, 'buttons');
if (fs.existsSync(buttonsPath)) {
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
  for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    if (button.customId && button.execute) {
      client.buttons.set(button.customId, button);
    } else {
      console.warn(`⚠️ Invalid button file: ${file}`);
    }
  }
}

// ====== Interactions Handler ======
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error executing command '${interaction.commandName}':`, error);
      await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
    }
  } else if (interaction.isButton()) {
    const button = client.buttons.get(interaction.customId);
    if (!button) return;
    try {
      await button.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error executing button '${interaction.customId}':`, error);
      await interaction.reply({ content: '❌ There was an error executing this button.', ephemeral: true });
    }
  }
});

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

// ========== YOUTUBE UPLOAD CHECKER ==========
const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY });
const POSTED_FILE = path.join(__dirname, 'posted_videos.json');
let postedVideos = [];

try {
  if (fs.existsSync(POSTED_FILE)) {
    postedVideos = JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
  }
} catch (err) {
  console.error('⚠️ Failed to load posted_videos.json:', err.message);
}

async function savePostedVideos(data) {
  try {
    fs.writeFileSync(POSTED_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Saved videos:', data);
    console.log('🕒 Saved at:', new Date().toLocaleString());
  } catch (err) {
    console.error('⚠️ Failed to save posted_videos.json:', err.message);
  }
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
    console.log('⏱️ Checking for new video at:', new Date().toLocaleString());

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
    const publishedAt = new Date(video.snippet.publishedAt);
    const today = new Date();
    const dateString = publishedAt.toLocaleDateString('en-GB');

    if (
      publishedAt.getDate() !== today.getDate() ||
      publishedAt.getMonth() !== today.getMonth() ||
      publishedAt.getFullYear() !== today.getFullYear()
    ) {
      console.log('📅 Video is not from today. Skipping post.');
      return;
    }

    if (postedVideos.includes(videoId)) {
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
                  icon_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
                },
                title: 'CRAZY 亗',
                description: `[${title}](${url})`,
                image: { url: thumbnail },
                thumbnail: {
                  url: 'https://i.postimg.cc/t48vhgTw/Untitled39-20250616210053.png'
                },
                color: 0xff0000,
                footer: {
                  text: dateString
                }
              },
            ],
          });

          postedVideos.push(videoId);
          await savePostedVideos(postedVideos);

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
  }, 60 * 1000); // every 1 minute
})()
