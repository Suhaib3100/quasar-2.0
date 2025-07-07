const express = require('express');
const router = express.Router();
const { Client, GatewayIntentBits } = require('discord.js');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Middleware to verify API token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    if (token !== process.env.BOT_API_TOKEN) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    next();
};

// POST /moderation - Handle moderation actions
router.post('/', verifyToken, async (req, res) => {
    try {
        const { type, userId, moderatorId, reason, duration } = req.body;

        // Get the guild from the bot client
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!process.env.DISCORD_GUILD_ID) {
            console.error('DISCORD_GUILD_ID not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // Get the target member
        const member = await guild.members.fetch(userId);
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Execute moderation action based on type
        switch (type) {
            case 'warning':
                await member.send(`You have been warned by a moderator. Reason: ${reason}`);
                break;

            case 'timeout':
                await member.timeout(duration * 60 * 1000, reason); // Convert minutes to milliseconds
                break;

            case 'kick':
                await member.kick(reason);
                break;

            case 'ban':
                await member.ban({ reason });
                break;

            default:
                return res.status(400).json({ error: 'Invalid moderation action type' });
        }

        // Send success response
        res.json({ success: true, message: `Successfully executed ${type} action` });

    } catch (error) {
        console.error('Error executing moderation action:', error);
        console.error('Action details:', { type, userId, moderatorId, reason, duration });
        let errorMessage = 'Failed to execute moderation action';
        if (error.code === 50013) {
            errorMessage = 'Bot lacks required permissions';
        } else if (error.code === 50028) {
            errorMessage = 'Invalid member';
        }
        res.status(500).json({ error: errorMessage, code: error.code });
    }
});

module.exports = router;