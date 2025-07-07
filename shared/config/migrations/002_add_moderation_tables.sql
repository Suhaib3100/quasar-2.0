-- Add moderation-related tables

-- Table for tracking user leaves
CREATE TABLE IF NOT EXISTS user_leaves (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    left_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Table for tracking moderation actions
CREATE TABLE IF NOT EXISTS mod_actions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'mute', 'kick', 'ban')),
    user_id VARCHAR(255) NOT NULL,
    moderator_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    duration INTERVAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id),
    FOREIGN KEY (moderator_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mod_actions_user_id ON mod_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_moderator_id ON mod_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_type ON mod_actions(type);
CREATE INDEX IF NOT EXISTS idx_mod_actions_created_at ON mod_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_leaves_user_id ON user_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_leaves_left_at ON user_leaves(left_at);