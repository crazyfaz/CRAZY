const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get current weather for a city')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('City name (e.g. Valanchery, New York, Delhi)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const city = interaction.options.getString('city');
    const apiKey = process.env.OPENWEATHER_API_KEY;

    try {
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);

      const weather = res.data;
      const description = weather.weather[0].description;
      const temp = weather.main.temp;
      const feels = weather.main.feels_like;
      const humidity = weather.main.humidity;
      const wind = weather.wind.speed;

      await interaction.reply({
        embeds: [
          {
            title: `🌤️ Weather in ${weather.name}`,
            description: `${description}`,
            fields: [
              { name: '🌡️ Temperature', value: `${temp}°C`, inline: true },
              { name: '🥵 Feels Like', value: `${feels}°C`, inline: true },
              { name: '💧 Humidity', value: `${humidity}%`, inline: true },
              { name: '💨 Wind Speed', value: `${wind} m/s`, inline: true },
            ],
            color: 0x1e90ff,
            footer: { text: 'Data from OpenWeather' }
          }
        ]
      });

    } catch (err) {
      console.error(err.message);
      await interaction.reply({
        content: `❌ Could not fetch weather for **${city}**. Check the spelling or try another city.`,
        ephemeral: true
      });
    }
  },
}
