const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user (mute them temporarily)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout')
                .setRequired(true)
                .addChoices(
                    { name: '60 seconds', value: '60' },
                    { name: '5 minutes', value: '300' },
                    { name: '10 minutes', value: '600' },
                    { name: '1 hour', value: '3600' },
                    { name: '1 day', value: '86400' },
                    { name: '1 week', value: '604800' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
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
        const duration = parseInt(interaction.options.getString('duration'));
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Check if the bot can timeout the target user
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            if (!targetMember.moderatable) {
                return interaction.reply({
                    content: '❌ I cannot timeout this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Check if the target user is the server owner
            if (targetMember.id === interaction.guild.ownerId) {
                return interaction.reply({
                    content: '❌ I cannot timeout the server owner!',
                    ephemeral: true
                });
            }

            // Check if the target user is the command user
            if (targetMember.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot timeout yourself!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Calculate timeout end time
            const timeoutEndTime = new Date(Date.now() + duration * 1000);

            // Timeout the user
            await targetMember.timeout(duration * 1000, `Timed out by ${interaction.user.tag} for: ${reason}`);

            // Log the timeout to database
            const pool = getDefaultPool();
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, 'timeout', reason, duration]
            );

            // Format duration for display
            const durationText = formatDuration(duration);

            // Create timeout embed
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏰ User Timed Out')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Duration', value: durationText, inline: true },
                    { name: 'Ends At', value: timeoutEndTime.toLocaleString(), inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Moderation Log' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${targetUser.tag}** has been timed out for ${durationText}.`,
                embeds: [timeoutEmbed]
            });

        } catch (error) {
            console.error('Error in timeout command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to timeout the user.',
                ephemeral: true
            });
        }
    }
};

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`;
    return `${Math.floor(seconds / 604800)} weeks`;
}
