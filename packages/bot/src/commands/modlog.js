const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlog')
        .setDescription('View moderation logs')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view logs for (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Type of action to filter by (optional)')
                .setRequired(false)
                .addChoices(
                    { name: 'All Actions', value: 'all' },
                    { name: 'Bans', value: 'ban' },
                    { name: 'Kicks', value: 'kick' },
                    { name: 'Timeouts', value: 'timeout' },
                    { name: 'Role Changes', value: 'role' },
                    { name: 'Rank Manipulations', value: 'rank' }
                ))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of logs to show (max 25)')
                .setMinValue(1)
                .setMaxValue(25)
                .setRequired(false))
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
        const actionType = interaction.options.getString('action') || 'all';
        const limit = interaction.options.getInteger('limit') || 10;

        try {
            await interaction.deferReply();

            const pool = getDefaultPool();
            
            let query = `
                SELECT ma.*, 
                       u1.username as moderator_name, 
                       u2.username as target_name
                FROM moderation_actions ma
                LEFT JOIN users u1 ON ma.moderator_id = u1.user_id AND ma.guild_id = u1.guild_id
                LEFT JOIN users u2 ON ma.target_user_id = u2.user_id AND ma.guild_id = u2.guild_id
                WHERE ma.guild_id = $1
            `;
            
            let params = [interaction.guild.id];
            let paramCount = 1;

            if (targetUser) {
                paramCount++;
                query += ` AND ma.target_user_id = $${paramCount}`;
                params.push(targetUser.id);
            }

            if (actionType !== 'all') {
                paramCount++;
                if (actionType === 'role') {
                    query += ` AND ma.action_type LIKE 'role_%'`;
                } else if (actionType === 'rank') {
                    query += ` AND ma.action_type LIKE 'rank_%'`;
                } else {
                    query += ` AND ma.action_type = $${paramCount}`;
                    params.push(actionType);
                }
            }

            query += ` ORDER BY ma.created_at DESC LIMIT $${paramCount + 1}`;
            params.push(limit);

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                return interaction.editReply({
                    content: '📝 No moderation logs found for the specified criteria.',
                    ephemeral: true
                });
            }

            // Create moderation log embed
            const modLogEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 Moderation Logs')
                .setTimestamp();

            if (targetUser) {
                modLogEmbed.setDescription(`Showing logs for **${targetUser.tag}**`);
            }

            // Add fields for each log entry
            for (let i = 0; i < Math.min(result.rows.length, 10); i++) {
                const log = result.rows[i];
                const actionEmoji = getActionEmoji(log.action_type);
                const actionName = formatActionType(log.action_type);
                const duration = log.duration ? formatDuration(log.duration) : 'N/A';
                const date = new Date(log.created_at).toLocaleDateString();

                modLogEmbed.addFields({
                    name: `${actionEmoji} ${actionName} - ${date}`,
                    value: `**User:** ${log.target_name || 'Unknown'} (${log.target_user_id})\n**Moderator:** ${log.moderator_name || 'Unknown'} (${log.moderator_id})\n**Reason:** ${log.reason}\n**Duration:** ${duration}`,
                    inline: false
                });
            }

            if (result.rows.length > 10) {
                modLogEmbed.setFooter({ text: `Showing 10 of ${result.rows.length} logs. Use /modlog with a higher limit to see more.` });
            }

            await interaction.editReply({
                embeds: [modLogEmbed]
            });

        } catch (error) {
            console.error('Error in modlog command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to fetch moderation logs.',
                ephemeral: true
            });
        }
    }
};

function getActionEmoji(actionType) {
    const emojis = {
        'ban': '🔨',
        'kick': '👢',
        'timeout': '⏰',
        'role_add': '➕',
        'role_remove': '➖',
        'rank_increase_level': '📈',
        'rank_decrease_level': '📉',
        'rank_set_level': '🎯',
        'rank_increase_xp': '⭐',
        'rank_decrease_xp': '💫',
        'rank_set_xp': '🎯',
        'rank_reset_rank': '🔄'
    };
    
    for (const [key, emoji] of Object.entries(emojis)) {
        if (actionType.includes(key)) {
            return emoji;
        }
    }
    
    return '📝';
}

function formatActionType(actionType) {
    if (actionType.startsWith('role_')) {
        return actionType === 'role_add' ? 'Role Added' : 'Role Removed';
    } else if (actionType.startsWith('rank_')) {
        const parts = actionType.split('_');
        if (parts.length >= 3) {
            const action = parts[1];
            const target = parts[2];
            return `${action.charAt(0).toUpperCase() + action.slice(1)} ${target.toUpperCase()}`;
        }
        return 'Rank Manipulation';
    }
    
    return actionType.charAt(0).toUpperCase() + actionType.slice(1);
}

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`;
    return `${Math.floor(seconds / 604800)} weeks`;
}
