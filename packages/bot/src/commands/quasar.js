const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quasar')
        .setDescription('Quasar community onboarding system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('begin')
                .setDescription('Start your Quasar community journey')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'begin') {
            const modal = new ModalBuilder()
                .setCustomId('onboarding-modal')
                .setTitle('Welcome to Quasar Community!');

            const githubInput = new TextInputBuilder()
                .setCustomId('github')
                .setLabel('GitHub Username')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter your GitHub username (optional)')
                .setRequired(false)
                .setMaxLength(39);

            const interestsInput = new TextInputBuilder()
                .setCustomId('interests')
                .setLabel('Your Interests')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Web Development, Mobile Apps, etc. (optional)')
                .setRequired(false)
                .setMaxLength(100);

            const experienceInput = new TextInputBuilder()
                .setCustomId('experience')
                .setLabel('Experience Level')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Beginner, Intermediate, Advanced (optional)')
                .setRequired(false)
                .setMaxLength(50);

            const firstRow = new ActionRowBuilder().addComponents(githubInput);
            const secondRow = new ActionRowBuilder().addComponents(interestsInput);
            const thirdRow = new ActionRowBuilder().addComponents(experienceInput);

            modal.addComponents(firstRow, secondRow, thirdRow);

            await interaction.showModal(modal);

            try {
                const filter = (i) => i.customId === 'onboarding-modal';
                const submission = await interaction.awaitModalSubmit({ filter, time: 60000 });
                
                const github = submission.fields.getTextInputValue('github');
                const interests = submission.fields.getTextInputValue('interests');
                const experience = submission.fields.getTextInputValue('experience');

                try {
                    await db.query(
                        'INSERT INTO user_profiles (user_id, guild_id, github_username, interests, experience_level) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, guild_id) DO UPDATE SET github_username = $3, interests = $4, experience_level = $5',
                        [submission.user.id, submission.guildId, github || null, interests || null, experience || null]
                    );

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('🎉 Welcome to Quasar Community!')
                        .setDescription(`Great to have you here, ${submission.user}! Your profile has been set up.`)
                        .addFields(
                            github ? { name: '📌 GitHub', value: `[${github}](https://github.com/${github})`, inline: true } : null,
                            interests ? { name: '🎯 Interests', value: interests, inline: true } : null,
                            experience ? { name: '📚 Experience', value: experience, inline: true } : null
                        )
                        .setFooter({ text: 'Quasar Community Member', iconURL: submission.guild.iconURL() })
                        .setTimestamp();

                    await submission.reply({ embeds: [welcomeEmbed] });
                } catch (error) {
                    console.error('Error saving user profile:', error);
                    await submission.reply({ 
                        content: 'There was an error saving your profile information.',
                        ephemeral: true 
                    });
                }
            } catch (error) {
                if (error.code === 'InteractionCollectorError') {
                    console.log('Modal timed out');
                    return;
                }
                console.error('Error processing modal submission:', error);
            }
        }
    }
};