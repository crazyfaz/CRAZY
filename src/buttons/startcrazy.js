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

    // Defer the interaction to avoid "This interaction failed"
    await interaction.deferUpdate();

    // Call the getcrazy command again
    await command.execute(interaction, client);
  }
}
