import React, { useState, useEffect } from 'react';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard'; // Import your new Dashboard
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Check if user is already set up
  useEffect(() => {
    chrome.storage.local.get(['notionToken'], (res) => {
      if (!res.notionToken) {
        setShowSettings(true);
      } else {
        setHasConfig(true);
      }
    });
  }, []);

  // This function is what Settings calls when it's done
  const handleSetupComplete = () => {
    setHasConfig(true);
    setShowSettings(false);
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

        {/* Only show the toggle if the user has a config saved */}
        {hasConfig && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            {showSettings ? <ArrowLeft size={20} /> : <SettingsIcon size={20} />}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <main className="h-[calc(100vh-56px)] overflow-y-auto">
        {showSettings ? (
          <Settings onComplete={handleSetupComplete} />
        ) : (
          <Dashboard onAddClick={() => setShowSettings(true)} />
        )}
      </main>
    </div>
  );
}

export default App;