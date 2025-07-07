const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();
const { createCanvas, loadImage } = require('canvas');
const { join } = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skills')
        .setDescription('Manage and display your technical skills')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new skill badge')
                .addStringOption(option =>
                    option.setName('skill')
                        .setDescription('The skill to add')
                        .setRequired(true)
                        .addChoices(
                            { name: 'JavaScript', value: 'javascript' },
                            { name: 'Python', value: 'python' },
                            { name: 'Java', value: 'java' },
                            { name: 'C++', value: 'cpp' },
                            { name: 'React', value: 'react' },
                            { name: 'Node.js', value: 'nodejs' },
                            { name: 'SQL', value: 'sql' },
                            { name: 'AWS', value: 'aws' },
                            { name: 'Docker', value: 'docker' },
                            { name: 'Git', value: 'git' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View skill badges')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('View skills of a specific user')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const skill = interaction.options.getString('skill');

            try {
                // Check if the skill badge exists
                let badgeResult = await db.query(
                    'SELECT id FROM skill_badges WHERE name = $1',
                    [skill]
                );

                let badgeId;
                if (badgeResult.rows.length === 0) {
                    // Create the skill badge if it doesn't exist
                    const newBadge = await db.query(
                        'INSERT INTO skill_badges (name, category, icon_url) VALUES ($1, $2, $3) RETURNING id',
                        [skill, 'technical', `https://example.com/badges/${skill}.png`]
                    );
                    badgeId = newBadge.rows[0].id;
                } else {
                    badgeId = badgeResult.rows[0].id;
                }

                // Add the skill badge to the user
                await db.query(
                    'INSERT INTO user_skill_badges (user_id, guild_id, badge_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [interaction.user.id, interaction.guildId, badgeId]
                );

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🏆 Skill Badge Added!')
                    .setDescription(`You've earned the ${skill} skill badge!`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error adding skill badge:', error);
                await interaction.reply({
                    content: 'There was an error adding the skill badge.',
                    ephemeral: true
                });
            }
        } else if (subcommand === 'view') {
            const targetUser = interaction.options.getUser('user') || interaction.user;

            try {
                const result = await db.query(
                    `SELECT sb.name, sb.icon_url, usb.earned_at 
                     FROM user_skill_badges usb 
                     JOIN skill_badges sb ON usb.badge_id = sb.id 
                     WHERE usb.user_id = $1 AND usb.guild_id = $2 
                     ORDER BY usb.earned_at DESC`,
                    [targetUser.id, interaction.guildId]
                );

                if (result.rows.length === 0) {
                    return interaction.reply({
                        content: targetUser.id === interaction.user.id ?
                            'You haven\'t earned any skill badges yet! Use `/skills add` to add your skills.' :
                            'This user hasn\'t earned any skill badges yet.',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${targetUser.username}'s Skill Badges`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setDescription('Here are the technical skills this user has demonstrated:')
                    .setTimestamp();

                result.rows.forEach(badge => {
                    embed.addFields({
                        name: badge.name,
                        value: `Earned: ${new Date(badge.earned_at).toLocaleDateString()}`,
                        inline: true
                    });
                });

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error viewing skill badges:', error);
                await interaction.reply({
                    content: 'There was an error viewing the skill badges.',
                    ephemeral: true
                });
            }
        }
    },
};