const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = '999999'; // Mock Telegram ID

async function runTest() {
    console.log('Starting Limit Test...');

    // 1. Reset/Create User (Free Tier)
    try {
        await axios.get(`${BASE_URL}/user/${TEST_USER_ID}?username=TestUser`);
        console.log('User fetched/created.');
    } catch (e) {
        console.error('Error fetching user:', e.message);
    }

    // 2. Perform 1st 1-Card Reading (Should succeed)
    console.log('\nAttempting 1st Reading (1-Card)...');
    try {
        const res = await axios.post(`${BASE_URL}/reading`, {
            userId: TEST_USER_ID,
            spreadType: 'one',
            cards: [{ name: 'Fool', id: 0 }],
            question: 'Test 1'
        });
        console.log('1st Reading Result:', res.data.limitReached ? 'LIMIT REACHED' : 'SUCCESS');
    } catch (e) {
        console.log('1st Reading Failed:', e.response?.data || e.message);
    }

    // 3. Perform 2nd 1-Card Reading (Should FAIL for Free tier)
    console.log('\nAttempting 2nd Reading (1-Card)...');
    try {
        const res = await axios.post(`${BASE_URL}/reading`, {
            userId: TEST_USER_ID,
            spreadType: 'one',
            cards: [{ name: 'Magician', id: 1 }],
            question: 'Test 2'
        });
        if (res.data.limitReached) {
            console.log('2nd Reading Result: LIMIT REACHED (CORRECT)');
        } else {
            console.log('2nd Reading Result: SUCCESS (FAIL - Should be limited)');
        }
    } catch (e) {
        console.log('2nd Reading Failed:', e.response?.data || e.message);
    }
}

runTest();
