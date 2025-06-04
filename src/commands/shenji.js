const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shenji')
    .setDescription('Sends CRAZY Shenji guide.'),
  async execute(interaction) {
    await interaction.reply('🛡️ Here is the CRAZY Shenji gear guide!');
  }
};
