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

module.exports = bot;
