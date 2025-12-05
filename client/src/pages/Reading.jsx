import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Chat from '../components/Chat';
import { tarotDeck, shuffleDeck } from '../data/tarotDeck';
import './Reading.css';

const Reading = ({ user, t, lang, refreshUser }) => {
    // ... (hooks remain same)

    // ... (useEffect remains same)

    // ... (handleSendMessage remains same)

    // ... (handlePayment remains same)

    const handleCardSelect = async (forcePaid = false) => {
        if (!isPaid && !forcePaid) {
            await handlePayment();
            return;
        }

        const shuffled = shuffleDeck(tarotDeck);
        const numCards = spreadType === 'three' ? 3 : 1;
        const selected = shuffled.slice(0, numCards).map((card, index) => ({
            ...card,
            position: spreadType === 'three' ? [t('past'), t('present'), t('future')][index] : t('general'),
            isRevealed: false
        }));

        setCards(selected);
        setStep('reveal');

        // Initial reading request
        fetchReading(selected, messages[messages.length - 1].text);
    };

    // ... (state declarations remain same)

    const fetchReading = async (selectedCards, question) => {
        setLoading(true);
        try {
            const response = await fetch('/api/reading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 123,
                    username: user?.username,
                    name: user?.first_name,
                    lang,
                    question,
                    spreadType,
                    cards: selectedCards
                })
            });
            const data = await response.json();

            if (data.limitReached) {
                setIsLocked(true);
                setLimitMessage(data.error);
                return;
            }

            if (!response.ok) {
                setMessages(prev => [...prev, { sender: 'ai', text: data.error || t('error') }]);
                return;
            }

            setMessages(prev => [...prev, { sender: 'ai', text: data.reading }]);

            // Refresh user data to update credits
            if (refreshUser) refreshUser();

        } catch (error) {
            console.error('Error fetching reading:', error);
            setMessages(prev => [...prev, { sender: 'ai', text: t('error') }]);
        } finally {
            setLoading(false);
        }
    };

    const revealCard = (index) => {
        if (isLocked) {
            // Optional: Show a toast or shake animation
            return;
        }
        const newCards = [...cards];
        newCards[index].isRevealed = true;
        setCards(newCards);
    };

    const goBack = () => {
        navigate('/');
    };

    const allRevealed = cards.every(c => c.isRevealed);

    return (
        <div className="reading-page">
            <button className="back-btn" onClick={goBack}>{t('back')}</button>

            {step === 'intro' && (
                <div className="reading-intro">
                    <h2>{t('focus')}</h2>
                    <Chat messages={messages} onSendMessage={handleSendMessage} placeholder={t('askPlaceholder')} />
                </div>
            )}

            {step === 'shuffling' && (
                <div className="shuffling-anim">
                    <div className="deck-shuffle">
                        <div className="card-shuffle"></div>
                        <div className="card-shuffle"></div>
                        <div className="card-shuffle"></div>
                    </div>
                    <p style={{ marginTop: '20px', opacity: 0.8 }}>{t('shuffling')}</p>
                </div>
            )}

            {step === 'selection' && (
                <div className="card-selection" onClick={handleCardSelect}>
                    <div className="deck-stack">
                        <div className="card-back"></div>
                        <div className="card-back"></div>
                        <div className="card-back"></div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>{t('tapToDraw')}</p>
                </div>
            )}

            {step === 'reveal' && (
                <div className="reading-reveal">
                    <div className="cards-container">
                        {cards.map((card, idx) => (
                            <div key={card.id} className="card-wrapper">
                                <p className="card-position">{card.position}</p>
                                <div className="card-sway">
                                    <Card
                                        name={card.name}
                                        image={card.image}
                                        isRevealed={card.isRevealed}
                                        onReveal={() => revealCard(idx)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {!allRevealed && (
                        <p className="reveal-instruction">
                            {isLocked ? (
                                <span className="limit-message" style={{ color: '#ff6b6b' }}>{limitMessage}</span>
                            ) : (
                                t('revealInstruction')
                            )}
                        </p>
                    )}

                    {allRevealed && (
                        <div className="reading-chat-container">
                            <Chat
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                placeholder={t('askPlaceholder')}
                                disabled={loading || isChatLocked}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reading;
