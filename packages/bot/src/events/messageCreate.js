const { Collection, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { CanvasUtils } = require('../utils/canvasUtils');
const pool = getDefaultPool();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        try {
            // Check cooldown
            const cooldowns = message.client.cooldowns;
            if (!cooldowns.has('xp')) {
                cooldowns.set('xp', new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get('xp');
            const cooldownAmount = process.env.COOLDOWN || 60000;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) return;
            }

            // Add XP
            const baseXp = parseInt(process.env.BASE_XP) || 15;
            const xpGain = Math.floor(Math.random() * 5) + baseXp; // Random XP between baseXp and baseXp+5

            // Update or create user XP in database
            const result = await pool.query(
                'INSERT INTO users (user_id, guild_id, xp, level, message_count) VALUES ($1, $2, $3, 1, 1) ON CONFLICT (user_id, guild_id) DO UPDATE SET xp = users.xp + $3, message_count = users.message_count + 1, updated_at = CURRENT_TIMESTAMP RETURNING xp, level',
                [message.author.id, message.guild.id, xpGain]
            );

            const { xp, level } = result.rows[0];
            const newLevel = Math.floor(0.1 * Math.sqrt(xp));

            // Level up
            if (newLevel > level) {
                await pool.query('UPDATE users SET level = $1 WHERE user_id = $2 AND guild_id = $3', [newLevel, message.author.id, message.guild.id]);
                
                try {
                    // Generate beautiful level-up image
                    const levelUpImage = await CanvasUtils.createLevelUpImage(message.author, newLevel);
                    const attachment = new AttachmentBuilder(levelUpImage, { name: 'levelup.png' });
                    
                    // Send level-up message with image
                    await message.channel.send({
                        content: `🎉 **Congratulations ${message.author}!** You've reached **Level ${newLevel}**! 🚀`,
                        files: [attachment]
                    });
                } catch (imageError) {
                    console.error('Error generating level-up image:', imageError);
                    // Fallback to text message if image generation fails
                    await message.channel.send(`🎉 **Congratulations ${message.author}!** You've reached **Level ${newLevel}**! 🚀`);
                }
            }

            // Set cooldown
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        } catch (error) {
            console.error('Error in messageCreate event:', error);
        }
    }
};