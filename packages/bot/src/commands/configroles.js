const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configroles')
        .setDescription('Configure level roles (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role-level mapping')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to assign')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('The level required to earn this role')
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('tier')
                        .setDescription('The tier order of this role (lower numbers are assigned first)')
                        .setMinValue(1)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role-level mapping')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from level rewards')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all role-level mappings'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const role = interaction.options.getRole('role');
                const level = interaction.options.getInteger('level');
                const tier = interaction.options.getInteger('tier');

                // Check if role already exists in mappings
                const existingRole = await db.query(
                    'SELECT * FROM role_rewards WHERE guild_id = $1 AND role_id = $2',
                    [interaction.guild.id, role.id]
                );

                if (existingRole.rows.length > 0) {
                    return await interaction.reply({
                        content: 'This role is already configured as a level reward.',
                        ephemeral: true
                    });
                }

                // Add new role-level mapping
                await db.query(
                    'INSERT INTO role_rewards (guild_id, role_id, level_name, required_level, role_color, tier_order) VALUES ($1, $2, $3, $4, $5, $6)',
                    [interaction.guild.id, role.id, role.name, level, role.hexColor, tier]
                );

                await interaction.reply({
                    content: `Successfully configured ${role.name} to be awarded at level ${level} (Tier ${tier})`,
                    ephemeral: true
                });

            } else if (subcommand === 'remove') {
                const role = interaction.options.getRole('role');

                // Remove role-level mapping
                const result = await db.query(
                    'DELETE FROM role_rewards WHERE guild_id = $1 AND role_id = $2 RETURNING *',
                    [interaction.guild.id, role.id]
                );

                if (result.rows.length === 0) {
                    return await interaction.reply({
                        content: 'This role was not configured as a level reward.',
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content: `Successfully removed ${role.name} from level rewards.`,
                    ephemeral: true
                });

            } else if (subcommand === 'list') {
                const roles = await db.query(
                    'SELECT * FROM role_rewards WHERE guild_id = $1 ORDER BY required_level',
                    [interaction.guild.id]
                );

                if (roles.rows.length === 0) {
                    return await interaction.reply({
                        content: 'No role-level mappings configured for this server.',
                        ephemeral: true
                    });
                }

                const roleList = roles.rows.map(role => 
                    `${role.level_name}: Level ${role.required_level} (Tier ${role.tier_order})`
                ).join('\n');

                await interaction.reply({
                    content: `**Current Role-Level Mappings:**\n${roleList}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in configroles command:', error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
};