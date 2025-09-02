const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
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
            const progressBar = createProgressBar(progress);

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('🏆 Rank Card')
                .addFields(
                    { name: 'Level', value: userLevel.toString(), inline: true },
                    { name: 'XP', value: `${userXP}/${nextLevelXP}`, inline: true },
                    { name: 'Messages', value: userMessageCount.toString(), inline: true },
                    { name: 'Progress', value: progressBar }
                );

            // Get current role information
            const roleResult = await db.query(
                'SELECT * FROM role_rewards WHERE guild_id = $1 AND required_level <= $2 ORDER BY required_level DESC LIMIT 1',
                [interaction.guild.id, userLevel]
            );

            if (roleResult.rows.length > 0) {
                const currentRole = roleResult.rows[0];
                embed.addFields({ name: 'Current Role', value: currentRole.level_name, inline: true });

                // Get next role information
                const nextRoleResult = await db.query(
                    'SELECT * FROM role_rewards WHERE guild_id = $1 AND required_level > $2 ORDER BY required_level ASC LIMIT 1',
                    [interaction.guild.id, userLevel]
                );

                if (nextRoleResult.rows.length > 0) {
                    const nextRole = nextRoleResult.rows[0];
                    const levelsUntilNext = nextRole.required_level - userLevel;
                    embed.addFields({ name: 'Next Role', value: `${nextRole.level_name} (in ${levelsUntilNext} levels)`, inline: true });
                }
            }

            embed.setFooter({ text: `${progress.toFixed(1)}% to next level` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
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

function createProgressBar(progress) {
    // Ensure progress is between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const filledSquares = Math.floor(clampedProgress / 10);
    const emptySquares = 10 - filledSquares;
    return '█'.repeat(filledSquares) + '░'.repeat(emptySquares);
}