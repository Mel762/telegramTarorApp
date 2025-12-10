require('dotenv').config();
const { Pool } = require('pg');
const { Telegraf } = require('telegraf');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const { checkNotifications } = require('./services/notificationScheduler');

async function testNotifications() {
    console.log('--- Manual Notification Scheduler Test ---');
    try {
        await checkNotifications();
        console.log('--- Test Completed ---');
    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        // Pool is managed inside scheduler/db module usually, but we might need to force exit
        // verify_app.js suggests we just let it run or force exit if needed.
        // The scheduler uses the pool from db.js suitable for long running process.
        // We will just exit after some time or let it finish.
        setTimeout(() => process.exit(0), 5000);
    }
}

testNotifications();
