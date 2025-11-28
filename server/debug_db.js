const { initDb } = require('./database/db');

(async () => {
    const db = await initDb();
    const users = await db.all('SELECT * FROM users ORDER BY id DESC LIMIT 5');
    console.log('Users:', users);
    // const readings = await db.all('SELECT * FROM readings ORDER BY id DESC LIMIT 10');
    // console.log('Readings:', readings);

    const today = new Date().toISOString().split('T')[0];
    console.log('Today (JS):', today);

    const count = await db.get('SELECT COUNT(*) as count FROM readings WHERE date(created_at) = ?', [today]);
    console.log('Count for Today:', count);

    const dateCheck = await db.get('SELECT created_at, date(created_at) as date_val FROM readings LIMIT 1');
    console.log('Date Check:', dateCheck);
})();
