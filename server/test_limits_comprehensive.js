const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test Users (Randomized to ensure clean state)
const RAND = Math.floor(Math.random() * 10000);
const USERS = {
    FREE: { id: `test_free_${RAND}`, lang: 'ru' },
    BASIC: { id: `test_basic_${RAND}`, lang: 'en' },
    MAX: { id: `test_max_${RAND}`, lang: 'uk' }
};

async function resetUser(telegramId, tier) {
    // 1. Get/Create User
    await axios.get(`${BASE_URL}/user/${telegramId}`);
    // 2. Set Tier (hacky, but we need to ensure tier)
    await axios.post(`${BASE_URL}/user/upgrade`, { userId: telegramId, tier }); // Note: upgrade uses telegramId? No, it uses internal ID usually.
    // Wait, the upgrade endpoint uses `userId` which in api.js is used in `WHERE id = ?`. 
    // But frontend passes `user.id` (internal).
    // My test script only knows telegramId.
    // I need to get the internal ID first.
    const userRes = await axios.get(`${BASE_URL}/user/${telegramId}`);
    const internalId = userRes.data.id;

    await axios.post(`${BASE_URL}/user/upgrade`, { userId: internalId, tier });

    // 3. Reset limits (we can't easily do this via API without waiting for next day)
    // But we can rely on the fact that we are creating fresh users or we can just test the increment logic.
    // Actually, to test limits, we need to hit them.
    return internalId;
}

async function doReading(telegramId, spreadType, lang, expectedLimitReached) {
    try {
        const res = await axios.post(`${BASE_URL}/reading`, {
            userId: telegramId,
            spreadType,
            cards: [{ name: 'Test', id: 0 }],
            question: 'Test',
            lang
        });

        if (res.data.limitReached) {
            console.log(`[${telegramId}] ${spreadType}: LIMIT REACHED. Msg: "${res.data.error}"`);
            if (!expectedLimitReached) console.error('>>> ERROR: Expected SUCCESS but got LIMIT');
            return false; // Limit reached
        } else {
            console.log(`[${telegramId}] ${spreadType}: SUCCESS.`);
            if (expectedLimitReached) console.error('>>> ERROR: Expected LIMIT but got SUCCESS');
            return true; // Success
        }
    } catch (e) {
        console.error(`[${telegramId}] ${spreadType}: ERROR`, e.message);
        return false;
    }
}

async function runTests() {
    console.log('=== STARTING COMPREHENSIVE LIMIT TESTS ===');

    // --- FREE TIER TEST ---
    console.log('\n--- TESTING FREE TIER (RU) ---');
    const freeId = await resetUser(USERS.FREE.id, 'free');

    // 1. Card of the Day (Limit: 1)
    console.log('1. Card of the Day (Allowed: 1)');
    await doReading(USERS.FREE.id, 'day', 'ru', false); // 1st - OK
    await doReading(USERS.FREE.id, 'day', 'ru', true);  // 2nd - FAIL

    // 2. 1-Card Reading (Limit: 1)
    console.log('2. 1-Card Reading (Allowed: 1)');
    await doReading(USERS.FREE.id, 'one', 'ru', false); // 1st - OK
    await doReading(USERS.FREE.id, 'one', 'ru', true);  // 2nd - FAIL

    // 3. 3-Card Reading (Allowed: 1 Welcome, then 0)
    console.log('3. 3-Card Reading (Allowed: 1 Welcome)');
    // Note: If test user already exists, welcome might be used. 
    // We assume fresh DB or we accept that it might fail if run multiple times without DB reset.
    // For now, let's try.
    await doReading(USERS.FREE.id, 'three', 'ru', false); // 1st - OK (Welcome)
    await doReading(USERS.FREE.id, 'three', 'ru', true);  // 2nd - FAIL

    // --- BASIC TIER TEST ---
    console.log('\n--- TESTING BASIC TIER (EN) ---');
    const basicId = await resetUser(USERS.BASIC.id, 'basic');

    // 1. Card of the Day (Limit: 1)
    console.log('1. Card of the Day (Allowed: 1)');
    await doReading(USERS.BASIC.id, 'day', 'en', false);
    await doReading(USERS.BASIC.id, 'day', 'en', true);

    // 2. 1-Card Reading (Limit: 2)
    console.log('2. 1-Card Reading (Allowed: 2)');
    await doReading(USERS.BASIC.id, 'one', 'en', false);
    await doReading(USERS.BASIC.id, 'one', 'en', false);
    await doReading(USERS.BASIC.id, 'one', 'en', true);

    // 3. 3-Card Reading (Limit: 1)
    console.log('3. 3-Card Reading (Allowed: 1)');
    await doReading(USERS.BASIC.id, 'three', 'en', false);
    await doReading(USERS.BASIC.id, 'three', 'en', true);

    console.log('\n=== TESTS FINISHED ===');
}

runTests();
