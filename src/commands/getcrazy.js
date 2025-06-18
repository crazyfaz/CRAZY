const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const scenarios = require('../utils/crazyScenarios'); // make sure path is correct

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getcrazy')
    .setDescription('💀 Enter the CRAZY gangster trials. Choose wisely... or die.'),

  async execute(interaction) {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    const embed = new EmbedBuilder()
      .setTitle(scenario.title)
      .setDescription(scenario.description)
      .setColor(0x8B0000)
      .setFooter({ text: "Choose your fate wisely..." });

    const row = new ActionRowBuilder().addComponents(
      scenario.options.map(option =>
        new ButtonBuilder()
          .setCustomId(`crazy_choice_${option.id}`)
          .setLabel(option.label)
          .setStyle(ButtonStyle.Danger)
      )
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
