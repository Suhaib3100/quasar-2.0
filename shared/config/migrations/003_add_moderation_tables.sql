-- Create mod_actions table for tracking all moderation actions
CREATE TABLE IF NOT EXISTS mod_actions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'timeout', 'kick', 'ban')),
    user_id VARCHAR(255) NOT NULL,
    moderator_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    reason TEXT,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id, guild_id) REFERENCES users(user_id, guild_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mod_actions_user ON mod_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_type ON mod_actions(type);
CREATE INDEX IF NOT EXISTS idx_mod_actions_active ON mod_actions(is_active);

-- Create view for active punishments
CREATE OR REPLACE VIEW active_punishments AS
SELECT *
FROM mod_actions
WHERE is_active = true
AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- Add trigger to automatically deactivate expired punishments
CREATE OR REPLACE FUNCTION update_punishment_status()
RETURNS trigger AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= CURRENT_TIMESTAMP THEN
        NEW.is_active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_punishment_expiry
    BEFORE INSERT OR UPDATE ON mod_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_punishment_status();