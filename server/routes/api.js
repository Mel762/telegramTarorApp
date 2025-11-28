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

// Middleware to check user subscription limits
const checkLimits = async (req, res, next) => {
    const { userId, spreadType, lang } = req.body;
    const userLang = lang || 'en';

    log(`Limit Check Start: User ${userId}, Spread ${spreadType}, Lang ${userLang}`);

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const db = await initDb();
        // Query by telegram_id since frontend sends that as userId
        const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [userId]);

        log(`Limit Check: User ${userId} -> Found: ${!!user}, Tier: ${user?.subscription_tier}, LastDate: ${user?.last_reading_date}, DailyOne: ${user?.daily_one_card_count}`);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const tier = user.subscription_tier || 'free';
        const today = new Date().toISOString().split('T')[0];

        // Reset counters if new day
        if (user.last_reading_date !== today) {
            log(`Resetting counters for ${userId}. Old Date: ${user.last_reading_date}, New: ${today}`);
            await db.run(`
                UPDATE users 
                SET daily_one_card_count = 0, daily_three_card_count = 0, last_reading_date = ? 
                WHERE telegram_id = ?
            `, [today, userId]);
            user.daily_one_card_count = 0;
            user.daily_three_card_count = 0;
        } else {
            log(`No reset needed. Date matches: ${today}`);
        }

        // Limit Logic
        let allowed = false;
        let errorMsg = getMsg('limit_day', userLang);

        // Check for "Welcome" 3-card spread for Free tier
        let isWelcomeThreeCard = false;
        if (tier === 'free' && spreadType === 'three') {
            const totalThreeCard = await db.get('SELECT COUNT(*) as count FROM readings WHERE user_id = ? AND spread_type = ?', [user.id, 'three']);
            if (totalThreeCard.count === 0) {
                isWelcomeThreeCard = true;
            }
        }

        if (tier === 'max') {
            // Max: Unlimited everything
            allowed = true;
            if (spreadType === 'day') {
                const todayReadings = await db.get('SELECT COUNT(*) as count FROM readings WHERE user_id = ? AND spread_type = ? AND date(created_at) = ?', [user.id, 'day', today]);
                if (todayReadings.count < 1) allowed = true;
                else errorMsg = getMsg('limit_day', userLang);
            } else if (spreadType === 'one') {
                if (user.daily_one_card_count < 3) allowed = true;
                else errorMsg = getMsg('limit_one', userLang);
            } else if (spreadType === 'three') {
                if (user.daily_three_card_count < 3) allowed = true;
                else errorMsg = getMsg('limit_three', userLang);
            }
        } else if (tier === 'basic') {
            if (spreadType === 'day') {
                const todayReadings = await db.get('SELECT COUNT(*) as count FROM readings WHERE user_id = ? AND spread_type = ? AND date(created_at) = ?', [user.id, 'day', today]);
                if (todayReadings.count < 1) allowed = true;
                else errorMsg = getMsg('limit_day', userLang);
            } else if (spreadType === 'one') {
                if (user.daily_one_card_count < 2) allowed = true;
                else errorMsg = getMsg('limit_one', userLang) + getMsg('upgrade', userLang);
            } else if (spreadType === 'three') {
                if (user.daily_three_card_count < 1) allowed = true;
                else errorMsg = getMsg('limit_three', userLang) + getMsg('upgrade', userLang);
            }
        } else { // Free
            if (spreadType === 'day') {
                const todayReadings = await db.get('SELECT COUNT(*) as count FROM readings WHERE user_id = ? AND spread_type = ? AND date(created_at) = ?', [user.id, 'day', today]);
                console.log(`Limit Check (Free/Day): Count=${todayReadings.count}`);
                if (todayReadings.count < 1) allowed = true;
                else errorMsg = getMsg('limit_day', userLang);
            } else if (spreadType === 'one') {
                console.log(`Limit Check (Free/One): Count=${user.daily_one_card_count}`);
                if (user.daily_one_card_count < 1) allowed = true;
                else errorMsg = getMsg('limit_one', userLang) + getMsg('upgrade', userLang);
            } else if (spreadType === 'three') {
                if (isWelcomeThreeCard) allowed = true;
                else errorMsg = getMsg('basic_required', userLang);
            }
        }

        if (!allowed) {
            return res.status(200).json({ error: errorMsg, limitReached: true });
        }

        // Attach user to req for next steps
        req.user = user;
        next();
    } catch (error) {
        console.error('Limit Check Error:', error);
        res.status(500).json({ error: 'Failed to check limits' });
    }
};

router.post('/reading', checkLimits, async (req, res) => {
    try {
        log(`DEBUG: Reading Handler Start. req.user: ${JSON.stringify(req.user)}`);
        const { userId, username, name, lang, question, spreadType, cards } = req.body;

        console.log(`Reading request from User ${userId} (${name || 'Anon'}): ${question} [${lang || 'en'}]`);

        if (!cards || cards.length === 0) {
            return res.status(400).json({ error: 'No cards provided' });
        }

        const reading = await generateReading(cards, question, spreadType, { name, lang });

        // Save to DB and Increment Counters
        try {
            const db = await initDb();
            await db.run(`
                INSERT INTO readings (user_id, spread_type, cards, question, interpretation)
                VALUES (?, ?, ?, ?, ?)
            `, [req.user.id, spreadType, JSON.stringify(cards), question, reading]); // FIXED: Use req.user.id

            log(`DEBUG: Inserting reading for user: ${JSON.stringify(req.user)}`);
            log(`DEBUG: req.user.id type: ${typeof req.user.id}`);


            // Increment specific counter
            log(`DEBUG: Incrementing counter for UserID: ${req.user.id} (Spread: ${spreadType})`);
            if (spreadType === 'three') {
                const res = await db.run('UPDATE users SET daily_three_card_count = daily_three_card_count + 1 WHERE id = ?', [req.user.id]);
                log(`DEBUG: Increment Result (Three): ${JSON.stringify(res)}`);
            } else if (spreadType === 'one') {
                const res = await db.run('UPDATE users SET daily_one_card_count = daily_one_card_count + 1 WHERE id = ?', [req.user.id]);
                log(`DEBUG: Increment Result (One): ${JSON.stringify(res)}`);

                // Verify update
                const updatedUser = await db.get('SELECT daily_one_card_count FROM users WHERE id = ?', [req.user.id]);
                log(`DEBUG: New Count for User ${req.user.id}: ${updatedUser.daily_one_card_count}`);
            }
            // Note: 'day' spread doesn't increment daily_one_card_count anymore as it's tracked by readings table count in checkLimits
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

router.post('/chat', async (req, res) => {
    try {
        const { userId, history, newMessage, context } = req.body;
        // context should contain { cards, originalQuestion, spreadType, lang }

        console.log(`Chat request from User ${userId}: ${newMessage}`);

        // Chat Limit Check
        const db = await initDb();
        const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [userId]);
        const tier = user?.subscription_tier || 'free';

        // Calculate user questions count from history (user messages)
        const userQuestionsCount = history.filter(msg => msg.role === 'user').length;

        let limit = 3; // Free
        if (tier === 'basic') limit = 10;
        if (tier === 'max') limit = 20;

        if (userQuestionsCount >= limit) {
            const userLang = context?.lang || 'en';
            const limitMessages = {
                'en': "Chat limit reached. Upgrade to ask more questions.",
                'ru': "Лимит сообщений исчерпан. Обновите тариф для продолжения.",
                'uk': "Ліміт повідомлень вичерпано. Оновіть тариф для продовження."
            };
            const maxMessages = {
                'en': "You have reached the maximum chat limit for this reading.",
                'ru': "Вы достигли максимального лимита сообщений для этого расклада.",
                'uk': "Ви досягли максимального ліміту повідомлень для цього розкладу."
            };

            return res.status(200).json({
                response: tier === 'max'
                    ? (maxMessages[userLang] || maxMessages['en'])
                    : (limitMessages[userLang] || limitMessages['en']),
                limitReached: true
            });
        }

        const response = await continueChat(history, newMessage, context);

        res.json({ response });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

router.get('/user/:telegramId', async (req, res) => {
    try {
        const db = await initDb();
        let user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [req.params.telegramId]);

        if (!user) {
            // Auto-create user if not found (e.g. first visit or mock user)
            const result = await db.run(`
                INSERT INTO users (telegram_id, username, first_name, language_code)
                VALUES (?, ?, ?, ?)
            `, [
                req.params.telegramId,
                req.query.username || 'User',
                req.query.first_name || 'User',
                req.query.language_code || 'en'
            ]);
            user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
        }

        res.json(user);
    } catch (error) {
        console.error('DB Error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/user/settings', async (req, res) => {
    const { userId, notificationsEnabled, notificationTime, receiveDailyReading } = req.body;
    try {
        const db = await initDb();
        await db.run(`
            UPDATE users 
            SET notifications_enabled = ?, notification_time = ?, receive_daily_reading = ?
            WHERE id = ?
        `, [notificationsEnabled ? 1 : 0, notificationTime, receiveDailyReading ? 1 : 0, userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Settings Update Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

router.post('/user/upgrade', async (req, res) => {
    const { userId, tier } = req.body;
    try {
        const db = await initDb();
        await db.run('UPDATE users SET subscription_tier = ? WHERE id = ?', [tier, userId]);
        res.json({ success: true, tier });
    } catch (error) {
        console.error('Upgrade Error:', error);
        res.status(500).json({ error: 'Failed to upgrade' });
    }
});

module.exports = router;
