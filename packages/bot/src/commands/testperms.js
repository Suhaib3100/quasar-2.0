const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasPermission, SPECIAL_USER_IDS } = require('../utils/permissionUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testperms')
        .setDescription('Test permission system for debugging')
        .setDefaultMemberPermissions(0), // Visible to everyone

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const member = interaction.member;
            
            // Test the permission system
            const testPermissions = ['BanMembers', 'KickMembers', 'ModerateMembers'];
            const hasAccess = hasPermission(userId, testPermissions, member);
            
            // Also test with empty permissions (should always return true)
            const hasAccessNoPerms = hasPermission(userId, [], member);
            
            const embed = new EmbedBuilder()
                .setColor(hasAccess ? '#00FF00' : '#FF0000')
                .setTitle('🔍 Permission System Test')
                .addFields(
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'User Tag', value: interaction.user.tag, inline: true },
                    { name: 'Has Access (with perms)', value: hasAccess ? '✅ YES' : '❌ NO', inline: true },
                    { name: 'Has Access (no perms)', value: hasAccessNoPerms ? '✅ YES' : '❌ NO', inline: true },
                    { name: 'Special User IDs', value: SPECIAL_USER_IDS.join(', '), inline: false },
                    { name: 'Is Special User', value: SPECIAL_USER_IDS.includes(userId) ? '✅ YES' : '❌ NO', inline: true },
                    { name: 'User ID Type', value: typeof userId, inline: true },
                    { name: 'Special IDs Type', value: typeof SPECIAL_USER_IDS[0], inline: true }
                )
                .setFooter({ text: 'Debug Information' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in testperms command:', error);
            await interaction.reply({
                content: '❌ An error occurred while testing permissions.',
                ephemeral: true
            });
        }
    }
};
