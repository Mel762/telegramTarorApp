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

// Serve static files from the React app
const path = require('path');
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

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
