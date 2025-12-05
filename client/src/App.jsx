import ErrorBoundary from './components/ErrorBoundary';
import React, { useCallback } from 'react'; // Added React and useCallback import

// ... (existing imports)

function App() {
  // ... (existing state and useEffects)
  // Assuming 'translations' and 'lang' are defined here, e.g., via useState or useContext
  const t = useCallback((key) => {
    // Assuming 'translations' is available in this scope
    if (!translations) return key;
    const langData = translations[lang] || translations['en'];
    if (!langData) return key;
    return langData[key] || translations['en']?.[key] || key;
  }, [lang]);

  const isFetchingRef = React.useRef(false);

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
