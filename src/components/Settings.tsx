import React, { useState, useEffect } from 'react';
import { Save, Loader2, Wifi, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings({ onComplete }: { onComplete: () => void }) {
    const [token, setToken] = useState('');
    const [dbIdInput, setDbIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: 'idle', msg: '' });

    useEffect(() => {
        chrome.storage.local.get(['notionToken'], (res) => {
            const savedToken = (res.notionToken as string) || '';
            setToken(savedToken);
        });
    }, []);

    const handleConnect = async () => {
        if (!token || !dbIdInput) return;
        setIsLoading(true);

        const match = dbIdInput.match(/[a-f0-9]{32}/);
        const cleanId = match ? match[0] : dbIdInput;

        try {
            const pageRes = await chrome.runtime.sendMessage({
                type: 'NOTION_API_CALL',
                endpoint: `/pages/${cleanId}`,
                method: 'GET',
                token: token
            });

            const childrenRes = await chrome.runtime.sendMessage({
                type: 'NOTION_API_CALL',
                endpoint: `/blocks/${cleanId}/children`,
                method: 'GET',
                token: token
            });

            if (pageRes.success && childrenRes.success) {
                const pageData = pageRes.data;
                const titleObj = pageData.properties.title || pageData.properties.Name;
                const dashboardName = titleObj?.title?.[0]?.plain_text || "Untitled Dashboard";
                
                // --- CAPTURE ICON ---
                const dashboardIcon = pageData.icon || null;

                const dbs = childrenRes.data.results
                    .filter((b: any) => b.type === 'child_database')
                    .map((db: any) => ({ 
                        id: db.id, 
                        title: db.child_database.title,
                        icon: db.icon || null // Capture individual database icons
                    }));

                chrome.storage.local.get(['allDashboards'], async (res) => {
                    const existingDashboards = (res.allDashboards as any[]) || [];
                    const isDuplicate = existingDashboards.some(d => d.id === cleanId);

                    if (!isDuplicate) {
                        const newDashboard = {
                            id: cleanId,
                            name: dashboardName,
                            icon: dashboardIcon, // Added this
                            databases: dbs
                        };

                        await chrome.storage.local.set({
                            notionToken: token,
                            allDashboards: [...existingDashboards, newDashboard]
                        });
                    }

                    setStatus({ type: 'success', msg: `Added ${dashboardName}!` });
                    setDbIdInput('');
                    setTimeout(() => onComplete(), 1000);
                });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Connection error.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white h-full flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add Dashboard</h2>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notion Token</label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full mt-1.5 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        placeholder="secret_..."
                    />
                </div>

                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dashboard URL</label>
                    <input
                        type="text"
                        value={dbIdInput}
                        onChange={(e) => setDbIdInput(e.target.value)}
                        className="w-full mt-1.5 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        placeholder="Paste Notion page link..."
                    />
                </div>

                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:bg-gray-400"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Wifi size={20} />}
                    {isLoading ? 'Connecting...' : 'Connect & Sync'}
                </button>

                {status.msg && (
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}