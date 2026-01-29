import React from 'react';
import { Sparkles, Star, Github, Globe, ExternalLink, ArrowRight, MessageSquare, ChevronRight } from 'lucide-react';

export default function MoreInfo() {
  const STORE_URL = "https://chromewebstore.google.com/detail/YOUR_EXTENSION_ID";
  const GITHUB_URL = "https://github.com/Ian-Chin";
  const WEBSITE_URL = "https://iunamiai.vercel.app/";

  return (
    <div className="px-6 pb-8 space-y-4">
      <hr className="border-gray-100 my-6" />
      
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
        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-yellow-50 p-2 rounded-xl text-yellow-500">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Rate iunami</p>
            <p className="text-[11px] text-gray-400 font-medium">Support us on the Web Store</p>
          </div>
        </div>
        <MessageSquare size={18} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
      </a>
      <div className="space-y-3">
        <a 
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
            <Github size={18} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">iunami Creator</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">View on GitHub</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
      </a>

      {/* Official Website */}
      <a 
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
            <Globe size={18} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Official Website</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Learn more at iunami.ai</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
      </a>
      </div>
    </div>
  );
}