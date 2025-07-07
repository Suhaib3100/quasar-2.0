const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { SPECIAL_USER_ID } = require('../utils/permissionUtils');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome channel for new member greetings')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages')
                .setRequired(true)),

    async execute(interaction) {
        // Check permissions first
        if (interaction.user.id !== SPECIAL_USER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('channel');
        
        try {
            // Update or insert welcome channel configuration
            await db.query(
                'INSERT INTO guild_config (guild_id, welcome_channel_id) VALUES ($1, $2) ' +
                'ON CONFLICT (guild_id) DO UPDATE SET welcome_channel_id = $2',
                [interaction.guildId, channel.id]
            );

            await interaction.reply({
                content: `Welcome channel has been set to ${channel.toString()}!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error setting welcome channel:', error);
            await interaction.reply({
                content: 'There was an error while setting the welcome channel.',
                ephemeral: true
            });
        }
    },
};