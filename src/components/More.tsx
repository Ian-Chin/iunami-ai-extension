import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Github, Globe, ArrowRight, MessageSquare, ChevronRight, Palette } from 'lucide-react';

const THEME_PRESETS = [
  {
    key: 'purple-dark',
    label: 'Purple Dark',
    gradient: 'linear-gradient(135deg, #1e1b4b, #2e1065)',
    ring: '#7c3aed',
  },
  {
    key: 'purple-white',
    label: 'Purple White',
    gradient: 'linear-gradient(135deg, #ede9fe, #e0e7ff, #ffffff)',
    ring: '#a78bfa',
  },
  {
    key: 'white',
    label: 'White',
    gradient: '#f9fafb',
    ring: '#d1d5db',
  },
] as const;

export default function MoreInfo() {
  const STORE_URL = "https://chromewebstore.google.com/detail/YOUR_EXTENSION_ID";
  const GITHUB_URL = "https://github.com/Ian-Chin";
  const WEBSITE_URL = "https://iunamiai.vercel.app/";

  const [activeTheme, setActiveTheme] = useState('white');

  useEffect(() => {
    chrome.storage.local.get(['themeColor'], (res) => {
      setActiveTheme((res.themeColor as string) || 'white');
    });
  }, []);

  const handleThemeChange = (key: string) => {
    setActiveTheme(key);
    chrome.storage.local.set({ themeColor: key });
  };

  return (
    <div className="px-6 pb-8 space-y-4">
      <hr className="my-6" style={{ borderColor: 'var(--header-border)' }} />

      {/* Mobile Announcement Card */}
      <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
        <Sparkles className="absolute -right-2 -top-2 opacity-20 group-hover:rotate-12 transition-transform" size={80} />

        <div className="relative z-10">
          <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">Coming Soon</span>
          <h3 className="text-lg font-bold mt-2">Iunami is coming to Mobile</h3>
          <ul className="text-white/80 text-xs mt-2 leading-relaxed space-y-1 list-disc list-inside">
            <li>Voice Assistant</li>
            <li>Smart Reminders</li>
            <li>Better AI Brain</li>
            <li>All Extension Features</li>
            <li>Frequent Updates</li>
          </ul>
          <button className="mt-4 flex items-center gap-2 text-[11px] font-bold bg-white text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
            Get Notified <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Review Button */}
      <a
        href={STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl hover:shadow-md transition-all group"
        style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 p-2 rounded-xl text-yellow-500">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--card-text)' }}>Rate iunami</p>
            <p className="text-[11px] font-medium" style={{ color: 'var(--card-text-muted)' }}>Support us on the Web Store</p>
          </div>
        </div>
        <MessageSquare size={18} style={{ color: 'var(--card-text-muted)' }} className="group-hover:text-indigo-400 transition-colors" />
      </a>
      <div className="space-y-3">
        <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl transition-all group"
        style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--hover-bg)', color: 'var(--card-text)' }}>
            <Github size={18} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--card-text)' }}>iunami Creator</p>
            <p className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: 'var(--card-text-muted)' }}>View on GitHub</p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--card-text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
      </a>

      {/* Official Website */}
      <a
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 rounded-2xl transition-all group"
        style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
            <Globe size={18} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--card-text)' }}>Official Website</p>
            <p className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: 'var(--card-text-muted)' }}>Learn more at iunami.ai</p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--card-text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
      </a>
      </div>

      {/* Theme Picker — at the bottom */}
      <div className="rounded-2xl p-4 mt-2" style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} style={{ color: 'var(--card-text-muted)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--card-text)' }}>Theme</span>
        </div>
        <div className="flex gap-3 justify-center">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleThemeChange(preset.key)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-12 h-12 rounded-2xl border-2 transition-all ${
                  activeTheme === preset.key
                    ? 'scale-110 shadow-md'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{
                  background: preset.gradient,
                  borderColor: activeTheme === preset.key ? preset.ring : 'transparent',
                }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: activeTheme === preset.key ? 'var(--card-text)' : 'var(--card-text-muted)' }}
              >
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
