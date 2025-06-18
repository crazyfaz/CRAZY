const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ The command at ${filePath} is missing "data" or "execute".`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Deploying global application (/) commands...');

    // 🔥 Clear guild commands (if already used before)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    console.log('🗑️ Cleared guild-specific commands.');

    // ✅ Register global commands
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Successfully deployed global application (/) commands.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
