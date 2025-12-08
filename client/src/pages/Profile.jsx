import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = ({ user, t, lang, setLang }) => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
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
        } else {
            // No user, stop loading (dev mode or error)
            setLoading(false);
        }
    }, [user]);

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

    return (
        <div className="profile">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.first_name?.[0] || '?'}
                </div>
                <div className="profile-info">
                    <h2>{user?.first_name} {user?.last_name}</h2>
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
