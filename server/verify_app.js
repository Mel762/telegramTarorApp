const { initDb } = require('./database/db');
const axios = require('axios');

async function verify() {
    console.log('=== Starting Functional Verification ===');
    const baseUrl = 'http://localhost:3000/api';
    const testTelegramId = 'test_user_' + Date.now();

    try {
        const db = await initDb();

        // 1. Simulate User Creation (like Bot /start)
        console.log('\n1. Creating Test User...');
        await db.run(`
            INSERT INTO users (telegram_id, username, first_name)
            VALUES (?, ?, ?)
        `, [testTelegramId, 'TestUser', 'Tester']);

        const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', [testTelegramId]);
        if (user) {
            console.log(`✅ PASS: User created. ID: ${user.id}, TelegramID: ${user.telegram_id}`);
        } else {
            throw new Error('User not found in DB after insertion');
        }

        // 2. Test Invoice Creation
        console.log('\n2. Testing Invoice Creation...');
        const invoiceRes = await axios.post(`${baseUrl}/create-stars-invoice`, {
            userId: testTelegramId,
            spreadType: 'one'
        });
        if (invoiceRes.data.invoiceLink) {
            console.log('✅ PASS: Invoice link generated:', invoiceRes.data.invoiceLink);
        } else {
            throw new Error('No invoice link returned');
        }

        // 3. Simulate Reading Generation (Post-Payment)
        console.log('\n3. Testing Reading Generation & Persistence...');
        // Mock cards and question
        const readingRes = await axios.post(`${baseUrl}/reading`, {
            userId: testTelegramId,
            question: 'Will this test pass?',
            spreadType: 'one',
            cards: [{ name: 'The Fool', position: 'General', isReversed: false }],
            lang: 'en'
        });

        if (readingRes.data.reading) {
            console.log('✅ PASS: Reading generated via API.');
        } else {
            throw new Error('No reading returned from API');
        }

        // 4. Verify Reading in DB
        const reading = await db.get('SELECT * FROM readings WHERE user_id = ? ORDER BY id DESC LIMIT 1', [user.id]);
        if (reading) {
            console.log(`✅ PASS: Reading saved to DB. ID: ${reading.id}, Question: "${reading.question}"`);
        } else {
            throw new Error('Reading not found in DB');
        }

    } catch (error) {
        console.error('❌ FAIL:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        process.exit(1);
    }

    console.log('\n=== Verification Finished Successfully ===');
    process.exit(0);
}

verify();
