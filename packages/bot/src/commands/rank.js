const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const CanvasUtils = require('../utils/canvasUtils');
const db = getDefaultPool();
const RoleManager = require('../utils/roleManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Display your current rank and level progress'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            console.log(`Fetching user data for ${interaction.user.id} in guild ${interaction.guild.id}`);
            
            let userResult = await db.query(
                'SELECT * FROM users WHERE user_id = $1 AND guild_id = $2',
                [interaction.user.id, interaction.guild.id]
            );

            let user;
            if (!userResult.rows.length) {
                console.log('User not found, creating new user...');
                const newUserResult = await db.query(
                    'INSERT INTO users (user_id, guild_id, xp, level, message_count) VALUES ($1, $2, 0, 0, 0) RETURNING *',
                    [interaction.user.id, interaction.guild.id]
                );
                user = newUserResult.rows[0];
                console.log('New user created:', user);
            } else {
                user = userResult.rows[0];
                console.log('Existing user found:', user);
            }

            // Ensure user has required properties with defaults
            const userXP = user.xp || 0;
            const userLevel = user.level || 0;
            const userMessageCount = user.message_count || 0;
            
            const nextLevelXP = Math.floor(100 * Math.pow(1.5, userLevel));
            const progress = nextLevelXP > 0 ? (userXP / nextLevelXP) * 100 : 0;

            // Get user's rank in the server
            const rankResult = await db.query(
                'SELECT COUNT(*) + 1 as rank FROM users WHERE guild_id = $1 AND (level > $2 OR (level = $2 AND xp > $3))',
                [interaction.guild.id, userLevel, userXP]
            );
            const userRank = rankResult.rows[0]?.rank || 1;

            // Prepare user data for the rank card
            const userData = {
                level: userLevel,
                xp: userXP,
                nextLevelXP: nextLevelXP,
                messageCount: userMessageCount,
                rank: userRank
            };

            try {
                // Generate beautiful rank card image
                const rankCanvas = await CanvasUtils.createRankCard(interaction.user, userData, interaction.guild.name);
                const rankBuffer = rankCanvas.toBuffer('image/png');
                const rankAttachment = new AttachmentBuilder(rankBuffer, { name: 'rank-card.png' });

                await interaction.editReply({
                    content: `🏆 **${interaction.user.username}**'s Rank Card`,
                    files: [rankAttachment]
                });
            } catch (imageError) {
                console.error('Error generating rank card image:', imageError);
                
                // Fallback to text-based response if image generation fails
                const fallbackMessage = `🏆 **${interaction.user.username}**'s Rank Card\n\n` +
                    `**Level:** ${userLevel}\n` +
                    `**XP:** ${userXP}/${nextLevelXP}\n` +
                    `**Messages:** ${userMessageCount}\n` +
                    `**Rank:** #${userRank}\n` +
                    `**Progress:** ${progress.toFixed(1)}% to next level`;

                await interaction.editReply(fallbackMessage);
            }
        } catch (error) {
            console.error('Error in rank command:', error);
            let errorMessage = 'There was an error while fetching your rank!';
            
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Database connection failed. Please try again later.';
            } else if (error.code === '42P01') {
                errorMessage = 'Database table not found. Please contact an administrator.';
            }
            
            try {
                await interaction.editReply(errorMessage);
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    }
};

