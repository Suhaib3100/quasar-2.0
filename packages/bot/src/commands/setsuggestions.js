const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setsuggestions')
        .setDescription('Set up or manage the suggestions channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setchannel')
                .setDescription('Set the channel for suggestions')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to use for suggestions')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setchannel') {
            const channel = interaction.options.getChannel('channel');
            
            try {
                // Save the suggestions channel ID to the database
                await db.query(
                    'INSERT INTO guild_settings (guild_id, suggestions_channel_id) VALUES ($1, $2) ' +
                    'ON CONFLICT (guild_id) DO UPDATE SET suggestions_channel_id = $2',
                    [interaction.guild.id, channel.id]
                );

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Suggestions Channel Set')
                    .setDescription(`The suggestions channel has been set to ${channel}\n\nMembers can now send their suggestions in this channel. Each suggestion will be formatted automatically and include voting options.`)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

                // Send setup message to the suggestions channel
                const setupEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📝 Server Suggestions')
                    .setDescription('This channel is now set up for server suggestions!\n\n' +
                        'To make a suggestion:\n' +
                        '1. Simply send your message in this channel\n' +
                        '2. Your suggestion will be automatically formatted\n' +
                        '3. Members can vote using reactions\n' +
                        '4. Discussions will take place in threads\n\n' +
                        '*Keep suggestions constructive and respectful!*')
                    .setTimestamp();

                await channel.send({ embeds: [setupEmbed] });

            } catch (error) {
                console.error('Error setting suggestions channel:', error);
                await interaction.reply({
                    content: 'There was an error setting up the suggestions channel. Please try again later.',
                    ephemeral: true
                });
            }
        }
    },
};