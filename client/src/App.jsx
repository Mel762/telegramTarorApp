import ErrorBoundary from './components/ErrorBoundary';

// ... (existing imports)

function App() {
  // ... (existing state and useEffects)

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
