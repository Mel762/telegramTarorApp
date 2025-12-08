const { pool } = require('../database/db');
const bot = require('../bot');

// Messages for different languages
const MESSAGES = {
    en: [
        "@{username} your daily reading is waiting for you! ✨",
        "@{username} the cards have something to tell you today... 🔮",
        "@{username} don't forget to check your daily guidance! 🌙"
    ],
    ru: [
        "@{username} расклад на день ждет тебя! ✨",
        "@{username} карты хотят что-то сказать тебе сегодня... 🔮",
        "@{username} не забудь проверить свой совет на день! 🌙"
    ],
    uk: [
        "@{username} розклад на день чекає на тебе! ✨",
        "@{username} карти хочуть щось сказати тобі сьогодні... 🔮",
        "@{username} не забудь перевірити свою пораду на день! 🌙"
    ]
};

function getRandomMessage(username, lang) {
    const messages = MESSAGES[lang] || MESSAGES['en'];
    const template = messages[Math.floor(Math.random() * messages.length)];
    return template.replace('{username}', username || 'User');
}

async function checkNotifications() {
    try {
        const now = new Date();
        const currentUtcTime = now.toISOString().substr(11, 5); // HH:mm in UTC

        console.log(`[Scheduler] Checking notifications for UTC time: ${currentUtcTime}`);

        // Find users who:
        // 1. Have notifications enabled
        // 2. Have notification_time matching current UTC time
        // 3. Have NOT done a daily reading today (last_daily_reading_date != today)
        // Note: We check last_daily_reading_date against CURRENT DATE (UTC). 
        // Ideally we should check against user's local date, but we are simplifying to UTC date for now as per plan.

        const todayUtc = now.toISOString().split('T')[0];

        const query = `
            SELECT id, telegram_id, username, language_code, last_daily_reading_date 
            FROM users 
            WHERE notifications_enabled = 1 
            AND notification_time = $1
        `;

        const result = await pool.query(query, [currentUtcTime]);
        const users = result.rows;

        if (users.length > 0) {
            console.log(`[Scheduler] Found ${users.length} users to notify.`);
        }

        for (const user of users) {
            // Check if they already did a reading today (UTC)
            let lastDate = null;
            if (user.last_daily_reading_date) {
                lastDate = new Date(user.last_daily_reading_date).toISOString().split('T')[0];
            }

            if (lastDate !== todayUtc) {
                const lang = user.language_code || 'en';
                const message = getRandomMessage(user.username, lang);

                try {
                    await bot.telegram.sendMessage(user.telegram_id, message);
                    console.log(`[Scheduler] Sent notification to User ${user.id} (${user.username})`);
                } catch (sendError) {
                    console.error(`[Scheduler] Failed to send to User ${user.id}:`, sendError.message);
                }
            } else {
                console.log(`[Scheduler] User ${user.id} already did reading today (UTC). Skipping.`);
            }
        }

    } catch (error) {
        console.error('[Scheduler] Error checking notifications:', error);
    }
}

function startScheduler() {
    // Run every minute
    setInterval(checkNotifications, 60 * 1000);
    console.log('[Scheduler] Notification scheduler started.');
}

module.exports = { startScheduler };
