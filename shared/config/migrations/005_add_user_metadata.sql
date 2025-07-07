-- Create user_metadata table for caching usernames
CREATE TABLE IF NOT EXISTS user_metadata (
    user_id BIGINT NOT NULL,
    guild_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id)
); 