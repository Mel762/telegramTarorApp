const { Telegraf } = require('telegraf');
const { initDb } = require('./database/db');

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

        // We don't need to update DB for "subscription" anymore.
        // We could log this payment to a 'payments' table if we had one, but for now just logging to console is enough.
        // The frontend will proceed to request the reading upon receiving 'paid' status.

        // Notify user
        ctx.reply(`Payment received! ✨ You can now proceed with your reading.`);
    } catch (error) {
        console.error('Payment processing error:', error);
    }
});

module.exports = bot;
