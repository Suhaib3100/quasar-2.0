const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset a user\'s XP and level (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to reset')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user');

            const result = await db.query(
                'SELECT * FROM users WHERE user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            if (result.rows.length === 0) {
                return await interaction.editReply('This user has no level data to reset!');
            }

            // Reset all progress
            await db.query(
                'UPDATE users SET level = 0, xp = 0, message_count = 0, last_message_timestamp = NULL, voice_join_timestamp = NULL, is_in_voice = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            await interaction.editReply(
                `Successfully reset ${targetUser.username}'s level and XP to 0!`
            );
        } catch (error) {
            console.error('Error in reset command:', error);
            await interaction.editReply('There was an error while resetting the user\'s data!');
        }
    }
};