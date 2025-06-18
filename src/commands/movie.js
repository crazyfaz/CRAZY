const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const shownMovies = {};

// Language and region mapping
const languageMap = {
  english: 'en', hindi: 'hi', french: 'fr', spanish: 'es', japanese: 'ja',
  korean: 'ko', german: 'de', tamil: 'ta', telugu: 'te', malayalam: 'ml'
};

const regionMap = {
  india: 'IN', usa: 'US', uk: 'GB', france: 'FR', japan: 'JP', germany: 'DE'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('movie')
    .setDescription('🎬 Get a top-rated movie suggestion with filters')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Genre (e.g. horror, thriller, comedy)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('year')
        .setDescription('Release year (e.g. 2020)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('language')
        .setDescription('Language (e.g. Hindi, English)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Region (e.g. India, USA)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const apiKey = process.env.TMDB_API_KEY;
    const genre = interaction.options.getString('type');
    const year = interaction.options.getString('year');
    const langInput = interaction.options.getString('language');
    const regionInput = interaction.options.getString('region');

    const userId = interaction.user.id;

    // Convert to TMDB codes
    const language = langInput ? languageMap[langInput.toLowerCase()] : 'en';
    const region = regionInput ? regionMap[regionInput.toLowerCase()] : 'US';

    try {
      const genreRes = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`);
      const genreList = genreRes.data.genres;
      const genreId = genre
        ? genreList.find(g => g.name.toLowerCase() === genre.toLowerCase())?.id
        : null;

      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=vote_average.desc&vote_count.gte=1000&page=1`
        + (genreId ? `&with_genres=${genreId}` : '')
        + (year ? `&primary_release_year=${year}` : '')
        + (language ? `&with_original_language=${language}` : '')
        + (region ? `&region=${region}` : '');

      const response = await axios.get(url);
      const movies = response.data.results;

      if (!movies.length) {
        return interaction.reply('❌ No matching movies found. Try different filters.');
      }

      if (!shownMovies[userId]) shownMovies[userId] = [];

      const unseenMovies = movies.filter(m => !shownMovies[userId].includes(m.id));

      if (unseenMovies.length === 0) {
        shownMovies[userId] = [];
        return interaction.reply("✅ You've seen all top movies matching those filters! Try again!");
      }

      const movie = unseenMovies[Math.floor(Math.random() * unseenMovies.length)];
      shownMovies[userId].push(movie.id);

      const embed = new EmbedBuilder()
        .setTitle(`🎬 ${movie.title}`)
        .setDescription(movie.overview || 'No description available.')
        .addFields(
          { name: '⭐ Rating', value: `${movie.vote_average}/10`, inline: true },
          { name: '📅 Release Date', value: movie.release_date || 'Unknown', inline: true }
        )
        .setImage(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
        .setColor(0x8A2BE2) // Violet
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
};
