const { pool } = require('../database/db');
const bot = require('../bot');
const { tarotDeck } = require('../data/tarotData');
const { generateReading } = require('./gemini');

// Enhanced Messages Pool
const MESSAGES = {
    en: [
        "@{username}, your daily reading awaits! What wisdom do the cards hold today? ✨",
        "@{username}, the universe has a message for you. Check your card of the day! 🔮",
        "A quiet moment for yourself, @{username}. See what the cards reveal. 🌙",
        "@{username}, feeling unsure? Let the Tarot guide you today. 🌟",
        "Unlock today's potential, @{username}. Your daily card is ready. 🗝️",
        "@{username}, seek clarity and find your path with today's reading. 🕯️",
        "The cards are shuffling, @{username}. Fate is waiting... 🎴",
        "@{username}, take a breath and connect with your inner wisdom. The cards are here to help. 🧘",
        "Curious about today? @{username}, discover your daily guidance! 👁️",
        "@{username}, don't let the day pass without a little magic. Your reading is here! ✨"
    ],
    ru: [
        "@{username}, твой расклад на день ждет! Что карты подскажут сегодня? ✨",
        "@{username}, у вселенной есть сообщение для тебя. Проверь карту дня! 🔮",
        "Минутка для себя, @{username}. Посмотри, что откроют карты. 🌙",
        "@{username}, чувствуешь сомнения? Пусть Таро направит тебя сегодня. 🌟",
        "Раскрой потенциал дня, @{username}. Твоя карта готова. 🗝️",
        "@{username}, найди ясность и свой путь с сегодняшним раскладом. 🕯️",
        "Карты тасуются, @{username}. Судьба ждет... 🎴",
        "@{username}, выдохни и соединись с внутренней мудростью. Карты здесь, чтобы помочь. 🧘",
        "Интересно, что день грядущий готовит? @{username}, узнай свой совет! 👁️",
        "@{username}, не дай дню пройти без капли магии. Твой расклад здесь! ✨"
    ],
    uk: [
        "@{username}, твій розклад на день чекає! Що карти підкажуть сьогодні? ✨",
        "@{username}, у всесвіту є повідомлення для тебе. Перевір карту дня! 🔮",
        "Хвилинка для себе, @{username}. Поглянь, що відкриють карти. 🌙",
        "@{username}, відчуваєш сумніви? Нехай Таро скерує тебе сьогодні. 🌟",
        "Розкрий потенціал дня, @{username}. Твоя карта готова. 🗝️",
        "@{username}, знайди ясність і свій шлях із сьогоднішнім розкладом. 🕯️",
        "Карти тасуються, @{username}. Доля чекає... 🎴",
        "@{username}, видихни і поєднайся з внутрішньою мудрістю. Карти тут, щоб допомогти. 🧘",
        "Цікаво, що день прийдешній готує? @{username}, дізнайся свою пораду! 👁️",
        "@{username}, не дай дню пройти без краплі магії. Твій розклад тут! ✨"
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

        // console.log(`[Scheduler] Check triggered at ${now.toISOString()} (UTC Time: ${currentUtcTime})`);

        // Criteria for sending a notification:
        // 1. Notifications ENABLED.
        // 2. Notification Time <= Current Time (Time has passed).
        // 3. Last Daily Reading Date != Today (Haven't played today).
        // 4. NOT in notification_history for today (Haven't been notified today).

        const query = `
            SELECT u.id, u.telegram_id, u.username, u.language_code, u.last_daily_reading_date, u.notification_time, u.receive_daily_reading, u.first_name
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
        }

        for (const user of users) {
            const lang = user.language_code || 'en';

            try {
                if (user.receive_daily_reading) {
                    // --- AUTO SEND DAILY READING ---
                    console.log(`[Scheduler] Generating auto-reading for User ${user.id}`);

                    // 1. Select Random Card
                    const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
                    const cards = [randomCard];

                    // 2. Generate Interpretation
                    // We need to pass a name to generateReading
                    const interpretation = await generateReading(cards, "Daily Reading", "day", { name: user.first_name || user.username, lang });

                    // 3. Send to Telegram (Image + Caption)
                    // Construct local path or URL? accessible by bot? 
                    // Usually we need a public URL or send the file directly.
                    // Since it's a local file relative to server project root? 
                    // No, bot.telegram.sendPhoto can take a filepath or url.
                    // The paths in tarotDeck are like '/cards/fool.png'. We need to resolve to absolute path on disk.

                    // Assume 'public' or 'dist' folder logic.
                    // Actually, 'client/dist' is served statically.
                    // We can try to send by URL if we have a public domain, OR send by local file path.
                    // Let's assume we can map '/cards/...' to 'client/dist/cards/...'

                    // Fix path traversal:
                    const fs = require('fs');
                    const path = require('path');
                    // 'client/dist' is where images are served from in production build presumably, 
                    // OR 'client/public' in dev?
                    // Let's rely on how `server.js` serves static files: `path.join(__dirname, '../client/dist')`

                    const clientDistPath = path.join(__dirname, '../../client/dist');
                    // image path from tarotDeck starts with '/', remove it
                    const imageRelPath = randomCard.image.substring(1);
                    const imagePath = path.join(clientDistPath, imageRelPath);

                    // Check if file exists, fallback to just text if not?
                    if (fs.existsSync(imagePath)) {
                        await bot.telegram.sendPhoto(user.telegram_id, { source: imagePath }, {
                            caption: `🃏 *${randomCard.name}*\n\n${interpretation}`,
                            parse_mode: 'Markdown'
                        });
                    } else {
                        // Fallback: Text only (or maybe dev path)
                        console.warn(`[Scheduler] Image not found at ${imagePath}, sending text only.`);
                        await bot.telegram.sendMessage(user.telegram_id, `🃏 *${randomCard.name}*\n\n${interpretation}`, { parse_mode: 'Markdown' });
                    }

                    // 4. Save to DB (readings table)
                    await pool.query(`
                        INSERT INTO readings (user_id, spread_type, cards, question, interpretation)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [user.id, 'day', JSON.stringify(cards), 'Daily Reading (Auto)', interpretation]);

                    // 5. Update last_daily_reading_date
                    await pool.query(`UPDATE users SET last_daily_reading_date = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

                    console.log(`[Scheduler] Sent Auto-Reading to User ${user.id}`);
                    // Insert into history as 'auto_reading'
                    await pool.query(`
                        INSERT INTO notification_history (user_id, message_type)
                        VALUES ($1, 'auto_reading')
                     `, [user.id]);

                } else {
                    // --- SEND NOTIFICATION REMINDER ---
                    const message = getRandomMessage(user.username, lang);
                    await bot.telegram.sendMessage(user.telegram_id, message);
                    console.log(`[Scheduler] Sent notification to User ${user.id} (${user.username})`);

                    // Insert into history
                    await pool.query(`
                        INSERT INTO notification_history (user_id, message_type)
                        VALUES ($1, 'daily_reminder')
                    `, [user.id]);
                }

            } catch (sendError) {
                console.error(`[Scheduler] Failed to process User ${user.id}:`, sendError);
            }
        }

    } catch (error) {
        console.error('[Scheduler] Error checking notifications:', error);
    }
}

module.exports = { checkNotifications };
