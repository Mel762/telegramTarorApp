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
        const todayUtc = now.toISOString().split('T')[0];

        console.log(`[Scheduler] Check triggered at ${now.toISOString()} (UTC Time: ${currentUtcTime})`);

        // Criteria for sending a notification:
        // 1. Notifications ENABLED.
        // 2. Notification Time <= Current Time (Time has passed).
        // 3. Last Daily Reading Date != Today (Haven't played today).
        // 4. NOT in notification_history for today (Haven't been notified today).

        const query = `
            SELECT u.id, u.telegram_id, u.username, u.language_code, u.last_daily_reading_date, u.notification_time
            FROM users u
            WHERE u.notifications_enabled = 1 
            AND u.notification_time <= $1
            AND (u.last_daily_reading_date IS NULL OR date(u.last_daily_reading_date) != date($2))
            AND NOT EXISTS (
                SELECT 1 FROM notification_history h 
                WHERE h.user_id = u.id 
                AND date(h.created_at) = date($2)
            )
        `;

        const result = await pool.query(query, [currentUtcTime, todayUtc]);
        const users = result.rows;

        if (users.length > 0) {
            console.log(`[Scheduler] Found ${users.length} users needing notification.`);
        } else {
            console.log(`[Scheduler] No users need notification at this time.`);
        }

        for (const user of users) {
            const lang = user.language_code || 'en';
            const message = getRandomMessage(user.username, lang);

            try {
                await bot.telegram.sendMessage(user.telegram_id, message);
                console.log(`[Scheduler] Sent notification to User ${user.id} (${user.username})`);

                // Insert into history (Audit Log)
                await pool.query(`
                    INSERT INTO notification_history (user_id, message_type)
                    VALUES ($1, 'daily_reading')
                 `, [user.id]);

            } catch (sendError) {
                console.error(`[Scheduler] Failed to send to User ${user.id}:`, sendError.message);
                // Optional: IDK if we should mark as sent if failed? 
                // For now, let's NOT mark it, so it retries next time (in 10 mins).
            }
        }

    } catch (error) {
        console.error('[Scheduler] Error checking notifications:', error);
    }
}

module.exports = { checkNotifications };
