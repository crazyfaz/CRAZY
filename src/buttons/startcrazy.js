module.exports = {
  customId: 'start_crazy_game',

  async execute(interaction, client) {
    const command = client.commands.get('getcrazy');
    if (!command) {
      return interaction.reply({
        content: '❌ Could not find the crazy game!',
        ephemeral: true
      });
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error('❌ Error in startcrazy button:', err);
      await interaction.reply({
        content: '❌ An error occurred while starting the crazy game.',
        ephemeral: true
      });
    }
  }
};
