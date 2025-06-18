module.exports = {
  customId: 'crazy_choice_make_deal',

  async execute(interaction) {
    await interaction.update({
      content: '',
      embeds: [
        {
          title: "🤐 Silence.",
          description: "He walks away. No answer. You're left in the dark. Forever.",
          color: 0x666666,
        }
      ],
      components: []
    });
  }
};
