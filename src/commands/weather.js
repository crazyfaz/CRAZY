const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('🌦️ Get current weather info for a city')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('City name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const city = interaction.options.getString('city');
    const apiKey = process.env.OPENWEATHER_API_KEY;

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      );

      const data = response.data;
      const weather = data.weather[0].main.toLowerCase();
      const temp = data.main.temp;

      // 🎨 Dynamic color logic
      let color = 0x808080; // default gray

      if (weather.includes('rain') || weather.includes('thunderstorm')) {
        color = 0x778899; // gray
      } else if (weather.includes('snow')) {
        color = 0xFFFFFF; // white
      } else if (weather.includes('cloud')) {
        color = 0xA9A9A9; // dark gray
      } else if (temp < 10) {
        color = 0x1E90FF; // cold blue
      } else if (temp < 25) {
        color = 0x87CEEB; // mild sky blue
      } else if (temp < 32) {
        color = 0xFFA500; // warm orange
      } else {
        color = 0xFF4500; // hot red-orange
      }

      const embed = new EmbedBuilder()
        .setTitle(`☁️ Weather in ${data.name}`)
        .addFields(
          { name: '🌡 Temperature', value: `${temp}°C`, inline: true },
          { name: '💧 Humidity', value: `${data.main.humidity}%`, inline: true },
          { name: '🌬 Wind Speed', value: `${data.wind.speed} m/s`, inline: true },
          { name: '🌥 Sky', value: `${data.weather[0].description}`, inline: true }
        )
        .setColor(color)
        .setThumbnail(`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching weather:', error.message);
      await interaction.reply({
        content: '❌ Could not fetch weather. Please check the city name!',
        ephemeral: true
      });
    }
  },
};
