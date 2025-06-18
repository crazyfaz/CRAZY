const { SlashCommandBuilder } = require('discord.js');
const getcrazy = require('../commands/getcrazy');

module.exports = {
  customId: 'start_crazy_game',

  async execute(interaction, client) {
    try {
      // Defer the update so the button doesn't timeout
      await interaction.deferUpdate();

      // Create a dummy object that mimics a chat input interaction
      const fakeInteraction = {
        ...interaction,
        reply: (...args) => interaction.channel.send(...args),
        followUp: (...args) => interaction.channel.send(...args),
        user: interaction.user,
        channel: interaction.channel,
        client: client,
      };

      await getcrazy.execute(fakeInteraction, client);
    } catch (err) {
      console.error('startcrazy.js error:', err.message);
      await interaction.followUp({
        content: '❌ An error occurred while starting the crazy game.',
        ephemeral: true,
      });
    }
  }
};
