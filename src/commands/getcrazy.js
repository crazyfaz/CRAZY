const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const challenges = [
  {
    task: "Spam 🍌 10 times in 10 seconds",
    keyword: "banana monkey",
  },
  {
    task: "Say 'I'm crazy' 5 times FAST",
    keyword: "crazy laugh",
  },
  {
    task: "React to 3 messages in 5 seconds",
    keyword: "reaction madness",
  },
  {
    task: "Send 🐸🐸🐸 and tag a friend",
    keyword: "funny frog",
  },
  {
    task: "Say a tongue-twister in 10 seconds",
    keyword: "tongue twister fail",
  }
];

const loserKeywords = ["you failed", "cringe", "facepalm", "disappointed", "epic fail"];
const winnerKeywords = ["you win", "winner", "applause", "fireworks", "congrats"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getcrazy')
    .setDescription('🤪 Start a crazy game! Win or get roasted.'),

  async execute(interaction) {
    const apiKey = process.env.GIPHY_API_KEY;
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];

    await interaction.reply({
      content: `😜 **Your Crazy Task:** ${challenge.task}\n*Did you complete it?* Reply with **yes** or **no** below...`,
      ephemeral: false
    });

    const filter = msg =>
      msg.author.id === interaction.user.id &&
      ["yes", "no"].includes(msg.content.toLowerCase());

    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 15000,
      max: 1
    });

    collector.on('collect', async msg => {
      const success = msg.content.toLowerCase() === "yes";
      const searchTerm = success
        ? winnerKeywords[Math.floor(Math.random() * winnerKeywords.length)]
        : loserKeywords[Math.floor(Math.random() * loserKeywords.length)];

      try {
        const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
          params: {
            api_key: apiKey,
            q: searchTerm,
            limit: 10,
            rating: "pg"
          }
        });

        const gifs = res.data.data;
        const gifUrl = gifs.length > 0
          ? gifs[Math.floor(Math.random() * gifs.length)].images.original.url
          : null;

        const embed = new EmbedBuilder()
          .setTitle(success ? "🎉 You did it!" : "💀 You failed!")
          .setDescription(success
            ? `You're crazy enough 😈`
            : `You gotta try harder next time 😭`)
          .setImage(gifUrl || null)
          .setColor(success ? 0x00FF66 : 0xFF0033)
          .setFooter({ text: `Challenge: ${challenge.task}` });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('start_crazy_game')
            .setLabel('🔁 Start New Game')
            .setStyle(ButtonStyle.Primary)
        );

        await msg.reply({ embeds: [embed], components: [row] });

      } catch (err) {
        console.error('GIPHY API error:', err.message);
        await msg.reply("⚠️ Couldn't fetch a reward GIF. But you still played like a champ!");
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp("⏰ You didn’t reply in time! Try `/getcrazy` again.");
      }
    });
  },
}
