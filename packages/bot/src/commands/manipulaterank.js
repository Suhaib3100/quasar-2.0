const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manipulaterank')
        .setDescription('Manipulate user rank, level, and XP')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to manipulate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('What to manipulate')
                .setRequired(true)
                .addChoices(
                    { name: 'Increase Level', value: 'increase_level' },
                    { name: 'Decrease Level', value: 'decrease_level' },
                    { name: 'Set Level', value: 'set_level' },
                    { name: 'Increase XP', value: 'increase_xp' },
                    { name: 'Decrease XP', value: 'decrease_xp' },
                    { name: 'Set XP', value: 'set_xp' },
                    { name: 'Reset Rank', value: 'reset_rank' }
                ))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to change (level number or XP amount)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the manipulation')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Discord permission requirement

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.Administrator], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const action = interaction.options.getString('action');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await interaction.deferReply();

            const pool = getDefaultPool();
            
            // Get current user data
            let userResult = await pool.query(
                'SELECT * FROM users WHERE user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            let user;
            if (!userResult.rows.length) {
                // Create new user if they don't exist
                const newUserResult = await pool.query(
                    'INSERT INTO users (user_id, guild_id, xp, level, message_count) VALUES ($1, $2, 0, 0, 0) RETURNING *',
                    [targetUser.id, interaction.guild.id]
                );
                user = newUserResult.rows[0];
            } else {
                user = userResult.rows[0];
            }

            let newLevel = user.level;
            let newXP = user.xp;
            let actionDescription = '';

            // Perform the manipulation
            switch (action) {
                case 'increase_level':
                    newLevel = Math.max(0, user.level + (amount || 1));
                    actionDescription = `Level increased from ${user.level} to ${newLevel}`;
                    break;
                
                case 'decrease_level':
                    newLevel = Math.max(0, user.level - (amount || 1));
                    actionDescription = `Level decreased from ${user.level} to ${newLevel}`;
                    break;
                
                case 'set_level':
                    if (amount === null) {
                        return interaction.editReply({
                            content: '❌ Amount is required for setting level!',
                            ephemeral: true
                        });
                    }
                    newLevel = Math.max(0, amount);
                    actionDescription = `Level set from ${user.level} to ${newLevel}`;
                    break;
                
                case 'increase_xp':
                    newXP = Math.max(0, user.xp + (amount || 100));
                    actionDescription = `XP increased from ${user.xp} to ${newXP}`;
                    break;
                
                case 'decrease_xp':
                    newXP = Math.max(0, user.xp - (amount || 100));
                    actionDescription = `XP decreased from ${user.xp} to ${newXP}`;
                    break;
                
                case 'set_xp':
                    if (amount === null) {
                        return interaction.editReply({
                            content: '❌ Amount is required for setting XP!',
                            ephemeral: true
                        });
                    }
                    newXP = Math.max(0, amount);
                    actionDescription = `XP set from ${user.xp} to ${newXP}`;
                    break;
                
                case 'reset_rank':
                    newLevel = 0;
                    newXP = 0;
                    actionDescription = `Rank reset to level 0 with 0 XP`;
                    break;
                
                default:
                    return interaction.editReply({
                        content: '❌ Invalid action specified!',
                        ephemeral: true
                    });
            }

            // Update user in database
            await pool.query(
                'UPDATE users SET level = $1, xp = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND guild_id = $4',
                [newLevel, newXP, targetUser.id, interaction.guild.id]
            );

            // Log the manipulation to database
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, `rank_${action}`, reason, null]
            );

            // Calculate next level XP for display
            const nextLevelXP = Math.floor(100 * Math.pow(1.5, newLevel));
            const progress = nextLevelXP > 0 ? (newXP / nextLevelXP) * 100 : 0;

            // Create manipulation embed
            const manipulationEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎯 Rank Manipulation')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Action', value: actionDescription, inline: false },
                    { name: 'New Level', value: newLevel.toString(), inline: true },
                    { name: 'New XP', value: `${newXP}/${nextLevelXP}`, inline: true },
                    { name: 'Progress to Next', value: `${progress.toFixed(1)}%`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Rank Manipulation Log' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${targetUser.tag}**'s rank has been manipulated successfully.`,
                embeds: [manipulationEmbed]
            });

        } catch (error) {
            console.error('Error in manipulate rank command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to manipulate the user\'s rank.',
                ephemeral: true
            });
        }
    }
};
