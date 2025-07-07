const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();
const { createShowcaseCard } = require('../utils/showcaseCard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showcase')
        .setDescription('Manage project showcases')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add your project to showcase'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View project showcases')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('View projects from a specific user')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            return await handleAddShowcase(interaction);
        } else if (subcommand === 'view') {
            return await handleViewShowcase(interaction);
        }
    }
};

async function handleAddShowcase(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('showcase-modal')
        .setTitle('Add Project Showcase');

    const titleInput = new TextInputBuilder()
        .setCustomId('title')
        .setLabel('Project Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your project title')
        .setRequired(true)
        .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Project Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your project...')
        .setRequired(true)
        .setMaxLength(1000);

    const urlInput = new TextInputBuilder()
        .setCustomId('url')
        .setLabel('Project URL')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://your-project-url.com')
        .setRequired(true);

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('thumbnail')
        .setLabel('Thumbnail URL')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://image-url.com/thumbnail.png')
        .setRequired(false);

    const technologiesInput = new TextInputBuilder()
        .setCustomId('technologies')
        .setLabel('Technologies Used')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('React, Node.js, PostgreSQL')
        .setRequired(false);

    const firstRow = new ActionRowBuilder().addComponents(titleInput);
    const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdRow = new ActionRowBuilder().addComponents(urlInput);
    const fourthRow = new ActionRowBuilder().addComponents(thumbnailInput);
    const fifthRow = new ActionRowBuilder().addComponents(technologiesInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

    await interaction.showModal(modal);

    try {
        const filter = (i) => i.customId === 'showcase-modal';
        const submission = await interaction.awaitModalSubmit({ filter, time: 60000 });
        
        const title = submission.fields.getTextInputValue('title');
        const description = submission.fields.getTextInputValue('description');
        const projectUrl = submission.fields.getTextInputValue('url');
        const thumbnailUrl = submission.fields.getTextInputValue('thumbnail');
        const technologies = submission.fields.getTextInputValue('technologies');

        // Validate URLs
        try {
            if (projectUrl) new URL(projectUrl);
            if (thumbnailUrl) new URL(thumbnailUrl);
        } catch (error) {
            return await submission.reply({ 
                content: 'Please provide valid URLs for the project and thumbnail.',
                ephemeral: true 
            });
        }

        // Process technologies
        const techArray = technologies ? technologies.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0) : [];

        try {
            const result = await db.query(
                'INSERT INTO project_showcases (user_id, guild_id, title, description, project_url, thumbnail_url, technologies) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [submission.user.id, submission.guildId, title, description, projectUrl, thumbnailUrl, techArray]
            );

            // Generate showcase card
            const cardBuffer = await createShowcaseCard({
                title,
                description,
                technologies: techArray,
                author: submission.user,
                thumbnailUrl
            });

            const projectEmbed = createProjectEmbed(title, description, projectUrl, submission.user, techArray, thumbnailUrl, submission.guild);
            const message = await submission.reply({ embeds: [projectEmbed], files: [{ attachment: cardBuffer, name: 'showcase.png' }], fetchReply: true });
            await message.react('👍');
        } catch (error) {
            console.error('Error adding project showcase:', error);
            await submission.reply({ content: 'There was an error adding your project showcase.', ephemeral: true });
        }
    } catch (error) {
        if (error.code === 'InteractionCollectorError') {
            console.log('Modal timed out');
            return;
        }
        console.error('Error processing modal submission:', error);
    }
}

async function handleViewShowcase(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user');
    let query = 'SELECT * FROM project_showcases WHERE guild_id = $1';
    const queryParams = [interaction.guildId];

    if (targetUser) {
        query += ' AND user_id = $2';
        queryParams.push(targetUser.id);
    }

    query += ' ORDER BY id DESC LIMIT 10';

    try {
        const result = await db.query(query, queryParams);

        if (result.rows.length === 0) {
            const content = targetUser
                ? `No projects found for ${targetUser.username}`
                : 'No projects have been showcased yet!';
            return await interaction.editReply({ content, ephemeral: true });
        }

        const projects = await Promise.all(result.rows.map(async (project) => {
            const user = await interaction.client.users.fetch(project.user_id);
            const cardBuffer = await createShowcaseCard({
                title: project.title,
                description: project.description,
                technologies: project.technologies,
                author: user,
                thumbnailUrl: project.thumbnail_url
            });

            return {
                embed: createProjectEmbed(
                    project.title,
                    project.description,
                    project.project_url,
                    user,
                    project.technologies,
                    project.thumbnail_url,
                    interaction.guild
                ),
                file: { attachment: cardBuffer, name: `showcase-${project.id}.png` }
            };
        }));

        await interaction.editReply({
            embeds: projects.map(p => p.embed),
            files: projects.map(p => p.file)
        });
    } catch (error) {
        console.error('Error fetching project showcases:', error);
        await interaction.editReply({
            content: 'There was an error fetching the project showcases.',
            ephemeral: true
        });
    }
}

function createProjectEmbed(title, description, projectUrl, user, technologies, thumbnailUrl, guild) {
    const projectEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🚀 ${title}`)
        .setDescription(`${description}\n\n**Project Details**`)
        .addFields([
            { 
                name: '🔗 Project Link', 
                value: `[View Project](${projectUrl})`, 
                inline: true 
            },
            { 
                name: '👤 Created By', 
                value: `${user}`, 
                inline: true 
            },
            { 
                name: '❤️ Likes', 
                value: '0', 
                inline: true 
            }
        ])
        .setTimestamp()
        .setFooter({ 
            text: 'React with 👍 to show support!', 
            iconURL: guild.iconURL() 
        });

    if (technologies && technologies.length > 0) {
        projectEmbed.addFields([
            { 
                name: '🛠️ Technologies', 
                value: technologies.map(tech => `\`${tech}\``).join(' • '),
                inline: false
            }
        ]);
    }

    if (thumbnailUrl) {
        projectEmbed.setThumbnail(thumbnailUrl);
    }

    return projectEmbed;
}