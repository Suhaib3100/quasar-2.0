const { Events } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { hasPermission } = require('../utils/permissionUtils');
const db = getDefaultPool();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Only handle slash commands
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            // Check if command has required permissions
            if (command.permissions && !hasPermission(interaction.user.id, command.permissions, interaction.member)) {
                return await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            try {
                const reply = {
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.deferred) {
                    await interaction.editReply(reply);
                } else if (!interaction.replied) {
                    await interaction.reply(reply);
                }
            } catch (e) {
                console.error('Error sending error message:', e);
            }
        }
    },
};