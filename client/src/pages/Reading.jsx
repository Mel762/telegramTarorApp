import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Chat from '../components/Chat';
import { tarotDeck, shuffleDeck } from '../data/tarotDeck';
import './Reading.css';

const Reading = ({ user, t, lang }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { spreadType } = location.state || { spreadType: 'day' };

    const [step, setStep] = useState(spreadType === 'day' ? 'shuffling' : 'intro'); // intro, shuffling, selection, reveal
    const [cards, setCards] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!location.state) {
            navigate('/');
        } else if (spreadType === 'day') {
            // Auto-start for daily reading
            const defaultQuestion = t('cardOfDay'); // Use translation as default question
            setMessages([{ sender: 'user', text: defaultQuestion }]);
            setTimeout(() => setStep('selection'), 2000);
        }
    }, [location, navigate, spreadType, t]);

    const handleSendMessage = async (text) => {
        // Add user message
        const newMessages = [...messages, { sender: 'user', text }];
        setMessages(newMessages);

        if (step === 'intro') {
            setStep('shuffling');
            setTimeout(() => setStep('selection'), 2000);
        } else if (step === 'reveal') {
            // Follow-up question
            setLoading(true);

            try {
                // Prepare context
                const context = {
                    cards: cards.map(c => ({ name: c.name, position: c.position, isReversed: c.isReversed })),
                    originalQuestion: messages[0].text, // Assuming first message is the question
                    spreadType,
                    lang
                };

                // Filter history for the backend (exclude system messages if any, or keep all)
                // We send the full conversation so far plus the new message
                const history = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text }));

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id || 123,
                        history,
                        newMessage: text,
                        context
                    })
                });

                const data = await response.json();

                if (data.limitReached) {
                    setIsChatLocked(true);
                    setMessages(prev => [...prev, { sender: 'ai', text: data.response || data.error }]);
                } else if (!response.ok) {
                    setMessages(prev => [...prev, { sender: 'ai', text: data.error || t('error') }]);
                } else {
                    setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
                }
            } catch (error) {
                console.error('Chat Error:', error);
                setMessages(prev => [...prev, { sender: 'ai', text: t('error') }]);
            } finally {
                setLoading(false);
            }
        }
    };

    const [isPaid, setIsPaid] = useState(spreadType === 'day'); // Day is free

    const handlePayment = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch('/api/create-stars-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, spreadType }) // Use user.id (telegram_id)
            });
            const data = await res.json();

            if (data.error) {
                console.error('Invoice error:', data.error);
                alert(t('error'));
                setLoading(false);
                return;
            }

            if (window.Telegram?.WebApp?.openInvoice) {
                window.Telegram.WebApp.openInvoice(data.invoiceLink, (status) => {
                    if (status === 'paid') {
                        setIsPaid(true);
                        // Optional: Auto-trigger selection or let user click again
                        // handleCardSelect(true); 
                    } else {
                        setLoading(false);
                    }
                });
            } else {
                // Fallback for dev
                console.log('Dev Mode: Payment Link', data.invoiceLink);
                window.open(data.invoiceLink, '_blank');
                // Simulate payment for dev
                // setIsPaid(true); 
                setLoading(false);
            }
        } catch (error) {
            console.error('Payment flow error:', error);
            setLoading(false);
        }
    };

    const handleCardSelect = async (forcePaid = false) => {
        if (!isPaid && !forcePaid) {
            await handlePayment();
            return;
        }

        const shuffled = shuffleDeck(tarotDeck);
        const numCards = spreadType === 'three' ? 3 : 1;
        const selected = shuffled.slice(0, numCards).map((card, index) => ({
            ...card,
            position: spreadType === 'three' ? ['Past', 'Present', 'Future'][index] : 'General',
            isRevealed: false
        }));

        setCards(selected);
        setStep('reveal');

        // Initial reading request
        fetchReading(selected, messages[messages.length - 1].text);
    };

    const [isLocked, setIsLocked] = useState(false);
    const [isChatLocked, setIsChatLocked] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    // ... (existing useEffect)

    // ... (existing handleSendMessage)

    // ... (existing handleCardSelect)

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
                // Do not add error to chat, just lock the UI
                return;
            }

            if (!response.ok) {
                setMessages(prev => [...prev, { sender: 'ai', text: data.error || t('error') }]);
                return;
            }

            setMessages(prev => [...prev, { sender: 'ai', text: data.reading }]);
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
                                <Card
                                    name={card.name}
                                    image={card.image}
                                    isRevealed={card.isRevealed}
                                    onReveal={() => revealCard(idx)}
                                />
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
