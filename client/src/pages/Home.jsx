import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ user, t }) => {
    const navigate = useNavigate();

    const startReading = (type) => {
        navigate('/reading', { state: { spreadType: type } });
    };

    // Helper to estimate price in USD (approximate)
    const getPriceDisplay = (stars) => {
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
                        {getPriceDisplay(0)}
                    </span>
                </button>

                <button className="btn btn--secondary" onClick={() => startReading('one')}>
                    <span className="btn__text">{t('oneCard')}</span>
                    <span className="price-badge star">
                        {getPriceDisplay(1)}
                    </span>
                </button>

                <button className="btn btn--accent" onClick={() => startReading('three')}>
                    <span className="btn__text">{t('threeCard')}</span>
                    <span className="price-badge star">
                        {getPriceDisplay(50)}
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
