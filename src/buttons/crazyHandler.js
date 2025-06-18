const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  async execute(interaction, client) {
    const customId = interaction.customId;
    if (!customId.startsWith('crazy_choice_')) return;

    const choice = customId.replace('crazy_choice_', '');
    const scenario = client.activeScenario;

    if (!scenario || !scenario.outcomes[choice]) {
      return interaction.reply({ content: '❌ Unknown choice or scenario expired.', ephemeral: true });
    }

    const outcome = scenario.outcomes[choice];
    const keywords = outcome.success
      ? ["winner", "escape", "gangster win", "fireworks", "survive"]
      : ["fail", "you died", "trap", "sad gangster", "lost"];
    const searchTerm = keywords[Math.floor(Math.random() * keywords.length)];

    try {
      const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: process.env.GIPHY_API_KEY,
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
        .setTitle(outcome.title)
        .setDescription(outcome.description)
        .setImage(gifUrl)
        .setColor(outcome.success ? 0x00FF66 : 0xFF0033);

      await interaction.update({ embeds: [embed], components: [] });

    } catch (err) {
      console.error('GIPHY error:', err.message);
      await interaction.update({
        content: outcome.description,
        components: [],
      });
    }
  }
}
