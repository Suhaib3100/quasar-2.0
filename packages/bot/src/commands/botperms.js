const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botperms')
        .setDescription('Check bot permissions in this server')
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
            
            const permissionNames = {
                [PermissionFlagsBits.BanMembers]: 'Ban Members',
                [PermissionFlagsBits.KickMembers]: 'Kick Members',
                [PermissionFlagsBits.ModerateMembers]: 'Moderate Members',
                [PermissionFlagsBits.ManageRoles]: 'Manage Roles',
                [PermissionFlagsBits.Administrator]: 'Administrator'
            };
            
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('🤖 Bot Permissions Check')
                .setDescription(`Checking permissions for ${botMember.user.tag}`)
                .addFields(
                    { name: 'Bot Role', value: botMember.roles.highest.name, inline: true },
                    { name: 'Bot Position', value: `${botMember.roles.highest.position}/${interaction.guild.roles.cache.size}`, inline: true }
                );
            
            let permissionsField = '';
            requiredPermissions.forEach(permission => {
                const hasPermission = botPermissions.has(permission);
                const emoji = hasPermission ? '✅' : '❌';
                permissionsField += `${emoji} ${permissionNames[permission]}\n`;
            });
            
            embed.addFields({
                name: 'Required Permissions',
                value: permissionsField,
                inline: false
            });
            
            // Check if bot can see all commands
            const canSeeCommands = botPermissions.has(PermissionFlagsBits.Administrator) || 
                                 (botPermissions.has(PermissionFlagsBits.BanMembers) && 
                                  botPermissions.has(PermissionFlagsBits.KickMembers) && 
                                  botPermissions.has(PermissionFlagsBits.ModerateMembers));
            
            embed.addFields({
                name: 'Command Visibility',
                value: canSeeCommands ? '✅ Bot can see all moderation commands' : '❌ Bot missing permissions for some commands',
                inline: false
            });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in botperms command:', error);
            await interaction.reply({
                content: '❌ An error occurred while checking bot permissions.',
                ephemeral: true
            });
        }
    }
};
