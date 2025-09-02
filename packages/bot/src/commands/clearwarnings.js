const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription('Clear warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for clearing warnings')
                .setRequired(false))
        .setDefaultMemberPermissions(0), // Allow all users to see the command, but check permissions in execute

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.ModerateMembers], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await interaction.deferReply();

            const pool = getDefaultPool();
            
            // Get current warning count
            const warningCountResult = await pool.query(
                'SELECT COUNT(*) as count FROM warnings WHERE target_user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            const warningCount = parseInt(warningCountResult.rows[0].count);

            if (warningCount === 0) {
                return interaction.editReply({
                    content: `✅ **${targetUser.tag}** has no warnings to clear.`,
                    ephemeral: true
                });
            }

            // Clear all warnings
            await pool.query(
                'DELETE FROM warnings WHERE target_user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            // Log the warning clear action
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, 'clear_warnings', reason, null]
            );

            // Create clear warnings embed
            const clearEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🧹 Warnings Cleared')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Warnings Cleared', value: warningCount.toString(), inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Warning System' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${warningCount}** warnings have been cleared for **${targetUser.tag}**.`,
                embeds: [clearEmbed]
            });

        } catch (error) {
            console.error('Error in clear warnings command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to clear warnings.',
                ephemeral: true
            });
        }
    }
};
