require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');
const { Telegraf } = require('telegraf');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

async function testNotifications() {
    console.log('--- Manual Notification Test ---');
    try {
        // 1. Get users with notifications enabled
        const res = await pool.query('SELECT id, telegram_id, username, notification_time FROM users WHERE notifications_enabled = 1');
        console.log(`Found ${res.rows.length} users with notifications enabled.`);

        for (const user of res.rows) {
            console.log(`Testing User: ${user.username} (ID: ${user.telegram_id})`);
            console.log(`Saved Time (UTC): ${user.notification_time}`);

            try {
                await bot.telegram.sendMessage(user.telegram_id, "🔔 Test Notification: If you see this, the bot works!");
                console.log(`[SUCCESS] Test message sent to ${user.username}`);
            } catch (err) {
                console.error(`[FAILED] Could not send to ${user.username}:`, err.message);
            }
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        pool.end();
    }
}

testNotifications();
