const express = require('express');
const router = express.Router();
const { generateReading, continueChat } = require('../services/gemini');
const { pool } = require('../database/db');



function log(msg) {
    console.log(msg);
}

const MESSAGES = {
    limit_day: {
        en: 'Card of the Day is available once daily.',
        ru: 'Карта дня доступна один раз в день.',
        uk: 'Карта дня доступна один раз на день.'
    },
    limit_one: {
        en: 'Daily limit for 1-Card readings reached.',
        ru: 'Дневной лимит раскладов на 1 карту исчерпан.',
        uk: 'Денний ліміт розкладів на 1 карту вичерпано.'
    },
    limit_three: {
        en: 'Daily limit for 3-Card readings reached.',
        ru: 'Дневной лимит раскладов на 3 карты исчерпан.',
        uk: 'Денний ліміт розкладів на 3 карти вичерпано.'
    },
    upgrade: {
        en: ' Upgrade for more.',
        ru: ' Обновите тариф.',
        uk: ' Оновіть тариф.'
    },
    basic_required: {
        en: '3-Card Spread is available on Basic plan.',
        ru: 'Расклад на 3 карты доступен в тарифе Basic.',
        uk: 'Розклад на 3 карти доступний у тарифі Basic.'
    }
};

function getMsg(key, lang) {
    return (MESSAGES[key] && MESSAGES[key][lang]) || MESSAGES[key]['en'];
}

router.post('/reading', async (req, res) => {
    try {
        log(`DEBUG: Reading Handler Start. req.user: ${JSON.stringify(req.user)}`);
        const { userId, username, name, lang, question, spreadType, cards } = req.body;

        console.log(`Reading request from User ${userId} (${name || 'Anon'}): ${question} [${lang || 'en'}]`);

        if (!cards || cards.length === 0) {
            return res.status(400).json({ error: 'No cards provided' });
        }

        // Get internal user ID first
        const userResult = await pool.query('SELECT id, last_daily_reading_date FROM users WHERE telegram_id = $1', [userId]);
        const user = userResult.rows[0];

        if (user && spreadType === 'day') {
            // Check last_daily_reading_date
            const today = new Date().toISOString().split('T')[0];
            const lastDate = user.last_daily_reading_date ? new Date(user.last_daily_reading_date).toISOString().split('T')[0] : null;

            console.log(`Daily Limit Check: User ${user.id}, Last: ${lastDate}, Today: ${today}`);

            if (lastDate === today) {
                return res.status(200).json({
                    error: getMsg('limit_day', lang || 'en'),
                    limitReached: true
                });
            }
        }

        const reading = await generateReading(cards, question, spreadType, { name, lang });

        // Save to DB
        try {
            // Get internal user ID first (re-fetch to be safe, or reuse)
            const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [userId]);
            const user = userResult.rows[0];

            if (user) {
                await pool.query(`
                    INSERT INTO readings (user_id, spread_type, cards, question, interpretation)
                    VALUES ($1, $2, $3, $4, $5)
                `, [user.id, spreadType, JSON.stringify(cards), question, reading]);
            }
        } catch (dbError) {
            console.error('DB Save Error:', dbError);
            log(`DB Save Error: ${dbError}`);
        }

        // Update last_daily_reading_date if it was a daily reading
        if (spreadType === 'day' && user) {
            try {
                await pool.query(`UPDATE users SET last_daily_reading_date = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);
            } catch (updateError) {
                console.error('Error updating last_daily_reading_date:', updateError);
            }
        }

        // Decrement Free Credits if applicable
        try {
            const userResult = await pool.query('SELECT id, free_readings_one, free_readings_three FROM users WHERE telegram_id = $1', [userId]);
            const user = userResult.rows[0];

            if (user) {
                if (spreadType === 'one' && user.free_readings_one > 0) {
                    await pool.query('UPDATE users SET free_readings_one = free_readings_one - 1 WHERE id = $1', [user.id]);
                    console.log(`User ${user.id} used 1 free reading (one). Remaining: ${user.free_readings_one - 1}`);
                } else if (spreadType === 'three' && user.free_readings_three > 0) {
                    await pool.query('UPDATE users SET free_readings_three = free_readings_three - 1 WHERE id = $1', [user.id]);
                    console.log(`User ${user.id} used 1 free reading (three). Remaining: ${user.free_readings_three - 1}`);
                }
            }
        } catch (creditError) {
            console.error('Credit Decrement Error:', creditError);
        }

        res.json({ reading });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to generate reading' });
    }
});

router.post('/create-stars-invoice', async (req, res) => {
    const { userId, spreadType } = req.body;

    if (!userId || !spreadType) {
        return res.status(400).json({ error: 'Missing userId or spreadType' });
    }

    // Pricing (Stars)
    const prices = {
        'one': 20,   // 20 Stars
        'three': 50 // 50 Stars
    };

    const price = prices[spreadType];
    if (!price) {
        return res.status(400).json({ error: 'Invalid spread type' });
    }

    try {
        const title = `Tarot Reading (${spreadType === 'one' ? '1-Card' : '3-Card'})`;
        const description = `Unlock a ${spreadType}-card reading.`;
        const payload = JSON.stringify({ spreadType, userId });
        const currency = 'XTR'; // Telegram Stars

        const bot = require('../bot');

        const invoiceLink = await bot.telegram.createInvoiceLink({
            title,
            description,
            payload,
            provider_token: "", // Empty string for Telegram Stars (XTR)
            currency,
            prices: [{ label: title, amount: price }]
        });

        res.json({ invoiceLink });
    } catch (error) {
        console.error('Create Invoice Error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { userId, history, newMessage, context } = req.body;
        console.log(`Chat request from User ${userId}: ${newMessage}`);

        const response = await continueChat(history, newMessage, context);
        res.json({ response });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Get or Create User
router.get('/user/:id', async (req, res) => {
    const telegramId = req.params.id;
    const { username, first_name, language_code } = req.query;

    try {
        let userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
        let user = userResult.rows[0];

        if (!user) {
            // Create new user
            await pool.query(`
                INSERT INTO users (telegram_id, username, language_code, free_readings_one, free_readings_three)
                VALUES ($1, $2, $3, 3, 1)
            `, [telegramId, username, language_code]);
            userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
            user = userResult.rows[0];
        } else {
            // Update info if changed
            if (username !== user.username) {
                await pool.query(`
                    UPDATE users SET username = $1 WHERE telegram_id = $2
                `, [username, telegramId]);
            }
        }

        res.json(user);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update User Settings
router.post('/user/settings', async (req, res) => {
    const { userId, notificationsEnabled, notificationTime, receiveDailyReading } = req.body;

    try {
        console.log('Settings Update Request:', { userId, notificationsEnabled, notificationTime, receiveDailyReading });

        const result = await pool.query(`
            UPDATE users 
            SET notifications_enabled = $1, notification_time = $2, receive_daily_reading = $3
            WHERE id = $4
        `, [notificationsEnabled, notificationTime, receiveDailyReading, userId]);

        console.log('Update Result RowCount:', result.rowCount);

        res.json({ success: true });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
