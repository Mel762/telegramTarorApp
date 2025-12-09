const { Pool } = require('pg');

// Use DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
  // Test connection
  const client = await pool.connect();
  try {
    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id TEXT UNIQUE,
        username TEXT,
        language_code TEXT,
        free_readings_one INTEGER DEFAULT 3,
        free_readings_three INTEGER DEFAULT 1,
        last_daily_reading_date TIMESTAMPTZ,
        notifications_enabled INTEGER DEFAULT 0,
        receive_daily_reading INTEGER DEFAULT 0,
        notification_time TEXT DEFAULT '09:00',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Readings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        spread_type TEXT,
        cards TEXT,
        question TEXT,
        interpretation TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Notification History Table (Audit Log)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message_type TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return pool;
  } finally {
    client.release();
  }
}

module.exports = { initDb, pool };
