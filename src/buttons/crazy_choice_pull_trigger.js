module.exports = {
  customId: 'crazy_choice_pull_trigger',

  async execute(interaction) {
    await interaction.update({
      content: '',
      embeds: [
        {
          title: "💥 BOOM.",
          description: "Wrong choice. It was rigged. Your brains paint the walls 💀",
          color: 0xFF0000,
        }
      ],
      components: []
    });
  }
}
