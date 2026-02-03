import React, { useState } from 'react';
import { Sparkles, Zap, Brain, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleGetStarted = () => {
    setIsExiting(true);
    setTimeout(() => {
      chrome.storage.local.set({ hasSeenSplash: true });
      onComplete();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-700"
      style={{
        background: isExiting
          ? 'linear-gradient(160deg, #1e1b4b, #2e1065, #4c1d95, #1e1b4b)'
          : '#ffffff',
        opacity: isExiting ? 0 : 1,
      }}
    >
      {/* Animated background elements - only visible when exiting */}
      <div className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${isExiting ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-violet-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center px-8 transition-all duration-500 ${
        isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Logo animation */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-3xl blur-xl scale-150 animate-pulse transition-colors duration-500 ${
            isExiting ? 'bg-white/10' : 'bg-indigo-500/10'
          }`} />
          <img
            src="/iunami-transparent.png"
            alt="Iunami"
            className="w-24 h-24 relative z-10 drop-shadow-2xl animate-in zoom-in duration-700"
          />
        </div>


        <p
          className="text-gray-500 text-xs font-medium tracking-wider uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: '300ms' }}
        >
          Your AI-Powered Notion Assistant
        </p>

        {/* Feature highlights */}
        <div className="space-y-3 mb-10 w-full max-w-xs">
          <FeatureItem
            icon={<Sparkles size={16} />}
            title="Magic Fill"
            description="Type naturally, let AI structure it"
            delay="400ms"
          />
          <FeatureItem
            icon={<Zap size={16} />}
            title="Instant Sync"
            description="Push directly to your Notion databases"
            delay="500ms"
          />
          <FeatureItem
            icon={<Brain size={16} />}
            title="Smart Parsing"
            description="AI understands dates, tags, and more"
            delay="600ms"
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          className="group flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-2xl hover:scale-105 active:scale-100 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: '700ms' }}
        >
          Get Started
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Version */}
        <p
          className="text-gray-300 text-[10px] font-medium mt-6 animate-in fade-in duration-700"
          style={{ animationDelay: '800ms' }}
        >
          v1.0.0
        </p>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: delay }}
    >
      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-800 text-xs font-bold">{title}</h3>
        <p className="text-gray-400 text-[10px]">{description}</p>
      </div>
    </div>
  );
}
