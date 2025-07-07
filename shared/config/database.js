const { Pool } = require('pg');

const getDefaultPool = (config) => {
    return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ...config
    });
};

const pool = getDefaultPool();

module.exports = {
    pool,
    getDefaultPool
};