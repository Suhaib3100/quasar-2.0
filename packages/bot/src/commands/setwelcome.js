const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome channel for new member greetings')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
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