import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Plus, ChevronDown, ChevronUp, RefreshCcw, Loader2, Trash2 } from 'lucide-react';

// Helper Component to handle Notion's complex icon logic
function NotionIcon({ icon, fallback: Fallback }: { icon: any, fallback: any }) {
    if (!icon) return <Fallback size={18} />;

    if (icon.type === 'emoji') {
        return <span className="text-lg leading-none select-none">{icon.emoji}</span>;
    }

    if (icon.type === 'external' || icon.type === 'file') {
        const url = icon.type === 'external' ? icon.external.url : icon.file.url;
        return <img src={url} className="w-5 h-5 object-contain rounded-md" alt="icon" />;
    }

    return <Fallback size={18} />;
}

export default function Dashboard({ onAddClick }: { onAddClick: () => void }) {
    const [dashboards, setDashboards] = useState<any[]>([]);

    const loadData = () => {
        chrome.storage.local.get(['allDashboards'], (res) => {
            setDashboards((res.allDashboards as any[]) || []);
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRemove = async (id: string) => {
        if (window.confirm("Are you sure you want to remove this dashboard?")) {
            const updated = dashboards.filter(d => d.id !== id);
            await chrome.storage.local.set({ allDashboards: updated });
            setDashboards(updated);
        }
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Workspaces</h2>
                <button onClick={onAddClick} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                    <Plus size={18} />
                </button>
            </div>

            {dashboards.map((dash) => (
                <DashboardItem 
                    key={dash.id} 
                    dash={dash} 
                    onRemove={() => handleRemove(dash.id)} 
                    onUpdateComplete={loadData}
                />
            ))}

            {dashboards.length === 0 && (
                <button 
                    onClick={onAddClick} 
                    className="w-full py-12 border-2 border-dashed border-gray-200 rounded-4x1 text-gray-400 text-sm italic hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center gap-2"
                >
                    <Plus size={24} className="opacity-20" /> 
                    Add your first dashboard
                </button>
            )}
        </div>
    );
}

function DashboardItem({ dash, onRemove, onUpdateComplete }: { dash: any, onRemove: () => void, onUpdateComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUpdating(true);

        chrome.storage.local.get(['notionToken', 'allDashboards'], async (res) => {
            try {
                const pageRes = await chrome.runtime.sendMessage({
                    type: 'NOTION_API_CALL',
                    endpoint: `/pages/${dash.id}`,
                    method: 'GET',
                    token: res.notionToken
                });

                const childrenRes = await chrome.runtime.sendMessage({
                    type: 'NOTION_API_CALL',
                    endpoint: `/blocks/${dash.id}/children`,
                    method: 'GET',
                    token: res.notionToken
                });

                if (pageRes.success && childrenRes.success) {
                    const pageData = pageRes.data;
                    const titleObj = pageData.properties.title || pageData.properties.Name;
                    const newName = titleObj?.title?.[0]?.plain_text || "Untitled Dashboard";
                    const newIcon = pageData.icon || null;
                    
                    const newDbs = childrenRes.data.results
                        .filter((b: any) => b.type === 'child_database')
                        .map((db: any) => ({ 
                            id: db.id, 
                            title: db.child_database.title,
                            icon: db.icon || null 
                        }));

                    const allDashboards = (res.allDashboards as any[]) || [];
                    const updatedDashboards = allDashboards.map(d => 
                        d.id === dash.id ? { ...d, name: newName, icon: newIcon, databases: newDbs } : d
                    );

                    await chrome.storage.local.set({ allDashboards: updatedDashboards });
                    onUpdateComplete();
                }
            } catch (err) {
                console.error("Sync failed", err);
            } finally {
                setIsUpdating(false);
            }
        });
    };

    return (
        <div className={`border border-gray-200 rounded-[28px] overflow-hidden bg-white transition-all duration-300 ${isOpen ? 'shadow-lg ring-1 ring-black/5' : 'shadow-sm'}`}>
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                        <NotionIcon icon={dash.icon} fallback={LayoutDashboard} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 tracking-tight leading-none mb-1">{dash.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium italic">{dash.databases.length} databases</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="ml-1 text-gray-300">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-5 space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="h-px bg-gray-100 mx-2 mb-4" />
                    {dash.databases.length > 0 ? (
                        dash.databases.map((db: any) => (
                            <div key={db.id} className="flex items-center gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-white transition-all group">
                                <div className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center">
                                    <NotionIcon icon={db.icon} fallback={Database} />
                                </div>
                                <span className="text-xs font-bold text-gray-600">{db.title}</span>
                            </div>
                        ))
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-xs text-gray-400 italic">No databases detected.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}