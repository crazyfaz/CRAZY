const {
  EmbedBuilder
} = require('discord.js');
const axios = require('axios');
const scenarios = require('../utils/crazyScenarios');

const GIPHY_API = process.env.GIPHY_API_KEY;

const winnerKeywords = ["gangster win", "explosion", "badass escape", "money rain"];
const loserKeywords = ["epic fail", "shot", "arrested", "dark ending"];

module.exports = {
  customId: /^crazy_choice_(.+)$/,

  async execute(interaction) {
    const choice = interaction.customId.replace('crazy_choice_', '');

    // Find the scenario used (assumes it's the last sent by this bot)
    const scenario = scenarios.find(s => 
      Object.keys(s.outcomes).includes(choice)
    );

    if (!scenario) {
      return interaction.reply({
        content: "❌ Scenario logic failed. Try again.",
        ephemeral: true
      });
    }

    const outcome = scenario.outcomes[choice];

    const keywordList = outcome.success ? winnerKeywords : loserKeywords;
    const query = keywordList[Math.floor(Math.random() * keywordList.length)];

    let gifUrl = null;
    try {
      const res = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: GIPHY_API,
          q: query,
          limit: 10,
          rating: 'pg-13'
        }
      });
      const gifs = res.data.data;
      if (gifs.length) {
        gifUrl = gifs[Math.floor(Math.random() * gifs.length)].images.original.url;
      }
    } catch (e) {
      console.error("GIPHY Error:", e.message);
    }

    const embed = new EmbedBuilder()
      .setTitle(outcome.title)
      .setDescription(outcome.description)
      .setColor(outcome.success ? 0x00FF66 : 0xFF0000)
      .setImage(gifUrl || null);

    await interaction.reply({ embeds: [embed] });
  }
};
