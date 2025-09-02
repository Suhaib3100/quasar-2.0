const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../utils/permissionUtils');
const { getDefaultPool } = require('discord-moderation-shared');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for adding the role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing the role')
                        .setRequired(false)))
        .setDefaultMemberPermissions(0), // Allow all users to see the command, but check permissions in execute

    async execute(interaction) {
        // Check permissions
        if (!hasPermission(interaction.user.id, [PermissionFlagsBits.ManageRoles], interaction.member)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Check if the bot can manage the role
            if (!role.editable) {
                return interaction.reply({
                    content: '❌ I cannot manage this role. It may be higher than my highest role.',
                    ephemeral: true
                });
            }

            // Check if the role is managed by an integration
            if (role.managed) {
                return interaction.reply({
                    content: '❌ I cannot manage this role as it is managed by an integration.',
                    ephemeral: true
                });
            }

            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            const action = subcommand === 'add' ? 'add' : 'remove';

            await interaction.deferReply();

            if (subcommand === 'add') {
                // Check if user already has the role
                if (targetMember.roles.cache.has(role.id)) {
                    return interaction.editReply({
                        content: `❌ **${targetUser.tag}** already has the **${role.name}** role.`,
                        ephemeral: true
                    });
                }

                // Add the role
                await targetMember.roles.add(role, `Role added by ${interaction.user.tag} for: ${reason}`);
            } else {
                // Check if user has the role
                if (!targetMember.roles.cache.has(role.id)) {
                    return interaction.editReply({
                        content: `❌ **${targetUser.tag}** doesn't have the **${role.name}** role.`,
                        ephemeral: true
                    });
                }

                // Remove the role
                await targetMember.roles.remove(role, `Role removed by ${interaction.user.tag} for: ${reason}`);
            }

            // Log the role action to database
            const pool = getDefaultPool();
            await pool.query(
                'INSERT INTO moderation_actions (guild_id, moderator_id, target_user_id, action_type, reason, duration, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [interaction.guild.id, interaction.user.id, targetUser.id, `role_${action}`, reason, null]
            );

            // Create role action embed
            const roleEmbed = new EmbedBuilder()
                .setColor(action === 'add' ? '#00FF00' : '#FF0000')
                .setTitle(action === 'add' ? '➕ Role Added' : '➖ Role Removed')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Action', value: action === 'add' ? 'Added' : 'Removed', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Role Management Log' })
                .setTimestamp();

            await interaction.editReply({
                content: `✅ **${role.name}** role has been ${action === 'add' ? 'added to' : 'removed from'} **${targetUser.tag}**.`,
                embeds: [roleEmbed]
            });

        } catch (error) {
            console.error('Error in role command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while trying to manage the role.',
                ephemeral: true
            });
        }
    }
};
