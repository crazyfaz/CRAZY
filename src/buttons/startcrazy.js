// CRAZY/src/buttons/startcrazy.js

module.exports = {
  customId: 'start_crazy_game',

  async execute(interaction, client) {
    console.log(`[BUTTON] start_crazy_game clicked by ${interaction.user.tag}`);

    // Defer the update to acknowledge the button click
    await interaction.deferUpdate();

    // Fetch the command again
    const command = client.commands.get('getcrazy');
    if (!command) {
      console.error('❌ Could not find the getcrazy command in client.commands');
      return interaction.followUp({
        content: '❌ The crazy game command could not be found.',
        ephemeral: true
      });
    }

    try {
      // Call the getcrazy command again
      await command.execute(interaction, client);
    } catch (err) {
      console.error('❌ Error while executing getcrazy from button click:', err);
      await interaction.followUp({
        content: '❌ An error occurred while starting the crazy game.',
        ephemeral: true
      });
    }
  }
}
