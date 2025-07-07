const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const { SPECIAL_USER_ID } = require('../utils/permissionUtils');
const db = getDefaultPool();
const CanvasUtils = require('../utils/canvasUtils');
const RoleManager = require('../utils/roleManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlevel')
        .setDescription('Set a user\'s level (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to set the level for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level to set')
                .setMinValue(0)
                .setRequired(true)),

    async execute(interaction) {
        // Check permissions first
        if (interaction.user.id !== SPECIAL_USER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Defer the reply immediately to prevent interaction timeout
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user');
            const newLevel = interaction.options.getInteger('level');

            const result = await db.query(
                'SELECT * FROM users WHERE user_id = $1 AND guild_id = $2',
                [targetUser.id, interaction.guild.id]
            );

            if (result.rows.length === 0) {
                await db.query(
                    'INSERT INTO users (user_id, guild_id, level, xp) VALUES ($1, $2, $3, $4)',
                    [targetUser.id, interaction.guild.id, newLevel, 0]
                );
            } else {
                await db.query(
                    'UPDATE users SET level = $1, xp = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND guild_id = $4',
                    [newLevel, 0, targetUser.id, interaction.guild.id]
                );
            }

            // Generate level-up image
            const levelUpImage = await CanvasUtils.createLevelUpImage(targetUser, newLevel);
            const attachment = new AttachmentBuilder(levelUpImage, { name: 'levelup.png' });

            // Update user's role based on new level
            const member = await interaction.guild.members.fetch(targetUser.id);
            await RoleManager.updateUserRole(member, newLevel);

            // Use editReply instead of reply since we deferred the reply
            await interaction.editReply({
                content: `Successfully set ${targetUser.username}'s level to ${newLevel}!`,
                files: [attachment]
            });
        } catch (error) {
            console.error('Error in setlevel command:', error);
            // Use editReply for error message as well
            await interaction.editReply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            }).catch(console.error);
        }
    }
};