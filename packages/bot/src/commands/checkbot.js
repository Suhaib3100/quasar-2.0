const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbot')
        .setDescription('Check bot permissions and status')
        .setDefaultMemberPermissions(0), // Visible to everyone

    async execute(interaction) {
        try {
            const botMember = interaction.guild.members.me;
            const botPermissions = botMember.permissions;
            
            const requiredPermissions = [
                PermissionFlagsBits.BanMembers,
                PermissionFlagsBits.KickMembers,
                PermissionFlagsBits.ModerateMembers,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.Administrator
            ];
            
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🤖 Bot Status & Permissions')
                .setThumbnail(botMember.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Bot Name', value: botMember.user.tag, inline: true },
                    { name: 'Bot ID', value: botMember.user.id, inline: true },
                    { name: 'Highest Role', value: botMember.roles.highest.name, inline: true },
                    { name: 'Joined Server', value: botMember.joinedAt.toLocaleDateString(), inline: true }
                )
                .setTimestamp();

            // Check each required permission
            const permissionFields = [];
            for (const permission of requiredPermissions) {
                const hasPermission = botPermissions.has(permission);
                const emoji = hasPermission ? '✅' : '❌';
                const permissionName = Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === permission);
                permissionFields.push(`${emoji} ${permissionName}`);
            }

            embed.addFields({
                name: 'Required Permissions',
                value: permissionFields.join('\n'),
                inline: false
            });

            // Check if bot can manage the user who ran the command
            const userMember = interaction.member;
            const canManageUser = botMember.permissions.has(PermissionFlagsBits.ModerateMembers) && 
                                botMember.roles.highest.position > userMember.roles.highest.position;

            embed.addFields({
                name: 'Can Manage You',
                value: canManageUser ? '✅ Yes' : '❌ No',
                inline: true
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in checkbot command:', error);
            await interaction.reply({
                content: '❌ An error occurred while checking bot status.',
                ephemeral: true
            });
        }
    }
};
