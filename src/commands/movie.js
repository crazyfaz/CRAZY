const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// In-memory storage to avoid duplicates per user (resets on bot restart)
const shownMovies = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('movie')
    .setDescription('🎬 Get a random top-rated movie suggestion'),

  async execute(interaction) {
    const apiKey = process.env.TMDB_API_KEY;

    try {
      // Fetch top-rated movies (page 1 only for simplicity)
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=en-US&page=1`
      );

      const movies = response.data.results;
      const userId = interaction.user.id;

      // Track shown movies per user
      if (!shownMovies[userId]) {
        shownMovies[userId] = [];
      }

      // Filter out already shown movies
      const unseenMovies = movies.filter(m => !shownMovies[userId].includes(m.id));

      if (unseenMovies.length === 0) {
        shownMovies[userId] = []; // reset if all seen
        return interaction.reply("✅ You've seen all top movies! Resetting your list. Try again!");
      }

      // Pick a random unseen movie
      const movie = unseenMovies[Math.floor(Math.random() * unseenMovies.length)];
      shownMovies[userId].push(movie.id);

      const embed = new EmbedBuilder()
        .setTitle(`🎬 ${movie.title}`)
        .setDescription(movie.overview || 'No description available.')
        .addFields(
          { name: '⭐ Rating', value: `${movie.vote_average}/10`, inline: true },
          { name: '📅 Release Date', value: movie.release_date || 'Unknown', inline: true }
        )
        .setThumbnail(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        .setColor(0xE50914) // Netflix red 💥
        .setFooter({ text: `Requested by ${interaction.user.username}` });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('TMDB error:', error.message);
      await interaction.reply({
        content: '❌ Failed to fetch movie. Please try again later.',
        ephemeral: true
      });
    }
  },
}
