const { pool } = require('./database/db');

async function migrate() {
    try {
        console.log('Adding timezone column to users table...');
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
    `);
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
}

migrate();
