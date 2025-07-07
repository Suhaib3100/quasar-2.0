-- Users table to store user information and levels
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0 CHECK (level >= 0),
    message_count INTEGER DEFAULT 0,
    last_message_timestamp TIMESTAMP,
    voice_join_timestamp TIMESTAMP,
    is_in_voice BOOLEAN DEFAULT FALSE,
    primary_skill VARCHAR(50),
    github_username VARCHAR(255),
    portfolio_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, guild_id)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'github_username') THEN
        ALTER TABLE users ADD COLUMN github_username VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_skill') THEN
        ALTER TABLE users ADD COLUMN primary_skill VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'portfolio_url') THEN
        ALTER TABLE users ADD COLUMN portfolio_url TEXT;
    END IF;
END $$;

-- Achievements table to track user achievements
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, guild_id, achievement_id)
);

-- Role rewards table with predefined levels
DROP TABLE IF EXISTS role_rewards CASCADE;
CREATE TABLE IF NOT EXISTS role_rewards (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    role_id VARCHAR(255) NOT NULL,
    level_name VARCHAR(50) NOT NULL,
    required_level INTEGER NOT NULL CHECK (required_level >= 0 AND required_level <= 20),
    role_color VARCHAR(7),
    role_permissions BIGINT,
    tier_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id, role_id),
    UNIQUE(guild_id, tier_order)
);

-- Default role tiers
INSERT INTO role_rewards (guild_id, role_id, level_name, required_level, role_color, tier_order)
VALUES
    ('DEFAULT', 'TEMPLATE', 'Novice Developer', 1, '#4A90E2', 1),
    ('DEFAULT', 'TEMPLATE', 'Junior Engineer', 4, '#50E3C2', 2),
    ('DEFAULT', 'TEMPLATE', 'Associate Developer', 7, '#B8E986', 3),
    ('DEFAULT', 'TEMPLATE', 'Senior Developer', 10, '#F5A623', 4),
    ('DEFAULT', 'TEMPLATE', 'Lead Engineer', 13, '#E74C3C', 5),
    ('DEFAULT', 'TEMPLATE', 'Technical Architect', 16, '#9B59B6', 6),
    ('DEFAULT', 'TEMPLATE', 'Principal Engineer', 19, '#8E44AD', 7)
ON CONFLICT DO NOTHING;

-- Project showcase table
CREATE TABLE IF NOT EXISTS project_showcases (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    project_url TEXT,
    thumbnail_url TEXT,
    technologies TEXT[],
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Add showcase_image_url column if it doesn't exist

-- Moderation actions table
CREATE TABLE IF NOT EXISTS mod_actions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    moderator_id VARCHAR(255) NOT NULL,
    reason TEXT,
    duration INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guild_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User leaves tracking table
CREATE TABLE IF NOT EXISTS user_leaves (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    left_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mod_actions_user_id ON mod_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_type ON mod_actions(type);
CREATE INDEX IF NOT EXISTS idx_user_leaves_user_id ON user_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_leaves_guild_id ON user_leaves(guild_id);
CREATE INDEX IF NOT EXISTS idx_user_leaves_left_at ON user_leaves(left_at);
CREATE INDEX IF NOT EXISTS idx_mod_actions_guild_id ON mod_actions(guild_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_expires_at ON mod_actions(expires_at);

-- Add showcase_image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_showcases' AND column_name = 'showcase_image_url') THEN
        ALTER TABLE project_showcases ADD COLUMN showcase_image_url TEXT;
    END IF;
END $$;

-- Suggestions table to store user suggestions
CREATE TABLE IF NOT EXISTS suggestions (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Suggestion votes table to track individual user votes
CREATE TABLE IF NOT EXISTS suggestion_votes (
    id SERIAL PRIMARY KEY,
    suggestion_id INTEGER REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(suggestion_id, user_id),
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Guild settings table for suggestion channel configuration
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id VARCHAR(255) PRIMARY KEY,
    suggestions_channel_id VARCHAR(255),
    welcome_channel_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table for onboarding information
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    github_username VARCHAR(39),
    interests TEXT,
    experience_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, guild_id)
);

-- Project likes table to track user interactions
CREATE TABLE IF NOT EXISTS project_likes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES project_showcases(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id, guild_id),
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Skill badges table
CREATE TABLE IF NOT EXISTS skill_badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User skill badges junction table
CREATE TABLE IF NOT EXISTS user_skill_badges (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    badge_id INTEGER REFERENCES skill_badges(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, guild_id, badge_id)
);

-- Guild configuration table
CREATE TABLE IF NOT EXISTS guild_config (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL UNIQUE,
    welcome_channel_id VARCHAR(255),
    rules_channel_id VARCHAR(255),
    intro_channel_id VARCHAR(255),
    roles_channel_id VARCHAR(255),
    showcase_channel_id VARCHAR(255),
    general_channel_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guild_config' AND column_name = 'rules_channel_id') THEN
        ALTER TABLE guild_config ADD COLUMN rules_channel_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guild_config' AND column_name = 'intro_channel_id') THEN
        ALTER TABLE guild_config ADD COLUMN intro_channel_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guild_config' AND column_name = 'roles_channel_id') THEN
        ALTER TABLE guild_config ADD COLUMN roles_channel_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guild_config' AND column_name = 'showcase_channel_id') THEN
        ALTER TABLE guild_config ADD COLUMN showcase_channel_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guild_config' AND column_name = 'general_channel_id') THEN
        ALTER TABLE guild_config ADD COLUMN general_channel_id VARCHAR(255);
    END IF;
END $$;

-- Warning settings table
CREATE TABLE IF NOT EXISTS warning_settings (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL UNIQUE,
    max_warnings INTEGER DEFAULT 3,
    auto_timeout BOOLEAN DEFAULT true,
    timeout_duration INTEGER DEFAULT 60,
    auto_kick BOOLEAN DEFAULT false,
    auto_ban BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warning_settings_guild_id ON warning_settings(guild_id);