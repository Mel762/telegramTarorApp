require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bot = require('./bot');
const apiRoutes = require('./routes/api');
const { initDb } = require('./database/db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/api', apiRoutes);

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Initialize DB connection pool
initDb().catch(console.error);

// Start server if running directly (Local Dev)
if (require.main === module) {
    (async () => {
        try {
            // Launch bot (Long Polling for local dev)
            bot.launch().then(() => {
                console.log('Bot started');
                // startScheduler is now triggered via /api/cron
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
}

module.exports = app;
