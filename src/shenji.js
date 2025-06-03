const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shenji')
    .setDescription('Get Shenji gear set recommendations'),
  
  async execute(interaction) {
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    await interaction.reply({
      content: `**DRAKE**  
> **Heroes**  
> **Shenji**  
> Gear recommendations based on the rarity (level)

---

**More Builds**  
**[YouTube Guide]** [Click Here](https://youtube.com) *(placeholder)*

---

### **BUILD A** – *Best Starter Build for Beginners*  
> ![Build A](https://i.imgur.com/VRWQnrl.png)

---

### **BUILD B** – *Good Rare Gears for Advanced Play*  
> ![Build B](https://i.imgur.com/YtnPmKH.png)

---

### **BUILD C** – *Bonuses for Extremely High Performance*  
> ![Build C](https://i.imgur.com/Fa7XQLM.png)

---

*Date Updated: ${formattedDate}*`,
      ephemeral: false
    });
  }
}
