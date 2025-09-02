const SPECIAL_USER_IDS = ['1231059682429501515', '1340007489084592248', '800265791043534848'];

function hasPermission(userId, requiredPermissions, member) {
    // Convert userId to string to ensure proper comparison
    const userIdStr = String(userId);
    
    console.log(`🔍 Permission Check for User: ${userIdStr}`);
    console.log(`   Special Users: ${JSON.stringify(SPECIAL_USER_IDS)}`);
    console.log(`   Is Special User: ${SPECIAL_USER_IDS.includes(userIdStr)}`);
    
    // If it's one of the special users, always return true (bypass all permission checks)
    if (SPECIAL_USER_IDS.includes(userIdStr)) {
        console.log(`✅ Special user ${userIdStr} - granting access`);
        return true;
    }

    // If no specific permissions required, return true
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    // Check if the member has the required permissions
    return member.permissions.has(requiredPermissions);
}

module.exports = {
    hasPermission,
    SPECIAL_USER_IDS
}; 