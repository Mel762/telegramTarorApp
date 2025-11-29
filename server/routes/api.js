const express = require('express');
const router = express.Router();
const { generateReading, continueChat } = require('../services/gemini');
const { initDb } = require('../database/db');

const fs = require('fs');

function log(msg) {
    fs.appendFileSync('debug.log', msg + '\n');
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

// Middleware to check user subscription limits - REMOVED for Pay-per-Reading
// We now rely on frontend payment flow or direct payment checks if needed.
// For now, we assume if they hit /reading, they have paid or it's free.
// Ideally, we should verify payment here, but let's keep it simple as per plan.

router.post('/reading', async (req, res) => {
    try {
        log(`DEBUG: Reading Handler Start. req.user: ${JSON.stringify(req.user)}`);
        const { userId, username, name, lang, question, spreadType, cards } = req.body;

        console.log(`Reading request from User ${userId} (${name || 'Anon'}): ${question} [${lang || 'en'}]`);

        if (!cards || cards.length === 0) {
            return res.status(400).json({ error: 'No cards provided' });
        }

        const db = await initDb();
        // Get internal user ID first
        const user = await db.get('SELECT id FROM users WHERE telegram_id = ?', [userId]);

        if (user && spreadType === 'day') {
            // Check for any reading of type 'day' created today (UTC)
            const existing = await db.get(`
                SELECT id, created_at FROM readings 
                WHERE user_id = ? 
                AND spread_type = 'day' 
                AND date(created_at) = date('now')
            `, [user.id]);

            console.log(`Daily Limit Check: User ${user.id}, Found: ${existing ? existing.id : 'None'}, Date: ${existing ? existing.created_at : 'N/A'}`);

            if (existing) {
                return res.status(200).json({
                    error: getMsg('limit_day', lang || 'en'),
                    limitReached: true
                });
            }
        }

        const reading = await generateReading(cards, question, spreadType, { name, lang });

        // Save to DB
        try {
            const db = await initDb();
            // Get internal user ID first
            const user = await db.get('SELECT id FROM users WHERE telegram_id = ?', [userId]);

            if (user) {
                await db.run(`
                    INSERT INTO readings (user_id, spread_type, cards, question, interpretation)
                    VALUES (?, ?, ?, ?, ?)
                `, [user.id, spreadType, JSON.stringify(cards), question, reading]);
            }
        } catch (dbError) {
            console.error('DB Save Error:', dbError);
            log(`DB Save Error: ${dbError}`);
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
        'one': 1,   // 1 Star
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

// Get or Create User
router.get('/user/:id', async (req, res) => {
    const telegramId = req.params.id;
    const { username, first_name, language_code } = req.query;

    try {
        const db = await initDb();
        let user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);

        if (!user) {
            // Create new user
            await db.run(`
                INSERT INTO users (telegram_id, username, first_name, language_code)
                VALUES (?, ?, ?, ?)
            `, [telegramId, username, first_name, language_code]);
            user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
        } else {
            // Update info if changed
            if (username !== user.username || first_name !== user.first_name) {
                await db.run(`
                    UPDATE users SET username = ?, first_name = ? WHERE telegram_id = ?
                `, [username, first_name, telegramId]);
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
        const db = await initDb();
        // userId here is the internal ID from profileData, or we should use telegram_id if passed
        // Profile.jsx passes profileData.id which is internal ID.

        await db.run(`
            UPDATE users 
            SET notifications_enabled = ?, notification_time = ?, receive_daily_reading = ?
            WHERE id = ?
        `, [notificationsEnabled, notificationTime, receiveDailyReading, userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
