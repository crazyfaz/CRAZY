const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getcrazy')
    .setDescription('💀 Enter the CRAZY gangster trials. Choose wisely... or die.'),

  async execute(interaction) {
    const scenario = {
      title: "🩸 The Warehouse Trap",
      description: `You wake up tied to a chair in a blood-soaked warehouse. A masked man whispers:\n\n*“One of these buttons saves you. Two will end you.”*`,
      options: [
        { id: 'pull_trigger', label: '🔫 Pull the trigger on the table' },
        { id: 'escape_door', label: '🚪 Run toward the steel door' },
        { id: 'make_deal', label: '🤝 Shout: I’ll make you rich!' }
      ],
      outcomes: {
        pull_trigger: {
          title: "BOOM.",
          description: "Wrong choice. It was rigged. Your brains paint the walls 💥",
          success: false,
        },
        escape_door: {
          title: "Freedom?",
          description: "The door creaks... it's open. But a shadow moves fast behind you.",
          success: true,
        },
        make_deal: {
          title: "Silence.",
          description: "He walks away. No answer. You're left in the dark. Forever.",
          success: false,
        }
      }
    };

    const embed = new EmbedBuilder()
      .setTitle(scenario.title)
      .setDescription(scenario.description)
      .setColor(0x8B0000) // dark red
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
}
