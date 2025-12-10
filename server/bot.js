const { Telegraf } = require('telegraf');
const { initDb, pool } = require('./database/db');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
    const db = await initDb();
    const user = ctx.from;

    await db.run(`
    INSERT OR IGNORE INTO users (telegram_id, username, first_name)
    VALUES (?, ?, ?)
  `, [user.id, user.username, user.first_name]);

    ctx.reply('Welcome to the Tarot Oracle! 🔮\nOpen the app to get your reading.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Open Tarot App", web_app: { url: process.env.WEBAPP_URL } }]
            ]
        }
    });
});

// Payment Handlers
bot.on('pre_checkout_query', (ctx) => {
    ctx.answerPreCheckoutQuery(true).catch(err => {
        console.error('Pre-checkout error:', err);
    });
});

bot.on('successful_payment', async (ctx) => {
    try {
        const { total_amount, invoice_payload, currency } = ctx.message.successful_payment;
        const userId = ctx.from.id;

        // Payload: { spreadType: 'one'|'three', userId: 123 }
        let payload = {};
        try {
            payload = JSON.parse(invoice_payload);
        } catch (e) {
            console.error('Failed to parse invoice payload:', invoice_payload);
            return;
        }

        const spreadType = payload.spreadType;
        console.log(`Payment successful for User ${userId}. Spread: ${spreadType}, Amount: ${total_amount} ${currency}`);

        // Update User Credits
        // We use telegram_id (userId from context) to find the user
        try {
            const userResult = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [String(userId)]);
            const user = userResult.rows[0];

            if (user) {
                if (spreadType === 'one') {
                    await pool.query('UPDATE users SET free_readings_one = free_readings_one + 1 WHERE id = $1', [user.id]);
                    console.log(`User ${user.id} purchased 1 free reading (one).`);
                } else if (spreadType === 'three') {
                    await pool.query('UPDATE users SET free_readings_three = free_readings_three + 1 WHERE id = $1', [user.id]);
                    console.log(`User ${user.id} purchased 1 free reading (three).`);
                }
            } else {
                console.error(`User for successful payment not found: ${userId}`);
            }
        } catch (dbError) {
            console.error('Database update error on payment:', dbError);
        }

        // Notify user
        ctx.reply(`Payment received! ✨ You have unlocked a new ${spreadType === 'one' ? '1-Card' : '3-Card'} reading.`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Open App", web_app: { url: process.env.WEBAPP_URL } }]
                ]
            }
        });
    } catch (error) {
        console.error('Payment processing error:', error);
    }
});

module.exports = bot;
