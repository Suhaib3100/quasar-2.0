const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers), // Discord permission requirement

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.ModerateMembers], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');

        try {
            await interaction.deferReply();

            const pool = getDefaultPool();
            
            // Get user's warnings
            const warningsResult = await pool.query(
                'SELECT w.*, u.username as moderator_name FROM warnings w LEFT JOIN users u ON w.moderator_id = u.user_id AND w.guild_id = u.guild_id WHERE w.target_user_id = $1 AND w.guild_id = $2 ORDER BY w.created_at DESC',
                [targetUser.id, interaction.guild.id]
            );

            const warnings = warningsResult.rows;

            if (warnings.length === 0) {
                return interaction.editReply({
                    content: `✅ **${targetUser.tag}** has no warnings.`,
                    ephemeral: true
                });
            }

            // Calculate total severity
            const totalSeverity = warnings.reduce((sum, warning) => sum + warning.severity, 0);
            const averageSeverity = totalSeverity / warnings.length;

            // Create warnings embed
            const warningsEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Total Warnings', value: warnings.length.toString(), inline: true },
                    { name: 'Total Severity', value: totalSeverity.toString(), inline: true },
                    { name: 'Average Severity', value: averageSeverity.toFixed(1), inline: true }
                )
                .setFooter({ text: 'Warning System' })
                .setTimestamp();

            // Add individual warnings (limit to 10 to avoid embed overflow)
            for (let i = 0; i < Math.min(warnings.length, 10); i++) {
                const warning = warnings[i];
                const severityEmoji = getSeverityEmoji(warning.severity);
                const date = new Date(warning.created_at).toLocaleDateString();
                const moderator = warning.moderator_name || 'Unknown';

                warningsEmbed.addFields({
                    name: `${severityEmoji} Warning ${i + 1} - ${date}`,
                    value: `**Severity:** ${warning.severity}/3\n**Moderator:** ${moderator}\n**Reason:** ${warning.reason}`,
                    inline: false
                });
            }

            if (warnings.length > 10) {
                warningsEmbed.setFooter({ text: `Showing 10 of ${warnings.length} warnings.` });
            }

            await interaction.editReply({
                embeds: [warningsEmbed]
            });

        } catch (error) {
            console.error('Error in warnings command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to fetch warnings.',
                ephemeral: true
            });
        }
    }
};

function getSeverityEmoji(severity) {
    switch (severity) {
        case 1: return '🟡';
        case 2: return '🟠';
        case 3: return '🔴';
        default: return '🟡';
    }
}
