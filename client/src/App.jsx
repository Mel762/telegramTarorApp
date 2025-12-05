import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import Home from './pages/Home';
import Reading from './pages/Reading';
import Profile from './pages/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import { translations } from './i18n/translations';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const isFetchingRef = useRef(false);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const tgUser = WebApp.initDataUnsafe?.user;
    if (tgUser) {
      setUser(tgUser);
      // Detect language (Telegram returns 'en', 'ru', 'uk', etc.)
      const userLang = tgUser.language_code;
      if (['en', 'ru', 'uk'].includes(userLang)) {
        setLang(userLang);
      }
    } else {
      // If tgUser is not available, check if WebApp.initDataUnsafe exists at all
      if (WebApp.initDataUnsafe) {
        // Mock data for local testing within a Telegram context but without user data
        setUser({
          id: 12345,
          first_name: 'Local',
          last_name: 'Tester',
          username: 'localtester',
          language_code: 'en'
        });
      } else {
        // Fallback for browser testing without TG WebApp
        setUser({
          id: 12345,
          first_name: 'Browser',
          last_name: 'User',
          username: 'browseruser',
          language_code: 'en'
        });
      }
    }
  }, []);

  // Function to refresh user data from backend
  const refreshUser = () => {
    if (!user?.id || isFetchingRef.current) return;

    isFetchingRef.current = true;
    const query = new URLSearchParams({
      username: user.username || '',
      first_name: user.first_name || '',
      language_code: user.language_code || ''
    }).toString();

    fetch(`/api/user/${user.id}?${query}`)
      .then(res => res.json())
      .then(data => {
        console.log('User registered/fetched:', data);
        if (data.error) {
          console.error('Error fetching user:', data.error);
          return;
        }
        // Only update if we got valid data to prevent loops
        if (data.free_readings_one !== undefined) {
          setUser(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error('Error registering user:', err))
      .finally(() => {
        isFetchingRef.current = false;
      });
  };

  // Register user with backend when user state is set
  useEffect(() => {
    if (user?.id) {
      // Avoid re-fetching if we already have DB data (e.g., free_readings_one is defined)
      if (user.free_readings_one !== undefined) return;
      refreshUser();
    }
  }, [user]);

  const t = useCallback((key) => {
    if (!translations) return key;
    const langData = translations[lang] || translations['en'];
    if (!langData) return key;
    return langData[key] || translations['en']?.[key] || key;
  }, [lang]);

  console.log('App rendering, user:', user?.id, 'lang:', lang);

  return (
    <Router>
      <ErrorBoundary>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home user={user} t={t} lang={lang} setLang={setLang} refreshUser={refreshUser} />} />
            <Route path="/reading" element={<Reading user={user} t={t} lang={lang} refreshUser={refreshUser} />} />
            <Route path="/profile" element={<Profile user={user} t={t} lang={lang} setLang={setLang} />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
