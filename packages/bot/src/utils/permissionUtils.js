const SPECIAL_USER_ID = '1231059682429501515';

function hasPermission(userId, requiredPermissions, member) {
    // If it's the special user, always return true
    if (userId === SPECIAL_USER_ID) {
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
    SPECIAL_USER_ID
}; 