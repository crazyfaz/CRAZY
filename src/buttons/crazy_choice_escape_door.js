module.exports = {
  customId: 'crazy_choice_escape_door',

  async execute(interaction) {
    await interaction.update({
      content: '',
      embeds: [
        {
          title: "🚪 Freedom?",
          description: "The door creaks... it's open. But a shadow moves fast behind you...",
          color: 0x00FF66,
        }
      ],
      components: []
    });
  }
}
