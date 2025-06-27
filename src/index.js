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
const fs = require('fs'); // ✅ Added this line
const path = require('path');
require('dotenv').config();

// ✅ Firebase Setup
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDLaXhM__YYJuopSdbIGRpbDSmLKtE0Fws",
  authDomain: "crazy-bot-db.firebaseapp.com",
  databaseURL: "https://crazy-bot-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crazy-bot-db",
  storageBucket: "crazy-bot-db.firebasestorage.app",
  messagingSenderId: "658743489805",
  appId: "1:658743489805:web:2beb79f7e28ff255cdac44"
};

const appFB = initializeApp(firebaseConfig);
const db = getDatabase(appFB);

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

// ====== YouTube Upload Checker ======
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

let postedVideos = [];

async function loadPostedVideos() {
  try {
    const snapshot = await get(ref(db, 'videos'));
    if (snapshot.exists()) {
      postedVideos = snapshot.val() || [];
    } else {
      postedVideos = [];
    }
    console.log('📥 Loaded posted videos from Firebase:', postedVideos);
  } catch (err) {
    console.error('⚠️ Failed to load posted videos from Firebase:', err.message);
    postedVideos = [];
  }
}

async function savePostedVideos(data) {
  try {
    await set(ref(db, 'videos'), data);
    console.log('💾 Saved posted videos to Firebase.');
  } catch (err) {
    console.error('⚠️ Failed to save posted videos to Firebase:', err.message);
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
    const now = new Date();

    const isToday =
      publishedAt.getDate() === now.getDate() &&
      publishedAt.getMonth() === now.getMonth() &&
      publishedAt.getFullYear() === now.getFullYear();

    if (!isToday) {
      console.log('📅 ❌ Video is NOT from today. Skipping post.');
      return;
    }

    if (postedVideos.includes(videoId)) {
      console.log('🔁 Video already posted before.');
      return;
    }

    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail =
      video.snippet.thumbnails?.high?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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

(async () => {
  await loadPostedVideos();
  const channelId = 'UCmU4vBGV9FRwvLE0jOUiGrg';
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
  }, 10 * 1000);
})();
