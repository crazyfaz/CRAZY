const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// CRAZY bot's Application ID
const CLIENT_ID = '1376557152814235688';

// Your testing Discord server (for instant command updates)
const GUILD_ID = '1367900836801286244';

// Bot token from .env
const TOKEN = process.env.TOKEN;

// Load all commands from src/commands
const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./src/commands/${file}`);
  commands.push(command.data.toJSON());
}

// Create REST client
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Register globally and for your guild
(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    // 1. Global (available to everyone, but may take 1 hour to appear)
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Global commands registered.');

    // 2. Guild (for instant updates/testing)
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ Guild commands registered for ${GUILD_ID}.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
