import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LayoutDashboard, Database, Plus, ChevronDown, ChevronUp,
    RefreshCcw, Loader2, Trash2, CheckCircle, XCircle, ClipboardList
} from 'lucide-react';
import type { NotionPropertySchema, PropertyValueMap } from '../types/notion';
import { parseSchema, buildNotionProperties, getUnsupportedFields } from '../utils/notionPropertyMapper';
import ManualEntryForm from './ManualEntryForm';
import FeedbackPopup from './UpgradePopup';

const FEEDBACK_THRESHOLD = 3;

function NotionIcon({ icon, fallback: Fallback }: { icon: any, fallback: any }) {
    if (!icon) return <Fallback size={18} />;
    if (icon.type === 'emoji') return <span className="text-lg leading-none select-none">{icon.emoji}</span>;
    if (icon.type === 'external' || icon.type === 'file') {
        const url = icon.type === 'external' ? icon.external.url : icon.file.url;
        return <img src={url} className="w-5 h-5 object-contain rounded-md" alt="icon" />;
    }
    return <Fallback size={18} />;
}

type LoadingStep = null | 'connecting' | 'submitting';
type StatusMsg = { type: 'success' | 'error' | 'warning' | 'idle'; msg: string };

export default function Dashboard({ onAddClick }: { onAddClick: () => void }) {
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [showUpgradePopup, setShowUpgradePopup] = useState(false);

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

    const handleAddClick = () => {
        if (dashboards.length >= FEEDBACK_THRESHOLD) {
            setShowUpgradePopup(true);
        } else {
            onAddClick();
        }
    };

    const handleContinueAdd = () => {
        setShowUpgradePopup(false);
        onAddClick();
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--page-text-muted)' }}>Workspaces</h2>
                <button onClick={handleAddClick} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--page-text-muted)' }}>
                    <Plus size={18} />
                </button>
            </div>

            {dashboards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutDashboard size={24} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--page-text)' }}>No workspaces yet</h3>
                    <p className="text-[11px] mb-5 max-w-50" style={{ color: 'var(--page-text-muted)' }}>Connect a Notion page to start using Manual Entry.</p>
                    <button
                        onClick={handleAddClick}
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

            {showUpgradePopup && (
                <FeedbackPopup
                    onClose={() => setShowUpgradePopup(false)}
                    onContinue={handleContinueAdd}
                />
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
    const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
    const [statusMsg, setStatusMsg] = useState<StatusMsg>({ type: 'idle', msg: '' });

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

    // Recursive scanner to find databases inside columns, callouts, etc.
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
            if (block.type === 'child_database') {
                foundDbs.push({
                    id: block.id,
                    title: block.child_database.title,
                    icon: block.icon || null
                });
            } else if (block.type === 'link_to_database') {
                foundDbs.push({
                    id: block.link_to_database.database_id,
                    title: "Linked Database",
                    icon: block.icon || null
                });
            } else if (block.has_children) {
                const subDbs = await scanForDatabases(block.id, notionToken);
                foundDbs = [...foundDbs, ...subDbs];
            }
        }
        return foundDbs;
    };

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUpdating(true);
        chrome.storage.local.get(['notionToken', 'allDashboards'], async (res) => {
            try {
                const pageRes = await chrome.runtime.sendMessage({ type: 'NOTION_API_CALL', endpoint: `/pages/${dash.id}`, method: 'GET', token: res.notionToken });
                if (!pageRes.success) {
                    console.error('Failed to fetch page');
                    setIsUpdating(false);
                    return;
                }

                const pageData = pageRes.data;
                const allDetectedDbs = await scanForDatabases(dash.id, res.notionToken as string);
                const uniqueDbs = Array.from(new Map(allDetectedDbs.map(db => [db.id, db])).values());

                const updatedDashboards = (res.allDashboards as any[]).map(d =>
                    d.id === dash.id ? { ...d, name: pageData.properties.title?.title?.[0]?.plain_text || pageData.properties.Name?.title?.[0]?.plain_text || "Untitled", icon: pageData.icon, databases: uniqueDbs } : d
                );
                await chrome.storage.local.set({ allDashboards: updatedDashboards });
                onUpdateComplete();
            } catch (err) { console.error(err); } finally { setIsUpdating(false); }
        });
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
        setShowManualEntry(false);
        setManualDbId(null);
        setLoadingStep(null);
        setStatusMsg({ type: 'idle', msg: '' });
    };

    const isLoading = loadingStep === 'connecting' || loadingStep === 'submitting';

    const loadingLabel = (() => {
        switch (loadingStep) {
            case 'connecting': return 'Connecting to database...';
            case 'submitting': return 'Syncing to Notion...';
            default: return '';
        }
    })();

    return (
        <div
            className={`rounded-[28px] overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg' : 'shadow-sm'}`}
            style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
        >
            {/* Header Section */}
            <div onClick={() => setIsOpen(!isOpen)} className="p-4 flex items-center justify-between cursor-pointer" style={{ background: 'var(--hover-bg)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--input-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--input-border)' }}>
                        <NotionIcon icon={dash.icon} fallback={LayoutDashboard} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-tight leading-none mb-1" style={{ color: 'var(--card-text)' }}>{dash.name}</span>
                        <span className="text-[10px] font-medium italic" style={{ color: 'var(--card-text-muted)' }}>{dash.databases.length} databases</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleUpdate} disabled={isUpdating} className="p-2 hover:text-indigo-600 rounded-lg" style={{ color: 'var(--card-text-muted)' }}>
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 hover:text-red-500 rounded-lg" style={{ color: 'var(--card-text-muted)' }}>
                        <Trash2 size={16} />
                    </button>
                    <div className="ml-1" style={{ color: 'var(--card-text-muted)' }}>{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-5 space-y-3">
                    <div className="h-px mx-2 mb-2" style={{ background: 'var(--divider)' }} />
                    {dash.databases.map((db: any) => (
                        <div
                            key={db.id}
                            className="flex flex-col gap-3 p-3.5 rounded-2xl transition-all"
                            style={{
                                background: activeDbId === db.id ? 'var(--hover-bg)' : 'var(--input-bg)',
                                borderWidth: 1,
                                borderStyle: 'solid',
                                borderColor: activeDbId === db.id ? 'var(--card-border)' : 'var(--input-border)'
                            }}
                        >
                            <div onClick={() => handleDbClick(db.id)} className="flex items-center gap-3 cursor-pointer group">
                                <div className="p-1.5 rounded-lg shadow-sm" style={{ background: 'var(--card-bg)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--input-border)' }}>
                                    <NotionIcon icon={db.icon} fallback={Database} />
                                </div>
                                <span className="text-xs font-bold flex-1 group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--card-text)' }}>{db.title}</span>
                                {activeDbId === db.id ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} style={{ color: 'var(--card-text-muted)' }} />}
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

                                    {/* MANUAL ENTRY BUTTON */}
                                    {!showManualEntry && !isLoading && (
                                        <div className="pt-1">
                                            <button
                                                onClick={() => handleOpenManualEntry(db.id)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors active:scale-[0.98]"
                                                style={{ background: 'var(--card-bg)', color: 'var(--card-text-muted)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--card-border)' }}
                                            >
                                                <ClipboardList size={14} />
                                                <span className="text-[11px] font-bold">Manual Entry</span>
                                            </button>
                                        </div>
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
