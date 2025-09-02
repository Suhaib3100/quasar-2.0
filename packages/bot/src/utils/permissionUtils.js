const SPECIAL_USER_IDS = ['1231059682429501515', '1340007489084592248'];

function hasPermission(userId, requiredPermissions, member) {
    console.log(`🔍 Permission Check Debug:`);
    console.log(`   User ID: ${userId} (type: ${typeof userId})`);
    console.log(`   Special User IDs: ${JSON.stringify(SPECIAL_USER_IDS)}`);
    console.log(`   Is Special User: ${SPECIAL_USER_IDS.includes(userId)}`);
    console.log(`   Required Permissions: ${JSON.stringify(requiredPermissions)}`);
    
    // Convert userId to string to ensure proper comparison
    const userIdStr = String(userId);
    const isSpecialUser = SPECIAL_USER_IDS.includes(userIdStr);
    console.log(`   User ID (string): ${userIdStr}`);
    console.log(`   Is Special User (string): ${isSpecialUser}`);
    
    // If it's one of the special users, always return true (bypass all permission checks)
    if (isSpecialUser) {
        console.log(`✅ Special user ${userIdStr} - granting access`);
        return true;
    }

    // If no specific permissions required, return true
    if (!requiredPermissions || requiredPermissions.length === 0) {
        console.log(`✅ No permissions required - granting access`);
        return true;
    }

    // Check if the member has the required permissions
    const hasPerms = member.permissions.has(requiredPermissions);
    console.log(`🔐 Member permissions check: ${hasPerms}`);
    return hasPerms;
}

module.exports = {
    hasPermission,
    SPECIAL_USER_IDS
}; 