import React, { useState, useEffect } from 'react';
import { Save, Loader2, Wifi, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import Tutorial from './Tutorial';

export default function Settings({ onComplete }: { onComplete: () => void }) {
    const [token, setToken] = useState('');
    const [dbIdInput, setDbIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: 'idle', msg: '' });
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(['notionToken'], (res) => {
            setToken((res.notionToken as string) || '');
        });
    }, []);

    // RECURSIVE SCANNER: This function looks inside columns, callouts, etc.
    const scanForDatabases = async (blockId: string, notionToken: string): Promise<any[]> => {
        const response = await chrome.runtime.sendMessage({
            type: 'NOTION_API_CALL',
            endpoint: `/blocks/${blockId}/children`,
            method: 'GET',
            token: notionToken
        });

        if (!response.success) return [];

        let foundDbs: any[] = [];
        const blocks = response.data.results;

        for (const block of blocks) {
            // 1. Check if it's a direct child database
            if (block.type === 'child_database') {
                foundDbs.push({
                    id: block.id,
                    title: block.child_database.title,
                    icon: block.icon || null
                });
            } 
            // 2. Check if it's a linked database
            else if (block.type === 'link_to_database') {
                // For linked DBs, we'd ideally fetch the source title, 
                // but for now, we'll flag it by its source ID
                foundDbs.push({
                    id: block.link_to_database.database_id,
                    title: "Linked Database", 
                    icon: block.icon || null
                });
            }
            // 3. RECURSE: If the block has children (columns, callouts, etc.), scan inside them
            else if (block.has_children) {
                const subDbs = await scanForDatabases(block.id, notionToken);
                foundDbs = [...foundDbs, ...subDbs];
            }
        }
        return foundDbs;
    };

    const handleConnect = async () => {
        if (!token || !dbIdInput) return;

        const match = dbIdInput.match(/[a-f0-9]{32}/);
        if (!match) {
            setStatus({ type: 'error', msg: 'Invalid Notion link or ID format.' });
            return;
        }
        const cleanId = match[0];

        setIsLoading(true);
        setStatus({ type: 'idle', msg: '' });

        try {
            const storage = await chrome.storage.local.get(['allDashboards']);
            const existingDashboards = (storage.allDashboards as any[]) || [];

            if (existingDashboards.some(d => d.id === cleanId)) {
                setStatus({ type: 'error', msg: 'Dashboard already exists!' });
                setIsLoading(false);
                return;
            }

            // Get Page Title & Metadata
            const pageRes = await chrome.runtime.sendMessage({
                type: 'NOTION_API_CALL',
                endpoint: `/pages/${cleanId}`,
                method: 'GET',
                token: token
            });

            if (!pageRes.success) {
                setStatus({ type: 'error', msg: 'Page not found. Did you invite your Integration?' });
                setIsLoading(false);
                return;
            }

            // Start the Recursive Scan
            
            const allDetectedDbs = await scanForDatabases(cleanId, token);

            // Remove duplicates (in case the same DB is linked twice)
            const uniqueDbs = Array.from(new Map(allDetectedDbs.map(db => [db.id, db])).values());

            if (uniqueDbs.length === 0) {
                setStatus({ type: 'error', msg: 'No databases found on this page.' });
                setIsLoading(false);
                return;
            }

            const pageData = pageRes.data;
            const titleObj = pageData.properties.title || pageData.properties.Name;
            const dashboardName = titleObj?.title?.[0]?.plain_text || "Untitled Dashboard";

            const newDashboard = {
                id: cleanId,
                name: dashboardName,
                icon: pageData.icon || null,
                databases: uniqueDbs
            };

            await chrome.storage.local.set({
                notionToken: token,
                allDashboards: [...existingDashboards, newDashboard]
            });

            setStatus({ type: 'success', msg: `Synced ${uniqueDbs.length} databases!` });
            setDbIdInput('');
            setTimeout(() => onComplete(), 1000);

        } catch (err) {
            setStatus({ type: 'error', msg: 'Sync failed. Check your connection.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (showTutorial) {
        return <Tutorial onBack={() => setShowTutorial(false)} />;
    }

    return (
        <div className="p-6 h-full flex flex-col gap-6" style={{ background: 'var(--card-bg)' }}>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--card-text)' }}>Add Workspace</h2>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: 'var(--card-text-muted)' }}>1. Secret Token</label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full mt-1.5 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        style={{ background: 'var(--input-bg)', color: 'var(--card-text)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--input-border)' }}
                        placeholder="secret_..."
                    />
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="inline-block mt-2 text-[11px] font-medium text-indigo-500 hover:text-indigo-600 hover:underline transition-colors"
                    >
                        How to create my token →
                    </button>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: 'var(--card-text-muted)' }}>2. Page Link</label>
                    <input
                        type="text"
                        value={dbIdInput}
                        onChange={(e) => setDbIdInput(e.target.value)}
                        className="w-full mt-1.5 p-3.5 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                        style={{
                            background: status.type === 'error' ? 'rgba(254, 202, 202, 0.3)' : 'var(--input-bg)',
                            color: 'var(--card-text)',
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: status.type === 'error' ? '#fca5a5' : 'var(--input-border)'
                        }}
                        placeholder="https://www.notion.so/..."
                    />
                </div>

                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                    style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)' }}
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Wifi size={20} />}
                    {isLoading ? 'Scanning Page...' : 'Sync Workspace'}
                </button>

                {status.msg && (
                    <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}