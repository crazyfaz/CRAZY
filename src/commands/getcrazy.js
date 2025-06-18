const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const scenarios = [
  {
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
  },
  {
    title: "🧠 Mind Maze",
    description: `A voice echoes in your skull:\n*“Two paths lie ahead. One burns. One lives. One is a trap just for you.”*`,
    options: [
      { id: 'left_path', label: '⬅️ Take the left path' },
      { id: 'right_path', label: '➡️ Take the right path' },
      { id: 'stay_still', label: '⏸️ Stay completely still' }
    ],
    outcomes: {
      left_path: {
        title: "Into the Fire.",
        description: "You stepped into flames. Screams follow.",
        success: false
      },
      right_path: {
        title: "You Survived.",
        description: "The path was safe... this time.",
        success: true
      },
      stay_still: {
        title: "Sniped.",
        description: "Stillness was expected. You’re eliminated by a hidden trap.",
        success: false
      }
    }
  }
];

const GIPHY_SUCCESS = ["winner", "escape", "gangster win", "fireworks", "survive"];
const GIPHY_FAIL = ["fail", "you died", "trap", "sad gangster", "lost"];

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

    interaction.client.activeScenario = scenario;

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
}
