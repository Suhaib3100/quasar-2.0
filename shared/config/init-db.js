require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Creating database tables...');
        await pool.query(schema);
        console.log('✅ Database tables created successfully!');

        await pool.end();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();