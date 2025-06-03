const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Your CRAZY bot's Application ID
const CLIENT_ID = '1376557152814235688';

// Your Discord Server (Guild) ID — replace this!
const GUILD_ID = 'YOUR_GUILD_ID_HERE';

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

// Register commands in your server (fast deployment)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Refreshing guild (/) commands...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('✅ Successfully reloaded guild (/) commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
