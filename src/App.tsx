import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import MoreInfo from './components/More';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';

function App() {
  const [view, setView] = useState('dashboard');
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['notionToken'], (res) => {
      if (!res.notionToken) {
        setView('settings');
      } else {
        setHasConfig(true);
      }
    });
  }, []);

  const handleSetupComplete = () => {
    setHasConfig(true);
    setView('dashboard');
  };

  return (
    <div className="w-100 min-h-screen bg-gray-50 border-l border-gray-200 overflow-x-hidden">
      {/* Navigation Header */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img
            src="/iunami-logo.png"
            alt="Iunami AI Logo"
            className="w-25 h-25 rounded object-cover"
          />
        </div>

        {/* Right-Aligned Navigation Toggle */}
        {hasConfig && (
          <button
            onClick={() => setView(view === 'dashboard' ? 'more' : 'dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
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