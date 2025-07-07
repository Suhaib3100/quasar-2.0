-- Add new channel columns to guild_config table
ALTER TABLE guild_config
ADD COLUMN IF NOT EXISTS rules_channel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS intro_channel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS roles_channel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS showcase_channel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS general_channel_id VARCHAR(255);

-- Add comment explaining the columns
COMMENT ON COLUMN guild_config.rules_channel_id IS 'Discord channel ID for server rules';
COMMENT ON COLUMN guild_config.intro_channel_id IS 'Discord channel ID for member introductions';
COMMENT ON COLUMN guild_config.roles_channel_id IS 'Discord channel ID for role selection';
COMMENT ON COLUMN guild_config.showcase_channel_id IS 'Discord channel ID for project showcases';
COMMENT ON COLUMN guild_config.general_channel_id IS 'Discord channel ID for general discussions'; 