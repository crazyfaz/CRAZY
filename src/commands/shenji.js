const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shenji')
    .setDescription('Get gear guide for Shenji'),
  async execute(interaction) {
    await interaction.reply({
      content: `🛡️ **Shenji Gear Guide**:
      
- Main Weapon: *Laser Rifle* 🔫  
- Armor: *Kinetic Armor* 🛡️  
- Boots: *Silent Boots* 👟  
- Chip: *Auto Heal* 💉

Type /shenji anytime for this guide.`,
      ephemeral: false,
    });
  },
}
