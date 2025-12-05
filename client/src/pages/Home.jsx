import WebApp from '@twa-dev/sdk';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ user, t }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const startReading = async (type) => {
        if (isLoading) return;

        // Free reading (Card of the Day)
        if (type === 'day') {
            navigate('/reading', { state: { spreadType: type } });
            return;
        }

        // Check for free credits
        if (type === 'one' && user?.free_readings_one > 0) {
            navigate('/reading', { state: { spreadType: type } });
            return;
        }
        if (type === 'three' && user?.free_readings_three > 0) {
            navigate('/reading', { state: { spreadType: type } });
            return;
        }

        // Paid readings
        setIsLoading(true);
        try {
            const response = await fetch('/api/create-stars-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, spreadType: type })
            });
            const data = await response.json();

            if (data.invoiceLink) {
                WebApp.openInvoice(data.invoiceLink, (status) => {
                    setIsLoading(false);
                    if (status === 'paid') {
                        navigate('/reading', { state: { spreadType: type } });
                    } else {
                        console.log('Payment cancelled or failed:', status);
                    }
                });
            } else {
                console.error('Failed to create invoice:', data.error);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setIsLoading(false);
        }
    };

    // Helper to estimate price in USD (approximate)
    const getPriceDisplay = (stars, type) => {
        // Check for free credits
        if (type === 'one' && user?.free_readings_one > 0) {
            return (
                <div className="price-container">
                    <span className="price-stars">{t('free') || 'Free'}</span>
                </div>
            );
        }
        if (type === 'three' && user?.free_readings_three > 0) {
            return (
                <div className="price-container">
                    <span className="price-stars">{t('free') || 'Free'}</span>
                </div>
            );
        }

        if (stars === 0) {
            return (
                <div className="price-container">
                    <span className="price-stars">{t('free') || 'Free'}</span>
                </div>
            );
        }
        // 1 Star approx $0.02 USD
        const usd = (stars * 0.02).toFixed(2);
        return (
            <div className="price-container">
                <span className="price-stars">{stars} ⭐️</span>
                <span className="price-usd">≈ ${usd}</span>
            </div>
        );
    };

    // Random greeting logic
    const getRandomGreeting = () => {
        const greetings = t('greetings');
        if (!greetings || !Array.isArray(greetings)) return t('welcome');
        const randomIndex = Math.floor(Math.random() * greetings.length);
        return greetings[randomIndex].replace('{name}', user?.first_name || 'Traveler');
    };

    const greeting = getRandomGreeting();

    return (
        <div className="home">
            <div className="home__header">
                <h1>{greeting}</h1>
            </div>

            <div className="home__menu">
                <button className="btn btn--primary" onClick={() => startReading('day')}>
                    <span className="btn__text">{t('cardOfDay')}</span>
                    <span className="price-badge star">
                        {getPriceDisplay(0, 'day')}
                    </span>
                </button>

                <button className="btn btn--secondary" onClick={() => startReading('one')}>
                    <span className="btn__text">{t('oneCard')}</span>
                    <span className="price-badge star">
                        {getPriceDisplay(20, 'one')}
                    </span>
                </button>

                <button className="btn btn--accent" onClick={() => startReading('three')}>
                    <span className="btn__text">{t('threeCard')}</span>
                    <span className="price-badge star">
                        {getPriceDisplay(50, 'three')}
                    </span>
                </button>

                <button className="btn btn--profile" onClick={() => navigate('/profile')}>
                    <span className="btn__text">{t('profile') || 'Profile & Settings'}</span>
                </button>
            </div>
        </div>
    );
};

export default Home;
