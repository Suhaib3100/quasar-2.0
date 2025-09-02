const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // Discord permission requirement

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.BanMembers], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('days') || 0;

        try {
            // Check if the bot can ban the target user
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            if (!targetMember.bannable) {
                return interaction.reply({
                    content: '❌ I cannot ban this user. They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Check if the target user is the server owner
            if (targetMember.id === interaction.guild.ownerId) {
                return interaction.reply({
                    content: '❌ I cannot ban the server owner!',
                    ephemeral: true
                });
            }

            // Check if the target user is the command user
            if (targetMember.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot ban yourself!',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Ban the user
            await interaction.guild.members.ban(targetUser, {
                deleteMessageDays: deleteMessageDays,
                reason: `Banned by ${interaction.user.tag} for: ${reason}`
            });

            // Log the ban to database
            const pool = getDefaultPool();
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, 'ban', reason, null]
            );

            // Create ban embed
            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 User Banned')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Messages Deleted', value: `${deleteMessageDays} days`, inline: true },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Log' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${targetUser.tag}** has been banned from the server.`,
                embeds: [banEmbed]
            });

        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to ban the user.',
                ephemeral: true
            });
        }
    }
};
