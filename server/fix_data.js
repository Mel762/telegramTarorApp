const { initDb } = require('./database/db');

(async () => {
    const db = await initDb();
    console.log('Fixing readings table user_id types...');

    // Find readings with string user_id
    const badReadings = await db.all("SELECT * FROM readings WHERE typeof(user_id) = 'text'");
    console.log(`Found ${badReadings.length} bad readings.`);

    for (const reading of badReadings) {
        const user = await db.get('SELECT id FROM users WHERE telegram_id = ?', [reading.user_id]);
        if (user) {
            await db.run('UPDATE readings SET user_id = ? WHERE id = ?', [user.id, reading.id]);
            console.log(`Fixed reading ${reading.id}: ${reading.user_id} -> ${user.id}`);
        } else {
            console.log(`Could not find user for reading ${reading.id} (user_id: ${reading.user_id})`);
        }
    }
    console.log('Done.');
})();
