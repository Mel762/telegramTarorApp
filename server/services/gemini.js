const { GoogleGenerativeAI } = require("@google/generative-ai");

const prompts = require('../config/prompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function generateReading(cards, question, spreadType, userContext = {}) {
    console.log('--- Gemini Service Start ---');
    console.log('Input:', { spreadType, question, cardCount: cards.length });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { name, lang = 'en' } = userContext;
        const languageName = { 'ru': 'Russian', 'uk': 'Ukrainian', 'en': 'English' }[lang] || 'English';
        const langInstruction = {
            'ru': 'Ответ должен быть на русском языке.',
            'uk': 'Відповідь має бути українською мовою.',
            'en': 'Answer must be in English.'
        }[lang] || 'Answer must be in English.';

        // Select prompt template based on language
        // Use 'ru' template for Ukrainian as well to maintain the specific persona style, 
        // but the instruction will force Ukrainian output.
        const promptLang = (lang === 'ru' || lang === 'uk') ? 'ru' : 'en';
        let prompt = prompts.tarotReader[promptLang] || prompts.tarotReader['en'];

        const cardDescriptions = cards.map(c =>
            `${c.position}: ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`
        ).join('\n');

        // Prepare prompt variables
        prompt = prompt.replace('{greeting}', ''); // No specific greeting needed as per prompt instructions
        prompt = prompt.replace('{question}', question || 'General Reading');
        prompt = prompt.replace('{card_info}', `\nCards:\n${cardDescriptions}\nSpread Type: ${spreadType}`);
        prompt = prompt.replace('{history_text}', ''); // No history for initial reading
        prompt = prompt.replace('{language_instruction}', `${langInstruction} Length: 3-5 sentences.`);

        console.log('Sending request to Gemini...');

        // Add a timeout race
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini Request Timeout')), 15000)
        );

        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]);

        console.log('Gemini Response Received');
        return cleanResponse(result.response.text());
    } catch (error) {
        console.error("Gemini API Error Details:", error);
        throw error; // Re-throw to allow caller to handle failure (e.g. not deducting limits)
    }
}

async function continueChat(history, newMessage, userContext = {}) {
    console.log('--- Gemini Chat Start ---');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { lang = 'en' } = userContext;
        const langInstruction = {
            'ru': 'Ответ должен быть на русском языке.',
            'uk': 'Відповідь має бути українською мовою.',
            'en': 'Answer must be in English.'
        }[lang] || 'Answer must be in English.';

        // Format history for the prompt
        let historyText = "\n\nDialog History:\n";
        history.forEach((msg, index) => {
            const role = msg.role === 'user' ? 'User' : 'Tarot Reader';
            historyText += `${role}: ${msg.content}\n`;
        });
        historyText += `User: ${newMessage}\nTarot Reader:`;

        // Select prompt template based on language
        const promptLang = (lang === 'ru' || lang === 'uk') ? 'ru' : 'en';
        let prompt = prompts.tarotReader[promptLang] || prompts.tarotReader['en'];

        prompt = prompt.replace('{greeting}', '');
        prompt = prompt.replace('{question}', userContext.originalQuestion || 'Previous Question');

        const cardDescriptions = userContext.cards ? userContext.cards.map(c =>
            `${c.position}: ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`
        ).join('\n') : 'Cards from previous turn';

        prompt = prompt.replace('{card_info}', `\nCards:\n${cardDescriptions}\nSpread Type: ${userContext.spreadType || 'Unknown'}`);
        prompt = prompt.replace('{history_text}', historyText);
        prompt = prompt.replace('{language_instruction}', `${langInstruction} Length: 3-5 sentences.`);

        const result = await model.generateContent(prompt);
        return cleanResponse(result.response.text());

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return getFallbackMessage(userContext.lang);
    }
}

function cleanResponse(text) {
    if (!text) return text;
    // Remove bold/italic markers (*, _), headers (#), and code blocks (`)
    let cleaned = text.replace(/[\*_#`]/g, '');
    // Remove HTML tags like </blockquote>, </div>, etc.
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");
    return cleaned.trim();
}

function getFallbackMessage(lang) {
    const errorMessages = {
        'ru': "Звезды сейчас скрыты. Пожалуйста, спросите позже.",
        'uk': "Зірки зараз приховані. Будь ласка, запитайте пізніше.",
        'en': "The stars are clouded right now. Please ask again later."
    };
    return errorMessages[lang] || errorMessages['en'];
}

module.exports = { generateReading, continueChat };
