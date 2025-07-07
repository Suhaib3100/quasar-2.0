const { getDefaultPool } = require('discord-moderation-shared');
const db = getDefaultPool();

class RoleManager {

    static async updateUserRole(member, newLevel) {
        try {
            // Get all roles for this guild ordered by tier
            const roles = await db.query(
                'SELECT * FROM role_rewards WHERE guild_id = $1 ORDER BY required_level DESC',
                [member.guild.id]
            );

            // Find the highest role the user qualifies for
            const qualifiedRole = roles.rows.find(role => newLevel >= role.required_level);

            if (qualifiedRole) {
                // Remove all level roles
                const levelRoleIds = roles.rows.map(r => r.role_id);
                await member.roles.remove(levelRoleIds);

                // Add new role
                await member.roles.add(qualifiedRole.role_id);

                return qualifiedRole.level_name;
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
        return null;
    }
}

module.exports = RoleManager;