const { Events, EmbedBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const buttonId = interaction.customId;
        if (!buttonId.startsWith('suggestion_')) return;

        try {
            // Get suggestion data from database
            const suggestionMessage = interaction.message;
            const result = await db.query(
                'SELECT * FROM suggestions WHERE message_id = $1',
                [suggestionMessage.id]
            );

            if (!result.rows[0]) {
                return await interaction.reply({ content: 'Could not find suggestion data.', ephemeral: true });
            }

            const suggestion = result.rows[0];

            // Handle different button actions
            switch (buttonId) {
                case 'suggestion_upvote':
                case 'suggestion_downvote':
                    // Check if user has already voted
                    const voteResult = await db.query(
                        'SELECT vote_type FROM suggestion_votes WHERE suggestion_id = $1 AND user_id = $2',
                        [suggestion.id, interaction.user.id]
                    );

                    const isUpvote = buttonId === 'suggestion_upvote';
                    const voteType = isUpvote ? 'upvote' : 'downvote';

                    if (voteResult.rows[0]) {
                        if (voteResult.rows[0].vote_type === voteType) {
                            // Remove vote if clicking same button
                            await db.query(
                                'DELETE FROM suggestion_votes WHERE suggestion_id = $1 AND user_id = $2',
                                [suggestion.id, interaction.user.id]
                            );
                        } else {
                            // Change vote type
                            await db.query(
                                'UPDATE suggestion_votes SET vote_type = $1 WHERE suggestion_id = $2 AND user_id = $3',
                                [voteType, suggestion.id, interaction.user.id]
                            );
                        }
                    } else {
                        // Add new vote with guild_id
                        await db.query(
                            'INSERT INTO suggestion_votes (suggestion_id, user_id, guild_id, vote_type) VALUES ($1, $2, $3, $4)',
                            [suggestion.id, interaction.user.id, interaction.guild.id, voteType]
                        );
                    }

                    // Get updated vote counts
                    const voteCounts = await db.query(
                        'SELECT vote_type, COUNT(*) FROM suggestion_votes WHERE suggestion_id = $1 GROUP BY vote_type',
                        [suggestion.id]
                    );

                    let upvotes = 0;
                    let downvotes = 0;

                    voteCounts.rows.forEach(row => {
                        if (row.vote_type === 'upvote') upvotes = parseInt(row.count);
                        if (row.vote_type === 'downvote') downvotes = parseInt(row.count);
                    });

                    // Calculate percentages and create distribution bar
                    const total = upvotes + downvotes;
                    const upvotePercentage = total > 0 ? (upvotes / total) * 100 : 0;
                    const downvotePercentage = total > 0 ? (downvotes / total) * 100 : 0;

                    // Create an enhanced distribution bar with gradient effect
                    const barWidth = 20;
                    const upvoteChars = Math.round((upvotePercentage / 100) * barWidth);
                    const upvoteSection = '▰'.repeat(upvoteChars);
                    const downvoteSection = '▱'.repeat(barWidth - upvoteChars);
                    const distributionBar = `${upvoteSection}${downvoteSection}`;

                    // Update embed with enhanced formatting
                    const embed = EmbedBuilder.from(suggestionMessage.embeds[0]);
                    embed.data.fields[1] = { name: 'Status', value: '🔵 Pending', inline: true };
                    embed.data.fields[2] = { 
                        name: 'Votes', 
                        value: `👍 ${upvotes} upvotes • 👎 ${downvotes} downvotes`, 
                        inline: true 
                    };
                    embed.data.fields[3] = { 
                        name: 'Distribution', 
                        value: `\`${distributionBar}\` ${upvotePercentage.toFixed(1)}% positive`
                    };

                    await interaction.update({ embeds: [embed] });
                    break;

                case 'suggestion_view_votes':
                    const voters = await db.query(
                        'SELECT u.username, sv.vote_type FROM suggestion_votes sv JOIN users u ON sv.user_id = u.user_id AND sv.guild_id = u.guild_id WHERE sv.suggestion_id = $1',
                        [suggestion.id]
                    );

                    const voteList = voters.rows.reduce((acc, vote) => {
                        const emoji = vote.vote_type === 'upvote' ? '👍' : '👎';
                        return acc + `${emoji} ${vote.username}\n`;
                    }, '');

                    await interaction.reply({
                        content: voteList || 'No votes yet!',
                        ephemeral: true
                    });
                    break;
            }
        } catch (error) {
            console.error('Error handling suggestion interaction:', error);
            await interaction.reply({
                content: 'There was an error processing your vote. Please try again later.',
                ephemeral: true
            });
        }
    },
};