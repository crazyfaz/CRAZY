const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create the Discord client with necessary intents
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Store commands in a Collection
client.commands = new Collection();

// Path to commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all command files
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Bot ready event
client.once('ready', () => {
  console.log(`✅ CRAZY is online as ${client.user.tag}`);
});

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '⚠️ An error occurred while executing this command!',
      ephemeral: true
    });
  }
});

// Login using token from .env
client.login(process.env.TOKEN);
