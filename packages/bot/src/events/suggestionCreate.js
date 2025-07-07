const { Events, EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        try {
            // Check if this is the suggestions channel
            const result = await db.query(
                'SELECT suggestions_channel_id FROM guild_settings WHERE guild_id = $1',
                [message.guild.id]
            );

            if (!result.rows[0]?.suggestions_channel_id || 
                message.channel.id !== result.rows[0].suggestions_channel_id) {
                return;
            }

            // Delete the original message
            await message.delete();

            // Create a professional suggestion embed
            const suggestionEmbed = new EmbedBuilder()
                .setColor('#00FF9D')
                .setAuthor({
                    name: 'Quasar Suggestions',
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .addFields(
                    { name: 'Suggestion', value: message.content },
                    { name: 'Status', value: '🔵 Pending', inline: true },
                    { name: 'Vote Count', value: '0 votes upvotes • 0 votes downvotes', inline: true },
                    { name: 'Vote Distribution', value: '```\n░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.0% • 0.0%\n```' },
                    { name: 'Author', value: `<@${message.author.id}> (${message.author.tag})` }
                )
                .setFooter({ text: `Suggestion ID: ${Date.now().toString(36)}` })
                .setTimestamp();

            // Create action row for buttons
            const row = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Upvote',
                        custom_id: 'suggestion_upvote',
                        emoji: '👍'
                    },
                    {
                        type: 2,
                        style: 4,
                        label: 'Downvote',
                        custom_id: 'suggestion_downvote',
                        emoji: '👎'
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'View Votes',
                        custom_id: 'suggestion_view_votes'
                    }
                ]
            };

            // Send the embed with buttons
            const suggestionMessage = await message.channel.send({
                embeds: [suggestionEmbed],
                components: [row]
            });

            // Create discussion thread
            const thread = await suggestionMessage.startThread({
                name: `Suggestion Discussion: ${message.content.slice(0, 30)}${message.content.length > 30 ? '...' : ''}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
            });

            // Store suggestion in database
            await db.query(
                'INSERT INTO suggestions (guild_id, user_id, message_id, content) VALUES ($1, $2, $3, $4)',
                [message.guild.id, message.author.id, suggestionMessage.id, message.content]
            );

        } catch (error) {
            console.error('Error handling suggestion:', error);
            try {
                await message.author.send('There was an error processing your suggestion. Please try again later.');
            } catch {}
        }
    },
};