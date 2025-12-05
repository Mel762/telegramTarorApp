const cron = require('node-cron'); // If installed, otherwise use setInterval
const { pool } = require('./database/db');
const bot = require('./bot');

// Simple in-memory lock to prevent double sending if interval is fast
// But since we check exact minute, it should be fine as long as it runs once per minute.
// We'll use setInterval for simplicity as node-cron might not be installed.

function startScheduler() {
    console.log('Scheduler started: Checking for notifications every 60s...');

    setInterval(async () => {
        try {
            const now = new Date();
            // Format HH:MM (24h)
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${hours}:${minutes}`;

            console.log(`Scheduler Tick: ${currentTime}`);

            // Find users who want notifications NOW
            const res = await pool.query(`
                SELECT id, telegram_id, first_name, language_code, last_daily_reading_date 
                FROM users 
                WHERE notifications_enabled = 1 OR notifications_enabled = true 
                AND notification_time = $1
            `, [currentTime]);

            const users = res.rows;

            if (users.length > 0) {
                console.log(`Found ${users.length} users for notification at ${currentTime}`);
            }

            for (const user of users) {
                // Check if they already did a reading TODAY
                const today = new Date().toISOString().split('T')[0];
                const lastDate = user.last_daily_reading_date ? new Date(user.last_daily_reading_date).toISOString().split('T')[0] : null;

                if (lastDate !== today) {
                    // Send Notification
                    await sendNotification(user);
                } else {
                    console.log(`User ${user.telegram_id} already did reading today. Skipping.`);
                }
            }

        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    }, 60000); // Run every 60 seconds
}

async function sendNotification(user) {
    const lang = user.language_code || 'en';
    const messages = {
        en: `🔮 Hey ${user.first_name || 'Traveler'}! Your Card of the Day is waiting for you.\n\nDiscover what the stars have in store! ✨`,
        ru: `🔮 Привет, ${user.first_name || 'Путник'}! Твоя Карта Дня ждет тебя.\n\nУзнай, что приготовили звезды! ✨`,
        uk: `🔮 Привіт, ${user.first_name || 'Мандрівник'}! Твоя Карта Дня чекає на тебе.\n\nДізнайся, що підготували зірки! ✨`
    };

    const text = messages[lang] || messages['en'];
    const webAppUrl = process.env.WEBAPP_URL;

    try {
        await bot.telegram.sendMessage(user.telegram_id, text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🃏 Open Tarot App", web_app: { url: webAppUrl } }]
                ]
            }
        });
        console.log(`Notification sent to ${user.telegram_id}`);
    } catch (error) {
        console.error(`Failed to send notification to ${user.telegram_id}:`, error);
    }
}

module.exports = { startScheduler };
