import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ user, t }) => {
    const navigate = useNavigate();

    const startReading = (type) => {
        navigate('/reading', { state: { spreadType: type } });
    };

    return (
        <div className="home">
            <div className="home__header">
                <h1>
                    {t('welcome')}
                    {user && <><br />{user.first_name}</>}
                </h1>
            </div>

            <div className="home__menu">
                <button className="btn btn--primary" onClick={() => startReading('day')}>
                    <span className="btn__icon">🔮</span>
                    {t('cardOfDay')}
                </button>

                <button className="btn btn--secondary" onClick={() => startReading('one')}>
                    <span className="btn__icon">🃏</span>
                    {t('oneCard')}
                </button>

                <button className="btn btn--accent" onClick={() => startReading('three')}>
                    <span className="btn__icon">✨</span>
                    {t('threeCard')}
                </button>

                <button className="btn btn--profile" onClick={() => navigate('/profile')}>
                    <span className="btn__icon">⚙️</span>
                    {t('profile') || 'Profile & Settings'}
                </button>
            </div>
        </div>
    );
};

export default Home;
