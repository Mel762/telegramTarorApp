import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = ({ user, t, lang, setLang }) => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            // Pass user details to auto-create if needed
            const query = new URLSearchParams({
                username: user.username || '',
                first_name: user.first_name || '',
                language_code: user.language_code || ''
            }).toString();

            fetch(`/api/user/${user.id}?${query}`)
                .then(res => res.json())
                .then(data => {
                    setProfileData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching profile:', err);
                    setLoading(false);
                });
        }
    }, [user]);

    const handleUpgrade = async (tier) => {
        if (!profileData?.id) return;

        try {
            const res = await fetch('/api/user/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profileData.id, tier })
            });
            const data = await res.json();
            if (data.success) {
                setProfileData(prev => ({ ...prev, subscription_tier: tier }));
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
        }
    };

    const handleSettingChange = async (key, value) => {
        if (!profileData?.id) return;

        const newData = { ...profileData, [key]: value };
        setProfileData(newData); // Optimistic update

        try {
            await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profileData.id,
                    notificationsEnabled: newData.notifications_enabled,
                    notificationTime: newData.notification_time,
                    receiveDailyReading: newData.receive_daily_reading
                })
            });
        } catch (error) {
            console.error('Settings update failed:', error);
            // Revert on error (could be improved)
        }
    };

    if (loading) return <div className="profile">Loading...</div>;

    const currentTier = profileData?.subscription_tier || 'free';

    const tiers = [
        {
            id: 'free',
            name: t('novice'),
            price: t('free'),
            features: [
                { text: t('featCardOfDay'), unlocked: true },
                { text: t('featOneCardFree'), unlocked: true },
                { text: t('featThreeCardFree'), unlocked: false },
                { text: t('featChatFree'), unlocked: true },
                { text: t('featNotifications'), unlocked: false }
            ]
        },
        {
            id: 'basic',
            name: t('adept'),
            price: '$4.99',
            features: [
                { text: t('featCardOfDay'), unlocked: true },
                { text: t('featOneCardBasic'), unlocked: true },
                { text: t('featThreeCardBasic'), unlocked: true },
                { text: t('featChatBasic'), unlocked: true },
                { text: t('featNotifications'), unlocked: true }
            ]
        },
        {
            id: 'max',
            name: t('oracle'),
            price: '$9.99',
            features: [
                { text: t('featCardOfDay'), unlocked: true },
                { text: t('featOneCardPro'), unlocked: true },
                { text: t('featThreeCardPro'), unlocked: true },
                { text: t('featChatPro'), unlocked: true },
                { text: t('featNotifications'), unlocked: true }
            ]
        }
    ];

    return (
        <div className="profile">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.first_name?.[0] || '?'}
                </div>
                <div className="profile-info">
                    <h2>{user?.first_name} {user?.last_name}</h2>
                    <span className={`tier-badge ${currentTier}`}>{currentTier}</span>
                </div>
            </div>

            <div className="subscription-section">
                <h3>{t('subscriptionTiers')}</h3>
                <div className="tiers-container">
                    {tiers.map(tier => (
                        <div key={tier.id} className={`tier-card ${tier.id}-tier ${currentTier === tier.id ? 'active' : ''}`}>
                            <h4>{tier.name}</h4>
                            <div className="tier-price">{tier.price}</div>
                            <ul className="tier-features">
                                {tier.features.map((feat, idx) => (
                                    <li key={idx} style={{ opacity: feat.unlocked ? 1 : 0.5 }}>
                                        <span className="feature-icon">{feat.unlocked ? '✅' : '🔒'}</span>
                                        {feat.text}
                                    </li>
                                ))}
                            </ul>
                            {currentTier === tier.id ? (
                                <button className="upgrade-btn current">{t('currentPlan')}</button>
                            ) : (
                                <button className="upgrade-btn unlock" onClick={() => handleUpgrade(tier.id)}>
                                    {tier.id === 'free' ? t('downgrade') : t('upgrade')}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-section">
                <div className="setting-item">
                    <div className="setting-main">
                        <div className="setting-label">
                            <h4>{t('notifications')}</h4>
                            <p>{t('enableNotifications')}</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={!!profileData?.notifications_enabled}
                                onChange={(e) => handleSettingChange('notifications_enabled', e.target.checked ? 1 : 0)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                <div className={`setting-item ${profileData?.receive_daily_reading ? 'expanded' : ''}`}>
                    <div className="setting-main">
                        <div className="setting-label">
                            <h4>{t('dailyReading')}</h4>
                            <p>{t('autoReading')}</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={!!profileData?.receive_daily_reading}
                                disabled={currentTier === 'free'}
                                onChange={(e) => handleSettingChange('receive_daily_reading', e.target.checked ? 1 : 0)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    {profileData?.receive_daily_reading === 1 && (
                        <div className="setting-extra">
                            <label>{t('sendTime')}:</label>
                            <input
                                type="time"
                                className="time-picker-inline"
                                value={profileData?.notification_time || '09:00'}
                                onChange={(e) => handleSettingChange('notification_time', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <button className="back-home-btn" onClick={() => navigate('/')}>{t('backHome')}</button>

            <div className="lang-switcher-footer">
                <button className={`lang-btn-small ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
                <button className={`lang-btn-small ${lang === 'uk' ? 'active' : ''}`} onClick={() => setLang('uk')}>UA</button>
                <button className={`lang-btn-small ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
            </div>
        </div>
    );
};

export default Profile;
