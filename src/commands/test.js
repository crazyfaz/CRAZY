const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Just says hello!'),

  async execute(interaction) {
    await interaction.reply('✅ Hello from your CRAZY bot!');
  }
}
