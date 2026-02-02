import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LayoutDashboard, Database, Plus, ChevronDown, ChevronUp,
    RefreshCcw, Loader2, Trash2, Sparkles, Send, CheckCircle, XCircle, ClipboardList
} from 'lucide-react';
import { CONFIG } from '../../config';
import type { NotionPropertySchema, PropertyValueMap } from '../types/notion';
import { parseSchema, buildNotionProperties, getUnsupportedFields, aiResponseToPropertyValueMap } from '../utils/notionPropertyMapper';
import { buildSystemPrompt } from '../utils/aiPromptBuilder';
import PreviewCard from './PreviewCard';
import ManualEntryForm from './ManualEntryForm';

function NotionIcon({ icon, fallback: Fallback }: { icon: any, fallback: any }) {
    if (!icon) return <Fallback size={18} />;
    if (icon.type === 'emoji') return <span className="text-lg leading-none select-none">{icon.emoji}</span>;
    if (icon.type === 'external' || icon.type === 'file') {
        const url = icon.type === 'external' ? icon.external.url : icon.file.url;
        return <img src={url} className="w-5 h-5 object-contain rounded-md" alt="icon" />;
    }
    return <Fallback size={18} />;
}

type LoadingStep = null | 'connecting' | 'thinking' | 'preview' | 'submitting';
type StatusMsg = { type: 'success' | 'error' | 'warning' | 'idle'; msg: string };

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
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--page-text-muted)' }}>Workspaces</h2>
                <button onClick={onAddClick} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--page-text-muted)' }}>
                    <Plus size={18} />
                </button>
            </div>

            {dashboards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutDashboard size={24} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--page-text)' }}>No workspaces yet</h3>
                    <p className="text-[11px] mb-5 max-w-50" style={{ color: 'var(--page-text-muted)' }}>Connect a Notion page to start using Magic Fill and Manual Entry.</p>
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-colors active:scale-[0.97]"
                    >
                        <Plus size={14} />
                        Add Workspace
                    </button>
                </div>
            ) : (
                dashboards.map((dash) => (
                    <DashboardItem
                        key={dash.id}
                        dash={dash}
                        onRemove={() => handleRemove(dash.id)}
                        onUpdateComplete={loadData}
                    />
                ))
            )}
        </div>
    );
}

interface SchemaCache {
    schemas: NotionPropertySchema[];
    rawProperties: Record<string, any>;
    skippedFields: string[];
}

function DashboardItem({ dash, onRemove, onUpdateComplete }: { dash: any, onRemove: () => void, onUpdateComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeDbId, setActiveDbId] = useState<string | null>(null);
    const [magicText, setMagicText] = useState("");
    const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
    const [statusMsg, setStatusMsg] = useState<StatusMsg>({ type: 'idle', msg: '' });

    // Preview state
    const [previewData, setPreviewData] = useState<PropertyValueMap | null>(null);
    const [previewSchemas, setPreviewSchemas] = useState<NotionPropertySchema[]>([]);
    const [previewSkipped, setPreviewSkipped] = useState<string[]>([]);
    const [previewDbId, setPreviewDbId] = useState<string | null>(null);

    // Manual entry state
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualSchemas, setManualSchemas] = useState<NotionPropertySchema[]>([]);
    const [manualSkipped, setManualSkipped] = useState<string[]>([]);
    const [manualDbId, setManualDbId] = useState<string | null>(null);

    // Schema cache per database
    const schemaCacheRef = useRef<Record<string, SchemaCache>>({});
    // Debounce ref for double-submit prevention
    const isSubmittingRef = useRef(false);

    const showStatus = useCallback((type: StatusMsg['type'], msg: string) => {
        setStatusMsg({ type, msg });
        if (type === 'success') {
            setTimeout(() => setStatusMsg({ type: 'idle', msg: '' }), 4000);
        }
    }, []);

    const fetchSchema = async (dbId: string, token: string): Promise<SchemaCache | null> => {
        if (schemaCacheRef.current[dbId]) return schemaCacheRef.current[dbId];

        const schemaRes = await chrome.runtime.sendMessage({
            type: 'NOTION_API_CALL',
            endpoint: `/databases/${dbId}`,
            method: 'GET',
            token,
        });

        if (!schemaRes.success) return null;

        const rawProperties = schemaRes.data.properties;
        const schemas = parseSchema(rawProperties);
        const skippedFields = getUnsupportedFields(rawProperties);
        const cache: SchemaCache = { schemas, rawProperties, skippedFields };
        schemaCacheRef.current[dbId] = cache;
        return cache;
    };

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

    const parseWithAI = async (userInput: string, schemas: NotionPropertySchema[]): Promise<Record<string, any>> => {
        const systemPrompt = buildSystemPrompt(schemas);

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

    const handleKeyDown = (e: React.KeyboardEvent, dbId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMagicSubmit(dbId);
        }
    };

    // Phase 1: Parse → Preview
    const handleMagicSubmit = async (dbId: string) => {
        if (!magicText.trim() || isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        setLoadingStep('connecting');
        setStatusMsg({ type: 'idle', msg: '' });

        const timeoutId = setTimeout(() => {
            setLoadingStep(null);
            isSubmittingRef.current = false;
            showStatus('error', 'Request timed out. Please try again.');
        }, 30000);

        chrome.storage.local.get(['notionToken'], async (res) => {
            try {
                const schemaCache = await fetchSchema(dbId, res.notionToken as string);
                if (!schemaCache) throw new Error("Connection lost.");

                setLoadingStep('thinking');

                const aiData = await parseWithAI(magicText, schemaCache.schemas);
                const valueMap = aiResponseToPropertyValueMap(aiData, schemaCache.schemas, schemaCache.rawProperties);

                setPreviewData(valueMap);
                setPreviewSchemas(schemaCache.schemas);
                setPreviewSkipped(schemaCache.skippedFields);
                setPreviewDbId(dbId);
                setLoadingStep('preview');

                if (schemaCache.skippedFields.length > 0) {
                    showStatus('warning', `Skipped: ${schemaCache.skippedFields.join(', ')}`);
                }
            } catch (err) {
                console.error("Magic Submit Error:", err);
                showStatus('error', 'Failed to parse. Please try again.');
                setLoadingStep(null);
            } finally {
                clearTimeout(timeoutId);
                isSubmittingRef.current = false;
            }
        });
    };

    // Phase 2: Confirm → Send to Notion
    const handleConfirmSubmit = async (editedValues: PropertyValueMap) => {
        if (!previewDbId || isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setLoadingStep('submitting');

        chrome.storage.local.get(['notionToken'], async (res) => {
            try {
                const notionProperties = buildNotionProperties(editedValues, previewSchemas);

                const finalRes = await chrome.runtime.sendMessage({
                    type: 'NOTION_API_CALL',
                    endpoint: `/pages`,
                    method: 'POST',
                    token: res.notionToken,
                    body: { parent: { database_id: previewDbId }, properties: notionProperties }
                });

                if (finalRes.success) {
                    setMagicText("");
                    setPreviewData(null);
                    setPreviewDbId(null);
                    setLoadingStep(null);
                    showStatus('success', 'Synced to Notion!');
                } else {
                    showStatus('error', finalRes.error || 'Failed to sync.');
                    setLoadingStep('preview');
                }
            } catch (err) {
                console.error("Confirm Submit Error:", err);
                showStatus('error', 'Failed to sync. Please try again.');
                setLoadingStep('preview');
            } finally {
                isSubmittingRef.current = false;
            }
        });
    };

    const handleCancelPreview = () => {
        setPreviewData(null);
        setPreviewDbId(null);
        setLoadingStep(null);
    };

    // Manual Entry handlers
    const handleOpenManualEntry = async (dbId: string) => {
        setLoadingStep('connecting');
        setStatusMsg({ type: 'idle', msg: '' });

        chrome.storage.local.get(['notionToken'], async (res) => {
            try {
                const schemaCache = await fetchSchema(dbId, res.notionToken as string);
                if (!schemaCache) throw new Error("Connection lost.");

                setManualSchemas(schemaCache.schemas);
                setManualSkipped(schemaCache.skippedFields);
                setManualDbId(dbId);
                setShowManualEntry(true);
                setLoadingStep(null);
            } catch (err) {
                console.error("Manual Entry Error:", err);
                showStatus('error', 'Failed to load schema.');
                setLoadingStep(null);
            }
        });
    };

    const handleManualSubmit = async (values: PropertyValueMap) => {
        if (!manualDbId || isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setLoadingStep('submitting');

        chrome.storage.local.get(['notionToken'], async (res) => {
            try {
                const notionProperties = buildNotionProperties(values, manualSchemas);

                const finalRes = await chrome.runtime.sendMessage({
                    type: 'NOTION_API_CALL',
                    endpoint: `/pages`,
                    method: 'POST',
                    token: res.notionToken,
                    body: { parent: { database_id: manualDbId }, properties: notionProperties }
                });

                if (finalRes.success) {
                    setShowManualEntry(false);
                    setManualDbId(null);
                    setLoadingStep(null);
                    showStatus('success', 'Synced to Notion!');
                } else {
                    showStatus('error', finalRes.error || 'Failed to sync.');
                    setLoadingStep(null);
                }
            } catch (err) {
                console.error("Manual Submit Error:", err);
                showStatus('error', 'Failed to sync. Please try again.');
                setLoadingStep(null);
            } finally {
                isSubmittingRef.current = false;
            }
        });
    };

    const handleCancelManual = () => {
        setShowManualEntry(false);
        setManualDbId(null);
        setLoadingStep(null);
    };

    const handleDbClick = (dbId: string) => {
        if (activeDbId === dbId) {
            setActiveDbId(null);
        } else {
            setActiveDbId(dbId);
        }
        setMagicText("");
        setPreviewData(null);
        setPreviewDbId(null);
        setShowManualEntry(false);
        setManualDbId(null);
        setLoadingStep(null);
        setStatusMsg({ type: 'idle', msg: '' });
    };

    const isLoading = loadingStep === 'connecting' || loadingStep === 'thinking' || loadingStep === 'submitting';

    const loadingLabel = (() => {
        switch (loadingStep) {
            case 'connecting': return 'Connecting to database...';
            case 'thinking': return 'AI is thinking...';
            case 'submitting': return 'Syncing to Notion...';
            default: return '';
        }
    })();

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
                            <div onClick={() => handleDbClick(db.id)} className="flex items-center gap-3 cursor-pointer group">
                                <div className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <NotionIcon icon={db.icon} fallback={Database} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 flex-1 group-hover:text-indigo-600 transition-colors">{db.title}</span>
                                {activeDbId === db.id ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-gray-300" />}
                            </div>

                            {activeDbId === db.id && (
                                <div className="space-y-4 mt-2 animate-in zoom-in-95">

                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="flex items-center gap-2 px-1">
                                            <Loader2 size={12} className="animate-spin text-indigo-500" />
                                            <span className="text-[10px] font-bold text-indigo-500">{loadingLabel}</span>
                                        </div>
                                    )}

                                    {/* Preview Card (shown after AI parsing) */}
                                    {previewData && previewDbId === db.id && (
                                        <PreviewCard
                                            values={previewData}
                                            schemas={previewSchemas}
                                            skippedFields={previewSkipped}
                                            onConfirm={handleConfirmSubmit}
                                            onCancel={handleCancelPreview}
                                            isSubmitting={loadingStep === 'submitting'}
                                        />
                                    )}

                                    {/* Manual Entry Form */}
                                    {showManualEntry && manualDbId === db.id && (
                                        <ManualEntryForm
                                            schemas={manualSchemas}
                                            skippedFields={manualSkipped}
                                            onSubmit={handleManualSubmit}
                                            onCancel={handleCancelManual}
                                            isSubmitting={loadingStep === 'submitting'}
                                        />
                                    )}

                                    {/* MAGIC FILL SECTION (hidden during preview/manual) */}
                                    {!previewData && !showManualEntry && !isLoading && (
                                        <>
                                            <div className="relative space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-indigo-500">
                                                        <Sparkles size={10} /><span className="text-[9px] font-black uppercase tracking-widest">Magic Fill</span>
                                                    </div>
                                                    <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                                                        Press Enter to Sync
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <textarea
                                                        value={magicText}
                                                        onChange={(e) => setMagicText(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, db.id)}
                                                        className="w-full p-3 text-[11px] bg-white border border-indigo-200 rounded-xl outline-none min-h-15 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                        placeholder="Try: 'Follow up with John tomorrow'"
                                                    />
                                                    <button
                                                        onClick={() => handleMagicSubmit(db.id)}
                                                        disabled={!magicText.trim()}
                                                        className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:active:scale-100"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* MANUAL ENTRY BUTTON */}
                                            <div className="pt-1">
                                                <button
                                                    onClick={() => handleOpenManualEntry(db.id)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl transition-colors active:scale-[0.98]"
                                                >
                                                    <ClipboardList size={14} />
                                                    <span className="text-[11px] font-bold">Manual Entry</span>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* Status message */}
                                    {statusMsg.type !== 'idle' && (
                                        <div className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${
                                            statusMsg.type === 'success' ? 'bg-green-50 text-green-600' :
                                            statusMsg.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {statusMsg.type === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {statusMsg.msg}
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
