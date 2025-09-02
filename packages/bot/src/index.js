require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getDefaultPool } = require('discord-moderation-shared');
const pool = getDefaultPool();
const express = require('express');
const moderationRoutes = require('./api/moderation');
const { loadFonts } = require('./utils/fontLoader');

// Load fonts first
loadFonts();

// Initialize Express app
const app = express();
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log('Loading commands...');

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
console.log('\nLoading events...');

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.name}`);
}

// Test database connection
console.log('\nConnecting to database...');
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err);
    } else {
        console.log('✅ Connected to PostgreSQL database');
    }
});

// Login to Discord
client.once('ready', () => {
    console.log(`\n✅ Bot is online! Logged in as ${client.user.tag}`);
    console.log('\nAvailable Commands:');
    console.log('1. /rank - Check your current level and XP');
    console.log('2. /leaderboard - View server XP leaderboard');
    console.log('3. /setlevel - Admin command to set user level');
    console.log('4. /reset - Admin command to reset user XP');
    console.log('\nNote: Users gain XP by chatting in text channels');
});

// Simplified interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        try {
            const message = { content: 'An error occurred!', ephemeral: true };
            if (!interaction.replied) await interaction.reply(message);
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
});

// Start the API server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Bot API server running on port ${PORT}`);
});

// Add API routes
app.use('/moderation', moderationRoutes);

// Login to Discord
client.login(process.env.TOKEN);