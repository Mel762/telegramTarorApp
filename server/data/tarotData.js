const tarotDeck = [
    // Major Arcana
    { id: 'major_0', name: 'The Fool', type: 'major', image: '/cards/fool.png' },
    { id: 'major_1', name: 'The Magician', type: 'major', image: '/cards/magician.png' },
    { id: 'major_2', name: 'The High Priestess', type: 'major', image: '/cards/high_priestess.png' },
    { id: 'major_3', name: 'The Empress', type: 'major', image: '/cards/empress.png' },
    { id: 'major_4', name: 'The Emperor', type: 'major', image: '/cards/emperor.png' },
    { id: 'major_5', name: 'The Hierophant', type: 'major', image: '/cards/hierophant.png' },
    { id: 'major_6', name: 'The Lovers', type: 'major', image: '/cards/lovers.png' },
    { id: 'major_7', name: 'The Chariot', type: 'major', image: '/cards/chariot.png' },
    { id: 'major_8', name: 'Strength', type: 'major', image: '/cards/strength.png' },
    { id: 'major_9', name: 'The Hermit', type: 'major', image: '/cards/hermit.png' },
    { id: 'major_10', name: 'Wheel of Fortune', type: 'major', image: '/cards/wheel_of_fortune.png' },
    { id: 'major_11', name: 'Justice', type: 'major', image: '/cards/justice.png' },
    { id: 'major_12', name: 'The Hanged Man', type: 'major', image: '/cards/hanged_man.png' },
    { id: 'major_13', name: 'Death', type: 'major', image: '/cards/death.png' },
    { id: 'major_14', name: 'Temperance', type: 'major', image: '/cards/temperance.png' },
    { id: 'major_15', name: 'The Devil', type: 'major', image: '/cards/devil.png' },
    { id: 'major_16', name: 'The Tower', type: 'major', image: '/cards/tower.png' },
    { id: 'major_17', name: 'The Star', type: 'major', image: '/cards/star.png' },
    { id: 'major_18', name: 'The Moon', type: 'major', image: '/cards/moon.png' },
    { id: 'major_19', name: 'The Sun', type: 'major', image: '/cards/sun.png' },
    { id: 'major_20', name: 'Judgement', type: 'major', image: '/cards/judgement.png' },
    { id: 'major_21', name: 'The World', type: 'major', image: '/cards/world.png' },

    // Wands
    { id: 'wands_1', name: 'Ace of Wands', type: 'minor', suit: 'wands', image: '/cards/ace_of_wands.png' },
    { id: 'wands_2', name: 'Two of Wands', type: 'minor', suit: 'wands', image: '/cards/wands2.png' },
    { id: 'wands_3', name: 'Three of Wands', type: 'minor', suit: 'wands', image: '/cards/wands3.png' },
    { id: 'wands_4', name: 'Four of Wands', type: 'minor', suit: 'wands', image: '/cards/wands4.png' },
    { id: 'wands_5', name: 'Five of Wands', type: 'minor', suit: 'wands', image: '/cards/wands5.png' },
    { id: 'wands_6', name: 'Six of Wands', type: 'minor', suit: 'wands', image: '/cards/wands6.png' },
    { id: 'wands_7', name: 'Seven of Wands', type: 'minor', suit: 'wands', image: '/cards/wands7.png' },
    { id: 'wands_8', name: 'Eight of Wands', type: 'minor', suit: 'wands', image: '/cards/wands8.png' },
    { id: 'wands_9', name: 'Nine of Wands', type: 'minor', suit: 'wands', image: '/cards/wands9.png' },
    { id: 'wands_10', name: 'Ten of Wands', type: 'minor', suit: 'wands', image: '/cards/wands10.png' },
    { id: 'wands_page', name: 'Page of Wands', type: 'minor', suit: 'wands', image: '/cards/page_of_wands.png' },
    { id: 'wands_knight', name: 'Knight of Wands', type: 'minor', suit: 'wands', image: '/cards/knight_of_wands.png' },
    { id: 'wands_queen', name: 'Queen of Wands', type: 'minor', suit: 'wands', image: '/cards/queen_of_wands.png' },
    { id: 'wands_king', name: 'King of Wands', type: 'minor', suit: 'wands', image: '/cards/king_of_wands.png' },

    // Cups
    { id: 'cups_1', name: 'Ace of Cups', type: 'minor', suit: 'cups', image: '/cards/ace_of_cups.png' },
    { id: 'cups_2', name: 'Two of Cups', type: 'minor', suit: 'cups', image: '/cards/cups2.png' },
    { id: 'cups_3', name: 'Three of Cups', type: 'minor', suit: 'cups', image: '/cards/cups3.png' },
    { id: 'cups_4', name: 'Four of Cups', type: 'minor', suit: 'cups', image: '/cards/cups4.png' },
    { id: 'cups_5', name: 'Five of Cups', type: 'minor', suit: 'cups', image: '/cards/cups5.png' },
    { id: 'cups_6', name: 'Six of Cups', type: 'minor', suit: 'cups', image: '/cards/cups6.png' },
    { id: 'cups_7', name: 'Seven of Cups', type: 'minor', suit: 'cups', image: '/cards/cups7.png' },
    { id: 'cups_8', name: 'Eight of Cups', type: 'minor', suit: 'cups', image: '/cards/cups8.png' },
    { id: 'cups_9', name: 'Nine of Cups', type: 'minor', suit: 'cups', image: '/cards/cups9.png' },
    { id: 'cups_10', name: 'Ten of Cups', type: 'minor', suit: 'cups', image: '/cards/cups10.png' },
    { id: 'cups_page', name: 'Page of Cups', type: 'minor', suit: 'cups', image: '/cards/page_of_cups.png' },
    { id: 'cups_knight', name: 'Knight of Cups', type: 'minor', suit: 'cups', image: '/cards/knight_of_cups.png' },
    { id: 'cups_queen', name: 'Queen of Cups', type: 'minor', suit: 'cups', image: '/cards/queen_of_cups.png' },
    { id: 'cups_king', name: 'King of Cups', type: 'minor', suit: 'cups', image: '/cards/king_of_cups.png' },

    // Swords
    { id: 'swords_1', name: 'Ace of Swords', type: 'minor', suit: 'swords', image: '/cards/ace_of_swords.png' },
    { id: 'swords_2', name: 'Two of Swords', type: 'minor', suit: 'swords', image: '/cards/swords2.png' },
    { id: 'swords_3', name: 'Three of Swords', type: 'minor', suit: 'swords', image: '/cards/swords3.png' },
    { id: 'swords_4', name: 'Four of Swords', type: 'minor', suit: 'swords', image: '/cards/swords4.png' },
    { id: 'swords_5', name: 'Five of Swords', type: 'minor', suit: 'swords', image: '/cards/swords5.png' },
    { id: 'swords_6', name: 'Six of Swords', type: 'minor', suit: 'swords', image: '/cards/swords6.png' },
    { id: 'swords_7', name: 'Seven of Swords', type: 'minor', suit: 'swords', image: '/cards/swords7.png' },
    { id: 'swords_8', name: 'Eight of Swords', type: 'minor', suit: 'swords', image: '/cards/swords8.png' },
    { id: 'swords_9', name: 'Nine of Swords', type: 'minor', suit: 'swords', image: '/cards/swords9.png' },
    { id: 'swords_10', name: 'Ten of Swords', type: 'minor', suit: 'swords', image: '/cards/swords10.png' },
    { id: 'swords_page', name: 'Page of Swords', type: 'minor', suit: 'swords', image: '/cards/page_of_swords.png' },
    { id: 'swords_knight', name: 'Knight of Swords', type: 'minor', suit: 'swords', image: '/cards/knight_of_swords.png' },
    { id: 'swords_queen', name: 'Queen of Swords', type: 'minor', suit: 'swords', image: '/cards/queen_of_swords.png' },
    { id: 'swords_king', name: 'King of Swords', type: 'minor', suit: 'swords', image: '/cards/king_of_swords.png' },

    // Pentacles
    { id: 'pentacles_1', name: 'Ace of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/ace_of_pentacles.png' },
    { id: 'pentacles_2', name: 'Two of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles2.png' },
    { id: 'pentacles_3', name: 'Three of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles3.png' },
    { id: 'pentacles_4', name: 'Four of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles4.png' },
    { id: 'pentacles_5', name: 'Five of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles5.png' },
    { id: 'pentacles_6', name: 'Six of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles6.png' },
    { id: 'pentacles_7', name: 'Seven of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles7.png' },
    { id: 'pentacles_8', name: 'Eight of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles8.png' },
    { id: 'pentacles_9', name: 'Nine of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles9.png' },
    { id: 'pentacles_10', name: 'Ten of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/pentacles10.png' },
    { id: 'pentacles_page', name: 'Page of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/page_of_pentacles.png' },
    { id: 'pentacles_knight', name: 'Knight of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/knight_of_pentacles.png' },
    { id: 'pentacles_queen', name: 'Queen of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/queen_of_pentacles.png' },
    { id: 'pentacles_king', name: 'King of Pentacles', type: 'minor', suit: 'pentacles', image: '/cards/king_of_pentacles.png' },
];

const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

module.exports = { tarotDeck, shuffleDeck };
