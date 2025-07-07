require('dotenv').config({ path: '../../packages/bot/.env' });
const { pool } = require('./database');

async function updateDatabase() {
    try {
        // Add new columns to guild_config table
        await pool.query(`
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
        `);

        console.log('✅ Database updated successfully!');
        await pool.end();
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

updateDatabase(); 