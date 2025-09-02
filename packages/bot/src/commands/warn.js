const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('severity')
                .setDescription('Warning severity level')
                .setRequired(false)
                .addChoices(
                    { name: 'Minor (1)', value: 1 },
                    { name: 'Moderate (2)', value: 2 },
                    { name: 'Major (3)', value: 3 }
                ))
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
        const severity = interaction.options.getInteger('severity') || 1;

        try {
            // Check if the target user is the command user
            if (targetUser.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot warn yourself!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const pool = getDefaultPool();
            
            // Add warning to database
            const warningResult = await pool.query(
                'INSERT INTO warnings (guild_id, moderator_id, target_user_id, reason, severity, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
                [interaction.guild.id, interaction.user.id, targetUser.id, reason, severity]
            );

            // Get user's warning count
            const warningCountResult = await pool.query(
                'SELECT COUNT(*) as count FROM warnings WHERE target_user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            const warningCount = parseInt(warningCountResult.rows[0].count);

            // Log the warning to moderation actions
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, 'warn', reason, null]
            );

            // Create warning embed
            const warningEmbed = new EmbedBuilder()
                .setColor(getSeverityColor(severity))
                .setTitle('⚠️ User Warned')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Severity', value: `${severity}/3`, inline: true },
                    { name: 'Total Warnings', value: warningCount.toString(), inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Warning System' })
                .setTimestamp();

            // Check for automatic actions based on warning count
            let autoAction = '';
            if (warningCount >= 5) {
                autoAction = '🚨 **User has 5+ warnings - Consider stronger moderation action!**';
            } else if (warningCount >= 3) {
                autoAction = '⚠️ **User has 3+ warnings - Monitor closely!**';
            }

            await interaction.editReply({
                content: `✅ **${targetUser.tag}** has been warned. ${autoAction}`,
                embeds: [warningEmbed]
            });

        } catch (error) {
            console.error('Error in warn command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to warn the user.',
                ephemeral: true
            });
        }
    }
};

function getSeverityColor(severity) {
    switch (severity) {
        case 1: return '#FFFF00'; // Yellow
        case 2: return '#FFA500'; // Orange
        case 3: return '#FF0000'; // Red
        default: return '#FFFF00';
    }
}
