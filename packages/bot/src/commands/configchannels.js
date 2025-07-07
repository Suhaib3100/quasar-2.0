const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const pool = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configchannels')
        .setDescription('Configure channels for welcome messages and other features')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('rules')
                .setDescription('Channel for server rules')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('introductions')
                .setDescription('Channel for member introductions')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('roles')
                .setDescription('Channel for role selection')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('showcase')
                .setDescription('Channel for project showcases')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('general')
                .setDescription('Channel for general discussions')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const rulesChannel = interaction.options.getChannel('rules');
            const introChannel = interaction.options.getChannel('introductions');
            const rolesChannel = interaction.options.getChannel('roles');
            const showcaseChannel = interaction.options.getChannel('showcase');
            const generalChannel = interaction.options.getChannel('general');

            // Update the database
            await pool.query(`
                UPDATE guild_config 
                SET 
                    rules_channel_id = COALESCE($1, rules_channel_id),
                    intro_channel_id = COALESCE($2, intro_channel_id),
                    roles_channel_id = COALESCE($3, roles_channel_id),
                    showcase_channel_id = COALESCE($4, showcase_channel_id),
                    general_channel_id = COALESCE($5, general_channel_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE guild_id = $6
            `, [
                rulesChannel?.id,
                introChannel?.id,
                rolesChannel?.id,
                showcaseChannel?.id,
                generalChannel?.id,
                interaction.guild.id
            ]);

            // Create response message
            const response = ['✅ Updated channel configuration:'];
            if (rulesChannel) response.push(`• Rules: ${rulesChannel}`);
            if (introChannel) response.push(`• Introductions: ${introChannel}`);
            if (rolesChannel) response.push(`• Roles: ${rolesChannel}`);
            if (showcaseChannel) response.push(`• Showcase: ${showcaseChannel}`);
            if (generalChannel) response.push(`• General: ${generalChannel}`);

            if (response.length === 1) {
                response.push('No channels were updated. Please specify at least one channel.');
            }

            await interaction.editReply(response.join('\n'));
        } catch (error) {
            console.error('Error in configchannels command:', error);
            await interaction.editReply('❌ Failed to update channel configuration. Please try again.');
        }
    },
}; 