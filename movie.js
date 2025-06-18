const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const userHistory = new Map(); // In-memory store

module.exports = {
  data: new SlashCommandBuilder()
    .setName('movie')
    .setDescription('🎥 Get a top-rated movie suggestion'),

  async execute(interaction) {
    const apiKey = process.env.TMDB_API_KEY;
    const userId = interaction.user.id;

    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`
      );

      const movies = response.data.results;

      // Filter out already suggested movies (if any)
      const seen = userHistory.get(userId) || [];
      const unseenMovies = movies.filter(movie => !seen.includes(movie.id));

      // Reset history if all movies were shown
      if (unseenMovies.length === 0) {
        userHistory.set(userId, []);
        return interaction.reply('♻️ All top-rated movies have been suggested to you already! Try again in a while.');
      }

      // Pick a random movie
      const randomMovie = unseenMovies[Math.floor(Math.random() * unseenMovies.length)];

      // Update history
      seen.push(randomMovie.id);
      userHistory.set(userId, seen);

      const embed = new EmbedBuilder()
        .setTitle(`🎬 ${randomMovie.title}`)
        .setDescription(randomMovie.overview || '*No description available.*')
        .addFields(
          { name: '⭐ Rating', value: `${randomMovie.vote_average}/10`, inline: true },
          { name: '🗓 Release Date', value: `${randomMovie.release_date}`, inline: true }
        )
        .setImage(`https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`)
        .setColor(0x00cc99)
        .setFooter({ text: `Requested by ${interaction.user.username}` });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching movie:', error.message);
      await interaction.reply({
        content: '❌ Could not fetch a movie. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
