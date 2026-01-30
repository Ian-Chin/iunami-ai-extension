import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Database, Plus, ChevronDown, ChevronUp,
    RefreshCcw, Loader2, Trash2, Mic, Sparkles, Send
} from 'lucide-react';
import { CONFIG } from '../../config';

function NotionIcon({ icon, fallback: Fallback }: { icon: any, fallback: any }) {
    if (!icon) return <Fallback size={18} />;
    if (icon.type === 'emoji') return <span className="text-lg leading-none select-none">{icon.emoji}</span>;
    if (icon.type === 'external' || icon.type === 'file') {
        const url = icon.type === 'external' ? icon.external.url : icon.file.url;
        return <img src={url} className="w-5 h-5 object-contain rounded-md" alt="icon" />;
    }
    return <Fallback size={18} />;
}

interface AiParsedData {
    [key: string]: string;
}

export default function Dashboard({ onAddClick }: { onAddClick: () => void }) {
    const [dashboards, setDashboards] = useState<any[]>([]);

    const loadData = () => {
        chrome.storage.local.get(['allDashboards'], (res) => {
            setDashboards((res.allDashboards as any[]) || []);
        });
    };

    useEffect(() => { loadData(); }, []);

    const handleRemove = async (id: string) => {
        if (window.confirm("Remove this dashboard?")) {
            const updated = dashboards.filter(d => d.id !== id);
            await chrome.storage.local.set({ allDashboards: updated });
            setDashboards(updated);
        }
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 pb-20">
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
        </div>
    );
}

function DashboardItem({ dash, onRemove, onUpdateComplete }: { dash: any, onRemove: () => void, onUpdateComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeDbId, setActiveDbId] = useState<string | null>(null);
    const [magicText, setMagicText] = useState("");
    const [isMagicLoading, setIsMagicLoading] = useState(false);

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUpdating(true);
        chrome.storage.local.get(['notionToken', 'allDashboards'], async (res) => {
            try {
                const pageRes = await chrome.runtime.sendMessage({ type: 'NOTION_API_CALL', endpoint: `/pages/${dash.id}`, method: 'GET', token: res.notionToken });
                const childrenRes = await chrome.runtime.sendMessage({ type: 'NOTION_API_CALL', endpoint: `/blocks/${dash.id}/children`, method: 'GET', token: res.notionToken });
                if (pageRes.success && childrenRes.success) {
                    const pageData = pageRes.data;
                    const newDbs = childrenRes.data.results.filter((b: any) => b.type === 'child_database').map((db: any) => ({
                        id: db.id, title: db.child_database.title, icon: db.icon || null
                    }));
                    const updatedDashboards = (res.allDashboards as any[]).map(d =>
                        d.id === dash.id ? { ...d, name: pageData.properties.title?.title?.[0]?.plain_text || pageData.properties.Name?.title?.[0]?.plain_text || "Untitled", icon: pageData.icon, databases: newDbs } : d
                    );
                    await chrome.storage.local.set({ allDashboards: updatedDashboards });
                    onUpdateComplete();
                }
            } catch (err) { console.error(err); } finally { setIsUpdating(false); }
        });
    };



    const parseWithAI = async (userInput: string, schema: any): Promise<AiParsedData> => {
        const availableColumns = Object.keys(schema).join(", ");
        const now = new Date();
        const localDate = now.toLocaleDateString();
        const offsetMinutes = -now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60).toString().padStart(2, '0');
        const offsetMins = (Math.abs(offsetMinutes) % 60).toString().padStart(2, '0');
        const timezoneString = `${offsetMinutes >= 0 ? '+' : '-'}${offsetHours}:${offsetMins}`;

        const systemPrompt = `You are a Notion data parser. 
        Today is ${localDate}. The user's timezone is UTC${timezoneString}.
        Extract info for: ${availableColumns}.
        
        CRITICAL RULE FOR DATES:
        Return dates in ISO 8601 format WITH the timezone offset.
        Example for 4pm tomorrow: "2026-01-30T16:00:00${timezoneString}"
        
        Return ONLY JSON.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: CONFIG.AI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    };

const handleMagicSubmit = async (dbId: string) => {
    if (!magicText.trim()) return;

    setIsMagicLoading(true);

    chrome.storage.local.get(['notionToken'], async (res) => {
        try {
            // 1. Fetch the LATEST schema from Notion
            const schemaRes = await chrome.runtime.sendMessage({ 
                type: 'NOTION_API_CALL', 
                endpoint: `/databases/${dbId}`, 
                method: 'GET', 
                token: res.notionToken 
            });

            if (!schemaRes.success) throw new Error("Could not read database structure.");

            const fullSchema = schemaRes.data.properties;
            
            // 2. Filter out Read-Only columns (Formulas, Rollups)
            const writableSchema = Object.keys(fullSchema).reduce((acc: any, key) => {
                const prop = fullSchema[key];
                if (!['formula', 'rollup', 'created_time', 'last_edited_time'].includes(prop.type)) {
                    acc[key] = prop;
                }
                return acc;
            }, {});

            // 3. Send ONLY writable columns to AI
            const aiData = await parseWithAI(magicText, writableSchema);
            const notionProperties: any = {};

            Object.keys(aiData).forEach((aiKey) => {
                // Find matching column name (case insensitive)
                const actualKey = Object.keys(writableSchema).find(k => k.toLowerCase() === aiKey.toLowerCase());
                
                if (actualKey) {
                    const config = writableSchema[actualKey];
                    const val = aiData[aiKey];

                    // Smart Mapping based on Notion Type
                    switch (config.type) {
                        case 'title':
                            notionProperties[actualKey] = { title: [{ text: { content: val } }] };
                            break;
                        case 'date':
                            notionProperties[actualKey] = { date: { start: val } };
                            break;
                        case 'select':
                            notionProperties[actualKey] = { select: { name: val } };
                            break;
                        case 'multi_select':
                            // AI might return a string, we turn it into an array
                            const tags = Array.isArray(val) ? val : [val];
                            notionProperties[actualKey] = { multi_select: tags.map((t: string) => ({ name: t })) };
                            break;
                        case 'number':
                            notionProperties[actualKey] = { number: Number(val) };
                            break;
                        case 'checkbox':
                            notionProperties[actualKey] = { checkbox: Boolean(val) };
                            break;
                        case 'rich_text':
                            notionProperties[actualKey] = { rich_text: [{ text: { content: val } }] };
                            break;
                        case 'url':
                            notionProperties[actualKey] = { url: val };
                            break;
                        case 'email':
                            notionProperties[actualKey] = { email: val };
                            break;
                    }
                }
            });

            // 4. Create the page
            const createRes = await chrome.runtime.sendMessage({
                type: 'NOTION_API_CALL',
                endpoint: `/pages`,
                method: 'POST',
                token: res.notionToken,
                body: { 
                    parent: { database_id: dbId }, 
                    properties: notionProperties 
                }
            });

            if (createRes.success) {
                setMagicText("");
                setActiveDbId(null);
                // Optional: Show a success toast
            } else {
                throw new Error(createRes.error || "Failed to save to Notion");
            }

        } catch (err: any) { 
            alert(`Error: ${err.message}`); 
        } finally { 
            setIsMagicLoading(false); 
        }
    });
};

return (
        <div className={`border border-gray-200 rounded-[28px] overflow-hidden bg-white transition-all duration-300 ${isOpen ? 'shadow-lg ring-1 ring-black/5' : 'shadow-sm'}`}>
            {/* Header Section */}
            <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                        <NotionIcon icon={dash.icon} fallback={LayoutDashboard} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 tracking-tight leading-none mb-1">{dash.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium italic">{dash.databases.length} databases</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleUpdate} disabled={isUpdating} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                        <Trash2 size={16} />
                    </button>
                    <div className="ml-1 text-gray-300">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-5 space-y-3">
                    <div className="h-px bg-gray-100 mx-2 mb-2" />
                    {dash.databases.map((db: any) => (
                        <div key={db.id} className={`flex flex-col gap-3 p-3.5 rounded-2xl border transition-all ${activeDbId === db.id ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50/50 border-gray-100'}`}>
                            <div onClick={() => { setActiveDbId(activeDbId === db.id ? null : db.id); setMagicText(""); }} className="flex items-center gap-3 cursor-pointer group">
                                <div className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <NotionIcon icon={db.icon} fallback={Database} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 flex-1 group-hover:text-indigo-600 transition-colors">{db.title}</span>
                                {activeDbId === db.id ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-gray-300" />}
                            </div>

                            {activeDbId === db.id && (
                                <div className="space-y-4 mt-2 animate-in zoom-in-95">
                                    
                                    {/* MAGIC FILL SECTION */}
                                    <div className="relative space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-indigo-500">
                                                <Sparkles size={10} /><span className="text-[9px] font-black uppercase tracking-widest">Magic Fill</span>
                                            </div>
                                            {/* Recommended Badge */}
                                            <div className="bg-indigo-600 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm border border-white tracking-widest">
                                                Recommended
                                            </div>
                                        </div>
                                        
                                        <div className="relative">
                                            <textarea
                                                value={magicText}
                                                onChange={(e) => setMagicText(e.target.value)}
                                                className="w-full p-3 text-[11px] bg-white border border-indigo-200 rounded-xl outline-none min-h-15 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                placeholder="Try: 'Meeting tomorrow at 4pm'"
                                            />
                                            <button 
                                                onClick={() => handleMagicSubmit(db.id)} 
                                                className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
                                            >
                                                {isMagicLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* MANUAL ENTRY BUTTON */}
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => window.open(`https://www.notion.so/${db.id.replace(/-/g, '')}`, '_blank')}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl transition-colors active:scale-[0.98]"
                                        >
                                            <Plus size={14} />
                                            <span className="text-[11px] font-bold">Manual Entry</span>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}