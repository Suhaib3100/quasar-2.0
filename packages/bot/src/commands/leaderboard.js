const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();
const CanvasUtils = require('../utils/canvasUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display the server\'s top ranked users')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number of the leaderboard')
                .setMinValue(1)
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const page = interaction.options.getInteger('page') || 1;
            const usersPerPage = 10;
            const skip = (page - 1) * usersPerPage;

            const totalUsersResult = await db.query('SELECT COUNT(*) FROM users WHERE guild_id = $1', [interaction.guild.id]);
            const totalUsers = parseInt(totalUsersResult.rows[0].count);
            const maxPages = Math.ceil(totalUsers / usersPerPage);

            if (page > maxPages && maxPages > 0) {
                return await interaction.editReply(`Invalid page number! Please select a page between 1 and ${maxPages}`);
            }

            const topUsers = await db.query(
                'SELECT * FROM users WHERE guild_id = $1 ORDER BY level DESC, xp DESC OFFSET $2 LIMIT $3',
                [interaction.guild.id, skip, usersPerPage]
            );

            if (!topUsers.rows.length) {
                return await interaction.editReply('No users found in the leaderboard!');
            }

            const formattedUsers = [];
            for (let i = 0; i < topUsers.rows.length; i++) {
                const user = topUsers.rows[i];
                const member = await interaction.guild.members.fetch(user.user_id).catch(() => null);
                if (member) {
                    const nextLevelXP = Math.floor(100 * Math.pow(1.5, user.level));
                    formattedUsers.push({
                        username: member.user.username,
                        level: user.level,
                        xp: user.xp,
                        nextLevelXP: nextLevelXP,
                        avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                        userId: member.user.id,
                        discriminator: member.user.discriminator || '0'
                    });
                }
            }

            if (formattedUsers.length === 0) {
                return await interaction.editReply('No valid users found in the leaderboard!');
            }

            const leaderboardImage = await CanvasUtils.createLeaderboardImage(formattedUsers);
            const attachment = new AttachmentBuilder(leaderboardImage, { name: 'leaderboard.png' });

            await interaction.editReply({
                content: `🏆 Server Leaderboard - Page ${page}/${maxPages}`,
                files: [attachment]
            });
        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.editReply('There was an error while fetching the leaderboard!');
        }
    }
};