const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display the server\'s top ranked users'),

    async execute(interaction) {
        try {
            // Get top 10 users
            const topUsers = await db.query(
                'SELECT * FROM users WHERE guild_id = $1 ORDER BY level DESC, xp DESC LIMIT 10',
                [interaction.guild.id]
            );

            if (!topUsers.rows.length) {
                return await interaction.reply({ 
                    content: 'No users found in the leaderboard!',
                    ephemeral: true 
                });
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🏆 Server Leaderboard')
                .setColor('#71FF7B')
                .setDescription('Top 10 users by level and XP');

            // Format leaderboard entries
            let leaderboardText = '';
            for (let i = 0; i < topUsers.rows.length; i++) {
                const user = topUsers.rows[i];
                const member = await interaction.guild.members.fetch(user.user_id).catch(() => null);
                const username = member ? member.user.username : `User-${user.user_id}`;
                const nextLevelXP = Math.floor(100 * Math.pow(1.5, user.level));
                
                // Add medal emoji for top 3
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▫️';
                
                leaderboardText += `${medal} **${username}**\n`;
                leaderboardText += `Level ${user.level} • ${user.xp}/${nextLevelXP} XP\n\n`;
            }

            embed.addFields({ 
                name: 'Rankings', 
                value: leaderboardText || 'No rankings available.' 
            });

            // Send the embed
            await interaction.reply({ 
                embeds: [embed],
                ephemeral: false
            });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.reply({ 
                content: 'There was an error while fetching the leaderboard!',
                ephemeral: true 
            });
        }
    }
};