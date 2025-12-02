const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function cleanup() {
    const db = await open({
        filename: path.join(__dirname, 'database/database.sqlite'),
        driver: sqlite3.Database
    });

    console.log("Starting Database Cleanup (Async)...");

    try {
        await db.run("PRAGMA foreign_keys=OFF");
        await db.run("BEGIN TRANSACTION");

        await db.run("DROP TABLE IF EXISTS users_new");

        console.log("Creating new table...");
        await db.run(`
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id TEXT UNIQUE,
                username TEXT,
                first_name TEXT,
                language_code TEXT,
                notifications_enabled INTEGER DEFAULT 0,
                receive_daily_reading INTEGER DEFAULT 0,
                notification_time TEXT DEFAULT '09:00',
                free_readings_one INTEGER DEFAULT 3,
                free_readings_three INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Copying data...");
        await db.run(`
            INSERT INTO users_new (id, telegram_id, username, first_name, language_code, notifications_enabled, receive_daily_reading, notification_time, free_readings_one, free_readings_three, created_at)
            SELECT id, telegram_id, username, first_name, language_code, notifications_enabled, receive_daily_reading, notification_time, free_readings_one, free_readings_three, created_at
            FROM users
        `);

        console.log("Swapping tables...");
        await db.run("DROP TABLE users");
        await db.run("ALTER TABLE users_new RENAME TO users");

        await db.run("COMMIT");
        console.log("Cleanup successful.");

        await db.run("PRAGMA foreign_keys=ON");
        console.log("Vacuuming...");
        await db.run("VACUUM");
        console.log("Done.");

    } catch (err) {
        console.error("Cleanup Failed:", err);
        await db.run("ROLLBACK");
    } finally {
        await db.close();
    }
}

cleanup();
