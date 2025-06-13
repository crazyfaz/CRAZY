require("dotenv").config();
console.log("Loaded channel IDs:", JSON.stringify(process.env.DISCORD_CHANNEL_IDS));

const express = require("express");
const { google } = require("googleapis");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Crazy Bot is running!");
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

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("ㄈＲΛＺƳ 亗 YouTube", {
    type: "WATCHING",
  });

  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(channel => {
      if (channel.isTextBased()) {
        console.log(`📌 Bot sees channel: ${channel.id} - ${channel.name}`);
      }
    });
  });
});

const OWNER_ID = "1354501822429265921";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (
    message.reference &&
    message.content.trim().toLowerCase() === "!delete" &&
    message.author.id === OWNER_ID
  ) {
    try {
      const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMsg.author.id === client.user.id) {
        await repliedMsg.delete();
        await message.delete();
        console.log("🗑️ Bot message deleted by owner.");
      }
    } catch (err) {
      console.error("⚠️ Failed to delete message:", err.message);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

let lastVideoId = null;

async function notifyDiscordChannels(title, url, thumbnail) {
  const channelIds = process.env.DISCORD_CHANNEL_IDS.split(",").map(id => id.trim());

  for (const id of channelIds) {
    try {
      const channel = await client.channels.fetch(id);
      if (!channel || !channel.isTextBased()) {
        console.warn(`⚠️ Channel ID ${id} not found or not text-based.`);
        continue;
      }

      await channel.send({
        content: `📢 CRAZY just posted a video!`,
        embeds: [
          {
            title: title,
            url: url,
            image: { url: thumbnail },
            color: 0xff0000,
          },
        ],
      });
      console.log(`✅ Sent video to ${channel.name}`);
    } catch (err) {
      console.warn(`⚠️ Failed to send to ${id}: ${err.message}`);
    }
  }
}

async function getUploadsPlaylistId(channelId) {
  try {
    const response = await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });

    return response.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  } catch (err) {
    console.error("⚠️ Error fetching uploads playlist:", err.message);
    return null;
  }
}

async function fetchLatestFromPlaylist(uploadsPlaylistId) {
  try {
    const response = await youtube.playlistItems.list({
      part: ["snippet"],
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });

    const video = response.data.items?.[0];
    if (!video) {
      console.log("❌ No video found in uploads playlist.");
      return;
    }

    const videoId = video.snippet.resourceId.videoId;
    if (videoId === lastVideoId) {
      console.log("🔁 No new video detected.");
      return;
    }

    lastVideoId = videoId;
    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;

    console.log(`📢 New video found: ${url}`);
    await notifyDiscordChannels(title, url, thumbnail);
  } catch (err) {
    console.error("⚠️ Failed to fetch latest video:", err.message);
  }
}

(async () => {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  console.log(`✅ Monitoring channel ID: ${channelId}`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) {
    console.error("❌ Could not find uploads playlist.");
    return;
  }

  console.log(`✅ Uploads playlist ID: ${uploadsPlaylistId}`);

  await fetchLatestFromPlaylist(uploadsPlaylistId);
  setInterval(() => fetchLatestFromPlaylist(uploadsPlaylistId), 60 * 1000);
})()
