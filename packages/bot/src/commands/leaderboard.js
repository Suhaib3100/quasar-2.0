const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { createCanvas, loadImage } = require('canvas');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display server leaderboard'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Get top 5 users
            const result = await db.query(
                'SELECT * FROM users WHERE guild_id = $1 ORDER BY level DESC, xp DESC LIMIT 5',
                [interaction.guild.id]
            );

            if (!result.rows.length) {
                return await interaction.editReply('No users found.');
            }

            // Create canvas
            const canvas = createCanvas(1280, 720);
            const ctx = canvas.getContext('2d');

            // Black background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Title
            ctx.font = '48px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText('Leaderboard', 40, 60);

            // Table headers
            const TABLE_TOP = 100;
            const TABLE_LEFT = 40;
            const TABLE_RIGHT = canvas.width - 40;
            const ROW_HEIGHT = 80;

            // Draw header row
            ctx.fillStyle = '#ffffff08';
            ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_RIGHT - TABLE_LEFT, 50);

            // Header text
            ctx.font = '24px Arial';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'left';
            ctx.fillText('USER', TABLE_LEFT + 20, TABLE_TOP + 32);
            ctx.textAlign = 'right';
            ctx.fillText('PROGRESS', TABLE_RIGHT - 320, TABLE_TOP + 32);
            ctx.fillText('LEVEL', TABLE_RIGHT - 40, TABLE_TOP + 32);

            // Draw header separator
            ctx.strokeStyle = '#ffffff11';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(TABLE_LEFT, TABLE_TOP + 50);
            ctx.lineTo(TABLE_RIGHT, TABLE_TOP + 50);
            ctx.stroke();

            // Draw vertical separators
            ctx.beginPath();
            ctx.moveTo(TABLE_RIGHT - 400, TABLE_TOP);
            ctx.lineTo(TABLE_RIGHT - 400, TABLE_TOP + 50 + (ROW_HEIGHT * result.rows.length));
            ctx.moveTo(TABLE_RIGHT - 150, TABLE_TOP);
            ctx.lineTo(TABLE_RIGHT - 150, TABLE_TOP + 50 + (ROW_HEIGHT * result.rows.length));
            ctx.stroke();

            // User colors
            const userColors = {
                0: '#71FF7B', // Green
                1: '#7B94FF', // Blue
                2: '#C77BFF', // Purple
                default: '#FFFFFF'
            };

            // Draw each user row
            for (let i = 0; i < result.rows.length; i++) {
                const user = result.rows[i];
                const rowY = TABLE_TOP + 50 + (i * ROW_HEIGHT);
                const color = userColors[i] || userColors.default;

                // Draw alternating row backgrounds
                if (i % 2 === 0) {
                    ctx.fillStyle = '#ffffff04';
                    ctx.fillRect(TABLE_LEFT, rowY, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT);
                }

                try {
                    // Get Discord user info
                    const member = await interaction.guild.members.fetch(user.user_id).catch(() => null);
                    const username = member ? member.user.username : `User-${user.user_id}`;
                    const avatarURL = member ? member.user.displayAvatarURL({ extension: 'png', size: 128 }) : null;

                    // Draw avatar if available
                    if (avatarURL) {
                        const avatar = await loadImage(avatarURL);
                        const avatarSize = 40;
                        const avatarX = TABLE_LEFT + 20;
                        const avatarY = rowY + (ROW_HEIGHT - avatarSize) / 2;

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                        ctx.restore();
                    }

                    // Draw username
                    ctx.font = '28px Arial';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'left';
                    ctx.fillText(username, TABLE_LEFT + 80, rowY + (ROW_HEIGHT/2) + 10);

                    // Draw level
                    ctx.textAlign = 'right';
                    ctx.fillText(`lvl ${user.level}`, TABLE_RIGHT - 20, rowY + (ROW_HEIGHT/2) + 10);

                    // Draw XP progress
                    const nextLevelXP = Math.floor(100 * Math.pow(1.5, user.level));
                    ctx.font = '20px Arial';
                    ctx.fillStyle = '#8BE2E7';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${user.xp}/${nextLevelXP} XP`, TABLE_RIGHT - 170, rowY + (ROW_HEIGHT/2) + 10);

                    // Draw progress bar
                    const progressWidth = 200;
                    const progressHeight = 6;
                    const progressX = TABLE_RIGHT - 370;
                    const progressY = rowY + (ROW_HEIGHT/2) + 15;
                    const progress = user.xp / nextLevelXP;

                    // Progress bar background
                    ctx.fillStyle = '#ffffff11';
                    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

                    // Progress bar fill
                    ctx.fillStyle = color;
                    ctx.fillRect(progressX, progressY, progressWidth * Math.min(progress, 1), progressHeight);
                } catch (error) {
                    console.error(`Error processing user ${user.user_id}:`, error);
                    continue;
                }
            }

            // Convert canvas to attachment
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'leaderboard.png' });
            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Error generating leaderboard!');
        }
    }
};