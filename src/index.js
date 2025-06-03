const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize the Discord bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Create a Collection to store commands
client.commands = new Collection();

// Load all command files from src/commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// When bot is ready
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

// Login to Discord
client.login(process.env.TOKEN);
