import React from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';

interface UpgradePopupProps {
  onClose: () => void;
}

const APP_DOWNLOAD_URL = 'https://iunamiai.vercel.app/';

export default function UpgradePopup({ onClose }: UpgradePopupProps) {
  const handleDownload = () => {
    window.open(APP_DOWNLOAD_URL, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: 'var(--card-text-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Sparkles size={32} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--card-text)' }}>
            Workspace Limit Reached
          </h2>

          {/* Description */}
          <p className="text-[12px] mb-6 leading-relaxed" style={{ color: 'var(--card-text-muted)' }}>
            You've reached the maximum of 3 workspaces on the extension. Download our app for unlimited workspaces and the full experience.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] shadow-lg"
          >
            <ExternalLink size={16} />
            Download the App
          </button>

          {/* Secondary action */}
          <button
            onClick={onClose}
            className="mt-3 text-[11px] font-medium hover:underline"
            style={{ color: 'var(--card-text-muted)' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
