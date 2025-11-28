require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bot = require('./bot');
const apiRoutes = require('./routes/api');
const { initDb } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/api', apiRoutes);

// Start server
(async () => {
    try {
        await initDb();

        // Launch bot
        bot.launch().then(() => {
            console.log('Bot started');
        }).catch(err => console.error('Bot launch error:', err));

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);
        });
    } catch (err) {
        console.error('Fatal error:', err);
    }
})();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
