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
                'SELECT welcome_channel_id FROM guild_config WHERE guild_id = $1',
                [member.guild.id]
            );

            if (!result.rows[0]?.welcome_channel_id) return;

            const welcomeChannel = await member.guild.channels.fetch(result.rows[0].welcome_channel_id);

            if (!welcomeChannel) return;

            // Get user's avatar URL with proper format and size
            const userAvatarURL = member.user.displayAvatarURL({
                extension: 'png',
                size: 512,
                forceStatic: true
            });

            // Create welcome card
            const welcomeCard = await createWelcomeCard(
                member.user.username,
                'Unknown',
                member.guild.memberCount,
                userAvatarURL
            );

            // Create attachment
            const attachment = new AttachmentBuilder(welcomeCard, { name: 'welcome-card.png' });

            // Send welcome message
            await welcomeChannel.send({
                content: `Welcome to the Design Engineers Club, ${member}! Feel free to introduce yourself.`,
                files: [attachment]
            });

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    }
};