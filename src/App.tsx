import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import MoreInfo from './components/More';
import SplashScreen from './components/SplashScreen';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';

function App() {
  const [view, setView] = useState('dashboard');
  const [hasConfig, setHasConfig] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [showSplash, setShowSplash] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['notionToken', 'themeColor', 'hasSeenSplash'], (res) => {
      // Check if user has seen splash screen
      setShowSplash(!res.hasSeenSplash);

      if (!res.notionToken) {
        setView('settings');
      } else {
        setHasConfig(true);
      }
      const theme = (res.themeColor as string) || 'white';
      setCurrentTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
    });

    const onStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.themeColor?.newValue) {
        const newTheme = changes.themeColor.newValue as string;
        setCurrentTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => chrome.storage.onChanged.removeListener(onStorageChange);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleSetupComplete = () => {
    setHasConfig(true);
    setView('dashboard');
  };

  // Don't render anything until we know splash state
  if (showSplash === null) {
    return null;
  }

  // Show splash screen for first-time users
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div
      className="w-100 min-h-screen border-l overflow-x-hidden"
      style={{ background: 'var(--page-bg)', color: 'var(--page-text)', borderColor: 'var(--header-border)' }}
    >
      {/* Navigation Header */}
      <div
        className="h-14 border-b flex items-center justify-between px-4 sticky top-0 z-10 backdrop-blur-sm"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="flex items-center gap-2">
          <img
            src={currentTheme === 'purple-dark' ? '/iunami-logo-light.png' : '/iunami-logo.png'}
            alt="Iunami AI Logo"
            className="w-25 h-25 rounded object-cover"
          />
        </div>

        {/* Right-Aligned Navigation Toggle */}
        {hasConfig && (
          <button
            onClick={() => setView(view === 'dashboard' ? 'more' : 'dashboard')}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ color: 'var(--page-text-muted)' }}
          >
            {view === 'dashboard' ? <SettingsIcon size={20} /> : <ArrowLeft size={20} />}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <main className="h-[calc(100vh-56px)] overflow-y-auto">
        {view === 'settings' && (
          <Settings onComplete={handleSetupComplete} />
        )}

        {view === 'more' && (
          <MoreInfo />
        )}

        {view === 'dashboard' && (
          <Dashboard onAddClick={() => setView('settings')} />
        )}
      </main>
    </div>
  );
}

export default App;
