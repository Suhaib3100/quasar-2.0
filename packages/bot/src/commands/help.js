const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Command categories with emojis and colors
const categories = {
    showcase: {
        emoji: '🎨',
        name: 'Showcase & Projects',
        color: '#FF6B6B',
        description: 'Share and discover amazing projects',
        commands: [
            { name: '/showcase add', description: 'Share your project with the community', usage: '/showcase add', example: 'Fills a form with project details' },
            { name: '/showcase view', description: 'Browse community projects', usage: '/showcase view [user]', example: 'View all projects or from specific user' }
        ]
    },
    skills: {
        emoji: '🛠️',
        name: 'Skills & Badges',
        color: '#4ECDC4',
        description: 'Track and showcase your technical skills',
        commands: [
            { name: '/skills add', description: 'Add a new skill badge', usage: '/skills add <skill>', example: 'Add skills like JavaScript, React, etc.' },
            { name: '/skills view', description: 'View skill badges', usage: '/skills view [user]', example: 'See your or others\' skill badges' }
        ]
    },
    leveling: {
        emoji: '📈',
        name: 'Leveling & Progress',
        color: '#FFD93D',
        description: 'Track your activity and progress',
        commands: [
            { name: '/rank', description: 'Check your current level and XP', usage: '/rank', example: 'Shows your activity stats' },
            { name: '/leaderboard', description: 'View server XP leaderboard', usage: '/leaderboard', example: 'See top active members' }
        ]
    },
    github: {
        emoji: '🐙',
        name: 'GitHub Integration',
        color: '#6E5494',
        description: 'Connect and showcase your GitHub',
        commands: [
            { name: '/github connect', description: 'Link your GitHub profile', usage: '/github connect <username>', example: 'Connect GitHub: username' },
            { name: '/github view', description: 'View GitHub stats', usage: '/github view [user]', example: 'See GitHub activity and repos' }
        ]
    },
    config: {
        emoji: '⚙️',
        name: 'Configuration',
        color: '#95A5A6',
        description: 'Server configuration commands',
        commands: [
            { name: '/configchannels', description: 'Set up server channels', usage: '/configchannels', example: 'Configure welcome, rules channels etc.' },
            { name: '/configroles', description: 'Configure server roles', usage: '/configroles', example: 'Set up automatic role assignment' }
        ]
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get detailed help about bot commands')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Specific category to view')
                .setRequired(false)
                .addChoices(
                    { name: '🎨 Showcase & Projects', value: 'showcase' },
                    { name: '🛠️ Skills & Badges', value: 'skills' },
                    { name: '📈 Leveling & Progress', value: 'leveling' },
                    { name: '🐙 GitHub Integration', value: 'github' },
                    { name: '⚙️ Configuration', value: 'config' }
                )),

    async execute(interaction) {
        const selectedCategory = interaction.options.getString('category');

        if (selectedCategory) {
            // Show detailed category view
            const category = categories[selectedCategory];
            const embed = new EmbedBuilder()
                .setColor(category.color)
                .setTitle(`${category.emoji} ${category.name}`)
                .setDescription(category.description)
                .addFields(
                    category.commands.map(cmd => ({
                        name: `${cmd.name}`,
                        value: `**Description:** ${cmd.description}\n**Usage:** \`${cmd.usage}\`\n**Example:** ${cmd.example}`,
                        inline: false
                    }))
                )
                .setFooter({ text: 'Use /help to see all categories' });

            await interaction.reply({ embeds: [embed] });
        } else {
            // Show main help menu
            const mainEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 Design Engineers Bot - Help Menu')
                .setDescription('Welcome to the help menu! Select a category to learn more about specific features.')
                .addFields(
                    Object.values(categories).map(category => ({
                        name: `${category.emoji} ${category.name}`,
                        value: `${category.description}\nUse \`/help category:${category.name}\` for details`,
                        inline: false
                    }))
                )
                .setFooter({ text: 'Tip: Use the buttons below to navigate' });

            // Create navigation buttons
            const row = new ActionRowBuilder().addComponents(
                Object.entries(categories).map(([key, cat]) =>
                    new ButtonBuilder()
                        .setCustomId(`help_${key}`)
                        .setLabel(cat.name)
                        .setEmoji(cat.emoji)
                        .setStyle(ButtonStyle.Secondary)
                )
            );

            const response = await interaction.reply({
                embeds: [mainEmbed],
                components: [row],
                fetchReply: true
            });

            // Create button collector
            const collector = response.createMessageComponentCollector({
                time: 60000 // 1 minute timeout
            });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    const categoryKey = i.customId.replace('help_', '');
                    const category = categories[categoryKey];

                    const categoryEmbed = new EmbedBuilder()
                        .setColor(category.color)
                        .setTitle(`${category.emoji} ${category.name}`)
                        .setDescription(category.description)
                        .addFields(
                            category.commands.map(cmd => ({
                                name: `${cmd.name}`,
                                value: `**Description:** ${cmd.description}\n**Usage:** \`${cmd.usage}\`\n**Example:** ${cmd.example}`,
                                inline: false
                            }))
                        )
                        .setFooter({ text: 'Click any button to view other categories' });

                    await i.update({ embeds: [categoryEmbed], components: [row] });
                } else {
                    await i.reply({
                        content: 'These buttons aren\'t for you!',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                // Remove buttons after timeout
                interaction.editReply({
                    components: []
                }).catch(console.error);
            });
        }
    }
}; 