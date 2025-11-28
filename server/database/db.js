const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDb() {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE,
        username TEXT,
        first_name TEXT,
        language_code TEXT,
        subscription_tier TEXT DEFAULT 'free',
        notifications_enabled INTEGER DEFAULT 0,
        receive_daily_reading INTEGER DEFAULT 0,
        notification_time TEXT DEFAULT '09:00',
        daily_one_card_count INTEGER DEFAULT 0,
        daily_three_card_count INTEGER DEFAULT 0,
        last_reading_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        spread_type TEXT,
        cards TEXT,
        question TEXT,
        interpretation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

  // Simple migration check (add columns if missing - simplistic approach for dev)
  try {
    await db.exec("ALTER TABLE users ADD COLUMN language_code TEXT");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 0");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN receive_daily_reading INTEGER DEFAULT 0");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN notification_time TEXT DEFAULT '09:00'");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN daily_one_card_count INTEGER DEFAULT 0");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN daily_three_card_count INTEGER DEFAULT 0");
  } catch (e) { /* Column likely exists */ }
  try {
    await db.exec("ALTER TABLE users ADD COLUMN last_reading_date TEXT");
  } catch (e) { /* Column likely exists */ }

  return db;
}

module.exports = { initDb };
