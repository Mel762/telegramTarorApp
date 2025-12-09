require('dotenv').config({ path: './server/.env' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Force SSL for Supabase
});

async function debugNotifications() {
    try {
        console.log('--- Debugging Notifications ---');

        const now = new Date();
        console.log('Current Server Time (Local):', now.toString());
        console.log('Current Server Time (UTC):', now.toISOString());
        const currentUtcTime = now.toISOString().substr(11, 5);
        console.log('Current UTC HH:mm:', currentUtcTime);

        console.log('\n--- Users with Notifications Enabled ---');
        const res = await pool.query('SELECT id, username, notifications_enabled, notification_time, last_daily_reading_date FROM users WHERE notifications_enabled = 1');

        if (res.rows.length === 0) {
            console.log('No users found with notifications_enabled = 1');
        } else {
            res.rows.forEach(user => {
                console.log(`User ${user.id} (${user.username}):`);
                console.log(`  Enabled: ${user.notifications_enabled}`);
                console.log(`  Time (UTC): ${user.notification_time}`);
                console.log(`  Last Reading: ${user.last_daily_reading_date}`);

                // Check match
                if (user.notification_time === currentUtcTime) {
                    console.log('  [MATCH] Time matches current UTC time!');
                } else {
                    console.log(`  [NO MATCH] ${user.notification_time} != ${currentUtcTime}`);
                }
            });
        }

        console.log('\n--- All Users Sample ---');
        const allRes = await pool.query('SELECT id, username, notifications_enabled, notification_time FROM users LIMIT 5');
        console.table(allRes.rows);

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        pool.end();
    }
}

debugNotifications();
