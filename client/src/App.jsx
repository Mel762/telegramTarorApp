import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import Home from './pages/Home';
import Reading from './pages/Reading';
import Profile from './pages/Profile';
import { translations } from './i18n/translations';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');

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

  // Register user with backend when user state is set
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
          console.log('User registered/fetched:', data);
        })
        .catch(err => console.error('Error registering user:', err));
    }
  }, [user]);

  const t = (key) => translations[lang][key] || translations['en'][key];

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home user={user} t={t} lang={lang} setLang={setLang} />} />
          <Route path="/reading" element={<Reading user={user} t={t} lang={lang} />} />
          <Route path="/profile" element={<Profile user={user} t={t} lang={lang} setLang={setLang} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
