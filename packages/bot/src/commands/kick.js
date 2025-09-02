const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(0), // Allow all users to see the command, but check permissions in execute

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.KickMembers], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Check if the bot can kick the target user
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            if (!targetMember.kickable) {
                return interaction.reply({
                    content: '❌ I cannot kick this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Check if the target user is the server owner
            if (targetMember.id === interaction.guild.ownerId) {
                return interaction.reply({
                    content: '❌ I cannot kick the server owner!',
                    ephemeral: true
                });
            }

            // Check if the target user is the command user
            if (targetMember.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot kick yourself!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Kick the user
            await targetMember.kick(`Kicked by ${interaction.user.tag} for: ${reason}`);

            // Log the kick to database
            const pool = getDefaultPool();
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, 'kick', reason, null]
            );

            // Create kick embed
            const kickEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('👢 User Kicked')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Log' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${targetUser.tag}** has been kicked from the server.`,
                embeds: [kickEmbed]
            });

        } catch (error) {
            console.error('Error in kick command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to kick the user.',
                ephemeral: true
            });
        }
    }
};
