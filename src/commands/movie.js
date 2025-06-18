const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Cache genre name-to-ID mapping (TMDB uses IDs)
let genreMap = {};

async function fetchGenres(apiKey) {
  const res = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`);
  const genres = res.data.genres;
  genreMap = {};
  for (const g of genres) {
    genreMap[g.name.toLowerCase()] = g.id;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('movie')
    .setDescription('🎬 Get a random movie suggestion by genre and year')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Genre(s), comma separated (e.g. horror,thriller)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('year')
        .setDescription('Release year')
        .setRequired(false)),

  async execute(interaction) {
    const apiKey = process.env.TMDB_API_KEY;
    const genreInput = interaction.options.getString('type');
    const year = interaction.options.getInteger('year');

    try {
      if (Object.keys(genreMap).length === 0) {
        await fetchGenres(apiKey);
      }

      // Convert genre names to IDs
      let genreIds = [];
      if (genreInput) {
        const genres = genreInput.split(',').map(g => g.trim().toLowerCase());
        genreIds = genres.map(g => genreMap[g]).filter(Boolean);

        if (genreIds.length === 0) {
          return await interaction.reply('❌ Invalid genre(s) provided.');
        }
      }

      // Discover API query
      const query = {
        api_key: apiKey,
        language: 'en-US',
        sort_by: 'vote_average.desc',
        vote_count_gte: 100,
        with_genres: genreIds.join(','),
        page: 1
      };
      if (year) query.primary_release_year = year;

      const res = await axios.get('https://api.themoviedb.org/3/discover/movie', { params: query });
      const movies = res.data.results;

      if (!movies.length) {
        return await interaction.reply('😢 No matching movies found. Try different filters!');
      }

      const movie = movies[Math.floor(Math.random() * movies.length)];

      const embed = new EmbedBuilder()
        .setTitle(`🎬 ${movie.title}`)
        .setDescription(movie.overview || 'No description available.')
        .addFields(
          { name: '⭐ Rating', value: `${movie.vote_average}/10`, inline: true },
          { name: '📅 Release Date', value: movie.release_date || 'Unknown', inline: true }
        )
        .setThumbnail(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        .setColor(0x8A2BE2) // Violet
        .setFooter({ text: `Requested by ${interaction.user.username}` });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('TMDB error:', error.message);
      await interaction.reply({
        content: '❌ Failed to fetch movies. Please try again later.',
        ephemeral: true
      });
    }
  },
};
