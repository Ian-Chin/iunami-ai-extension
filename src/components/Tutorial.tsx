import React from 'react';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TutorialProps {
    onBack: () => void;
}

export default function Tutorial({ onBack }: TutorialProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText('https://www.notion.so/my-integrations');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const steps = [
        {
            number: 1,
            title: 'Open Notion Integrations',
            description: 'Go to your Notion integrations page to create a new integration.',
            action: (
                <div className="flex gap-2 mt-3">
                    <a
                        href="https://www.notion.so/my-integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                        style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                    >
                        <ExternalLink size={14} />
                        Open Integrations
                    </a>
                    <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 border"
                        style={{ borderColor: 'var(--input-border)', color: 'var(--card-text)' }}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy URL'}
                    </button>
                </div>
            )
        },
        {
            number: 2,
            title: 'Create New Integration',
            description: 'Click "New integration" button. Give it a name like "Iunami" and select your workspace.',
        },
        {
            number: 3,
            title: 'Copy Your Secret Token',
            description: 'After creating, you\'ll see your "Internal Integration Secret". Click "Show" then copy it. It starts with "secret_".',
        },
        {
            number: 4,
            title: 'Connect to Your Notion Pages',
            description: 'In Notion, open the page you want to use. Click "..." menu → "Connect to" → Select your integration.',
        },
        {
            number: 5,
            title: 'Paste Token in Iunami',
            description: 'Come back here and paste your secret token in the field above. Then add your Notion page link!',
        }
    ];

    return (
        <div className="p-6 h-full flex flex-col gap-4" style={{ background: 'var(--card-bg)' }}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl transition-colors hover:opacity-70"
                    style={{ color: 'var(--card-text-muted)' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--card-text)' }}>
                    Create Your Notion Token
                </h2>
            </div>

            {/* Steps */}
            <div className="space-y-4 overflow-y-auto flex-1">
                {steps.map((step) => (
                    <div
                        key={step.number}
                        className="p-4 rounded-2xl border"
                        style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)' }}
                    >
                        <div className="flex gap-3">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                                style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                            >
                                {step.number}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm" style={{ color: 'var(--card-text)' }}>
                                    {step.title}
                                </h3>
                                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--card-text-muted)' }}>
                                    {step.description}
                                </p>
                                {step.action}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer tip */}
            <div
                className="p-3 rounded-xl text-xs text-center"
                style={{ background: 'var(--input-bg)', color: 'var(--card-text-muted)' }}
            >
                Need help? Make sure your integration has "Read content" permission enabled.
            </div>
        </div>
    );
}
