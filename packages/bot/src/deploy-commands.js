require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        // Make all commands visible by default
        const commandData = command.data.toJSON();
        // Force all commands to be visible to everyone (0 = no restrictions)
        commandData.default_member_permissions = "0";
        commands.push(commandData);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Check if token and client ID are available
        if (!process.env.TOKEN) {
            throw new Error('Bot token is not set in environment variables!');
        }
        if (!process.env.CLIENT_ID) {
            throw new Error('Client ID is not set in environment variables!');
        }

        // Deploy commands globally
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands:`);
        commands.forEach(cmd => console.log(`- /${cmd.name}`));
    } catch (error) {
        console.error('Error deploying commands:');
        console.error(error);
    }
})();