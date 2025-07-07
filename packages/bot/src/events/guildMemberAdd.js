const { Events, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { createWelcomeCard } = require('../utils/welcomeCard');
const pool = getDefaultPool();

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Get the welcome channel configuration
            const result = await pool.query(
                'SELECT welcome_channel_id, rules_channel_id, intro_channel_id, roles_channel_id, showcase_channel_id, general_channel_id FROM guild_config WHERE guild_id = $1',
                [member.guild.id]
            );

            if (!result.rows[0]?.welcome_channel_id) return;

            const config = result.rows[0];
            const welcomeChannel = await member.guild.channels.fetch(config.welcome_channel_id);

            if (!welcomeChannel) return;

            // Get the invite information
            const invites = await member.guild.invites.fetch();
            let inviter = 'Unknown';

            // Find the invite that was used
            const usedInvite = invites.find(invite => invite.uses > 0);
            if (usedInvite) {
                inviter = usedInvite.inviter?.tag || 'Unknown';
            }

            // Get user's avatar URL with proper format and size
            const userAvatarURL = member.user.displayAvatarURL({
                extension: 'png',
                size: 512,
                forceStatic: true
            });
            
            console.log('User Avatar URL:', userAvatarURL);

            // Create welcome card
            const welcomeCard = await createWelcomeCard(
                member.user.username,
                inviter,
                member.guild.memberCount,
                userAvatarURL
            );

            // Create attachment
            const attachment = new AttachmentBuilder(welcomeCard, { name: 'welcome-card.png' });

            // Helper function to format channel mention or return generic text
            const formatChannel = (channelId, defaultName) => {
                if (!channelId) return defaultName;
                return `<#${channelId}>`;
            };

            // Create a more engaging welcome message focused on bot features
            const welcomeMessage = [
                `🌟 **Welcome to the Design Engineers Club, ${member}!** 🌟`,
                '',
                '🤖 **Bot Features:**',
                '• `/showcase add` - Share your projects with the community',
                '• `/skills add` - Add your technical skills and earn badges',
                '• `/rank` - Check your activity level and XP',
                '• `/github` - Connect your GitHub profile',
                '',
                '📈 **Level Up:**',
                '• Gain XP by being active in discussions',
                '• Climb the `/leaderboard` and compete with others',
                '• Showcase your projects to earn recognition',
                '',
                '🔥 **Pro Tips:**',
                '• Use `/showcase view` to discover amazing projects',
                '• Share your work in progress for feedback',
                '• Connect with fellow designers and developers',
                '',
                '🚀 Ready to start your journey? Try `/help` to explore all features!'
            ].join('\n');

            // Send welcome message
            await welcomeChannel.send({
                content: welcomeMessage,
                files: [attachment]
            });

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },
};