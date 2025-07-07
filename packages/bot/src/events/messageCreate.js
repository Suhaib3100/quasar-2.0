const { Collection } = require('discord.js');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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
                'INSERT INTO users (user_id, guild_id, xp, level) VALUES ($1, $2, $3, 1) ON CONFLICT (user_id, guild_id) DO UPDATE SET xp = users.xp + $3 RETURNING xp, level',
                [message.author.id, message.guild.id, xpGain]
            );

            const { xp, level } = result.rows[0];
            const newLevel = Math.floor(0.1 * Math.sqrt(xp));

            // Level up
            if (newLevel > level) {
                await pool.query('UPDATE users SET level = $1 WHERE user_id = $2', [newLevel, message.author.id]);
                message.channel.send(`Congratulations ${message.author}! You've reached level ${newLevel}! 🎉`);
            }

            // Set cooldown
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        } catch (error) {
            console.error('Error in messageCreate event:', error);
        }
    }
};