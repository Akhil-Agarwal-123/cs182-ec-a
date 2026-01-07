import React, {useEffect, useMemo, useState} from 'react';
import {Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis} from 'recharts';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ExternalLink,
    FileText,
    Filter,
    Info,
    LayoutDashboard,
    List,
    Maximize2,
    MessageSquare,
    Plus,
    Search,
    Trash2
} from 'lucide-react';

// Import local data
import rawData from './data/posts.json';
import hwArenaData from './data/hw_arena.json';
import modelAnalysisData from './data/model_analysis.json';

const HW_PDFS = {
    0: "/pdfs/hw0.pdf",
    1: "/pdfs/hw1.pdf",
    2: "/pdfs/hw2.pdf",
    3: "/pdfs/hw3.pdf",
    4: "/pdfs/hw4.pdf",
    5: "/pdfs/hw5.pdf",
    6: "/pdfs/hw6.pdf",
    7: "/pdfs/hw7.pdf",
    8: "/pdfs/hw8.pdf",
    9: "/pdfs/hw9.pdf",
    10: "/pdfs/hw10.pdf",
    11: "/pdfs/hw11.pdf",
    12: "/pdfs/hw12.pdf",
    13: "/pdfs/hw13.pdf",
};

/* -------------------------------------------------------------------------- */
/* HW Arena Utilities                                */
/* -------------------------------------------------------------------------- */

const HW_ARENA_CLIENT_ID_KEY = 'hwArenaClientIdV1';
const HW_ARENA_VOTES_KEY = 'hwArenaVotesV1';

const safeJsonParse = (value, fallback) => {
    try {
        if (!value) return fallback;
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const getOrCreateArenaClientId = () => {
    if (typeof window === 'undefined') return null;
    const existing = window.localStorage.getItem(HW_ARENA_CLIENT_ID_KEY);
    if (existing) return existing;
    const clientId = `c_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    window.localStorage.setItem(HW_ARENA_CLIENT_ID_KEY, clientId);
    return clientId;
};

const canonicalPairKey = (a, b) => {
    if (!a || !b) return '';
    return [a, b].slice().sort((x, y) => x.localeCompare(y)).join('::');
};

const voteStorageKey = ({hw, modelA, modelB}) => `${hw}::${canonicalPairKey(modelA, modelB)}`;

const computeLeaderboardFromVotes = (votesByKey, hwFilter = 'All') => {
    const records = {};
    const applyResult = (winner, modelA, modelB) => {
        if (!records[modelA]) records[modelA] = {w: 0, l: 0, t: 0};
        if (!records[modelB]) records[modelB] = {w: 0, l: 0, t: 0};
        if (winner === 'A') {
            records[modelA].w += 1;
            records[modelB].l += 1;
        } else if (winner === 'B') {
            records[modelB].w += 1;
            records[modelA].l += 1;
        } else if (winner === 'T') {
            records[modelA].t += 1;
            records[modelB].t += 1;
        }
    };

    for (const [key, vote] of Object.entries(votesByKey || {})) {
        if (!vote) continue;
        if (hwFilter !== 'All' && vote.hw?.toString() !== hwFilter?.toString()) continue;
        if (!vote.modelA || !vote.modelB || !vote.winner) continue;
        applyResult(vote.winner, vote.modelA, vote.modelB);
    }

    return records;
};

/* -------------------------------------------------------------------------- */
/* Theme Logic                                 */
/* -------------------------------------------------------------------------- */

const getModelTheme = (modelName) => {
    const normalized = modelName ? modelName.toLowerCase() : '';

    // Greens & Teals (GPT, Gemma)
    if (normalized.includes('gpt')) return {
        name: 'emerald',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        borderTop: 'border-emerald-500',
        titleText: 'text-emerald-700',
        barFill: '#10b981',
        hover: 'hover:bg-emerald-50 hover:border-emerald-300'
    };
    if (normalized.includes('gemma')) return {
        name: 'teal',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        badgeBorder: 'border-teal-200',
        borderTop: 'border-teal-500',
        titleText: 'text-teal-700',
        barFill: '#14b8a6',
        hover: 'hover:bg-teal-50 hover:border-teal-300'
    };

    // Blues (Gemini, Llama, Perplexity, Deepseek)
    if (normalized.includes('gemini')) return {
        name: 'blue',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        borderTop: 'border-blue-500',
        titleText: 'text-blue-700',
        barFill: '#3b82f6',
        hover: 'hover:bg-blue-50 hover:border-blue-300'
    };
    if (normalized.includes('llama')) return {
        name: 'sky',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-700',
        badgeBorder: 'border-sky-200',
        borderTop: 'border-sky-500',
        titleText: 'text-sky-700',
        barFill: '#0ea5e9',
        hover: 'hover:bg-sky-50 hover:border-sky-300'
    };
    if (normalized.includes('perplexity')) return {
        name: 'cyan',
        badgeBg: 'bg-cyan-100',
        badgeText: 'text-cyan-700',
        badgeBorder: 'border-cyan-200',
        borderTop: 'border-cyan-500',
        titleText: 'text-cyan-700',
        barFill: '#06b6d4',
        hover: 'hover:bg-cyan-50 hover:border-cyan-300'
    };
    if (normalized.includes('deepseek')) return {
        name: 'indigo',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
        borderTop: 'border-indigo-500',
        titleText: 'text-indigo-700',
        barFill: '#6366f1',
        hover: 'hover:bg-indigo-50 hover:border-indigo-300'
    };

    // Purples & Pinks (Qwen, Mistral)
    if (normalized.includes('qwen')) return {
        name: 'violet',
        badgeBg: 'bg-violet-100',
        badgeText: 'text-violet-700',
        badgeBorder: 'border-violet-200',
        borderTop: 'border-violet-500',
        titleText: 'text-violet-700',
        barFill: '#8b5cf6',
        hover: 'hover:bg-violet-50 hover:border-violet-300'
    };
    if (normalized.includes('mistral')) return {
        name: 'fuchsia',
        badgeBg: 'bg-fuchsia-100',
        badgeText: 'text-fuchsia-700',
        badgeBorder: 'border-fuchsia-200',
        borderTop: 'border-fuchsia-500',
        titleText: 'text-fuchsia-700',
        barFill: '#d946ef',
        hover: 'hover:bg-fuchsia-50 hover:border-fuchsia-300'
    };

    // Warm Colors (Claude, Kimi)
    if (normalized.includes('claude')) return {
        name: 'amber',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        borderTop: 'border-amber-500',
        titleText: 'text-amber-700',
        barFill: '#f59e0b',
        hover: 'hover:bg-amber-50 hover:border-amber-300'
    };
    if (normalized.includes('kimi')) return {
        name: 'rose',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        borderTop: 'border-rose-500',
        titleText: 'text-rose-700',
        barFill: '#f43f5e',
        hover: 'hover:bg-rose-50 hover:border-rose-300'
    };

    // Grays (Grok)
    if (normalized.includes('grok')) return {
        name: 'slate',
        badgeBg: 'bg-slate-200',
        badgeText: 'text-slate-800',
        badgeBorder: 'border-slate-300',
        borderTop: 'border-slate-600',
        titleText: 'text-slate-800',
        barFill: '#475569',
        hover: 'hover:bg-slate-200 hover:border-slate-400'
    };

    // Fallback
    return {
        name: 'slate',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
        borderTop: 'border-slate-500',
        titleText: 'text-slate-700',
        barFill: '#64748b',
        hover: 'hover:bg-slate-100 hover:border-slate-300'
    };
};

/* -------------------------------------------------------------------------- */
/* Helper Components                               */
/* -------------------------------------------------------------------------- */

const Card = ({children, className = ""}) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const Badge = ({children, theme}) => (
    <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/* Content Parsing                                 */
/* -------------------------------------------------------------------------- */

/**
 * Parses XML-formatted strings from the LLM output.
 * Handles custom tags for files, formatting, and attachments.
 */
const ContentRenderer = ({xmlContent}) => {
    if (!xmlContent) return null;

    // Extract Files/PDFs
    const fileRegex = /<file url="([^"]+)"\s*(?:filename="([^"]+)")?\s*\/>/g;
    const files = [];
    let fileMatch;
    while ((fileMatch = fileRegex.exec(xmlContent)) !== null) {
        files.push({url: fileMatch[1], name: fileMatch[2] || 'Document'});
    }

    // Transform XML tags to HTML
    let formattedText = xmlContent
        .replace(/<file[^>]*\/>/g, '')
        .replace(/<paragraph>/g, '<p class="mb-3 leading-relaxed">')
        .replace(/<\/paragraph>/g, '</p>')
        .replace(/<break\/>/g, '<br/>')
        .replace(/<list style="unordered">/g, '<ul class="list-disc pl-5 mb-3 space-y-1">')
        .replace(/<list style="ordered">/g, '<ol class="list-decimal pl-5 mb-3 space-y-1">')
        .replace(/<\/list>/g, '</ul>')
        .replace(/<list-item>/g, '<li>')
        .replace(/<\/list-item>/g, '</li>')
        .replace(/<bold>/g, '<strong>')
        .replace(/<\/bold>/g, '</strong>')
        .replace(/<italic>/g, '<em>')
        .replace(/<\/italic>/g, '</em>')
        .replace(/<underline>/g, '<u>')
        .replace(/<\/underline>/g, '</u>')
        .replace(/<link href="([^"]+)">/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">')
        .replace(/<\/link>/g, '</a>')
        .replace(/<document[^>]*>/g, '')
        .replace(/<\/document>/g, '');

    return (
        <div className="text-slate-800 text-sm font-sans">
            <div dangerouslySetInnerHTML={{__html: formattedText}}/>

            {/* Attachment Preview Section */}
            {files.length > 0 && (
                <div className="mt-4 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</div>
                    <div className="grid grid-cols-1 gap-4">
                        {files.map((file, idx) => {
                            // Check for .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx
                            const isViewableDoc = /\.(pdf|docx?|pptx?|xlsx?)$/i.test(file.name) ||
                                /\.(pdf|docx?|pptx?|xlsx?)$/i.test(file.url);

                            const viewerUrl = isViewableDoc
                                ? `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`
                                : file.url;

                            return (
                                <div key={idx} className="border rounded-lg overflow-hidden bg-slate-50 flex flex-col">
                                    <div className="px-3 py-2 bg-white border-b flex items-center justify-between">
                                        <div
                                            className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate">
                                            <FileText className="w-4 h-4 text-slate-400"/>
                                            <span className="truncate" title={file.name}>{file.name}</span>
                                        </div>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Open Original"
                                        >
                                            <ExternalLink className="w-4 h-4"/>
                                        </a>
                                    </div>
                                    <div className="h-96 w-full bg-slate-100 relative group">
                                        <iframe
                                            src={viewerUrl}
                                            className="w-full h-full"
                                            title={`attachment-${idx}`}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Post Components                                 */
/* -------------------------------------------------------------------------- */

// Collapsible Analysis Component
const AnalysisDropdown = ({analysis}) => {
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    return (
        <div className="mt-4 pt-4 border-t border-slate-200">
            <button
                onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                className="bg-slate-100 w-full flex items-center justify-between text-left mb-3 p-2 rounded-lg transition-colors focus:outline-none select-none"
            >
                <h5 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Our Analysis
                </h5>
                <div
                    className={`text-slate-400 transition-transform duration-200 ${isAnalysisOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4"/>
                </div>
            </button>

            {isAnalysisOpen && (
                <div className="space-y-4">
                    {/* Summary */}
                    {analysis.summary && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-slate-800 font-medium">{analysis.summary}</p>
                        </div>
                    )}

                    {/* Performance Metrics */}
                    {analysis.performance && (
                        <div className="mb-4 grid grid-cols-3 gap-2">
                            <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Accuracy</div>
                                <div
                                    className="text-sm font-semibold text-slate-900">{analysis.performance.accuracy || 'N/A'}</div>
                            </div>
                            <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">One-Shot</div>
                                <div
                                    className="text-sm font-semibold text-slate-900">{analysis.performance.one_shot_capability || 'N/A'}</div>
                            </div>
                            <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reasoning</div>
                                <div
                                    className="text-sm font-semibold text-slate-900">{analysis.performance.reasoning_quality || 'N/A'}</div>
                            </div>
                        </div>
                    )}

                    {/* Strengths */}
                    {analysis.strengths && analysis.strengths.length > 0 && (
                        <div className="mb-4">
                            <h6 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Strengths</h6>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                {analysis.strengths.map((strength, idx) => (
                                    <li key={idx}>{strength}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                        <div className="mb-4">
                            <h6 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Weaknesses</h6>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                {analysis.weaknesses.map((weakness, idx) => (
                                    <li key={idx}>{weakness}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Notable Behaviors */}
                    {analysis.notable_behaviors && analysis.notable_behaviors.length > 0 && (
                        <div className="mb-4">
                            <h6 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Notable
                                Behaviors</h6>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                {analysis.notable_behaviors.map((behavior, idx) => (
                                    <li key={idx}>{behavior}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Detailed Analysis */}
                    {analysis.detailed_analysis && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <h6 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Detailed
                                Analysis</h6>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis.detailed_analysis}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Compact accordion style for the columnar analysis view
const AccordionPost = ({post}) => {
    const [isOpen, setIsOpen] = useState(false);
    const theme = getModelTheme(post.llm);
    const primaryColor = theme.barFill;
    const edUrl = `https://edstem.org/us/courses/${post.course_id}/discussion/${post.id}`;

    return (
        <div
            className="relative bg-white rounded-xl transition-all duration-200 shadow-sm overflow-hidden"
            style={{
                borderColor: primaryColor,
                borderWidth: `2px`
            }}
        >
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 overflow-hidden"
                style={{
                    backgroundColor: primaryColor
                }}
            />

            <div
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-100 w-full pl-5 pr-3 py-3 flex items-start justify-between text-left hover:bg-slate-200 transition-colors cursor-pointer select-none"
            >
                <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1.5">
            <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded">
              HW {post.homework_number === -1 ? '?' : post.homework_number}
            </span>
                        <span className="text-[10px] font-mono text-slate-500">
              Author: {post.user_name}
            </span>
                    </div>

                    <h4
                        className="text-sm font-bold leading-tight"
                        style={{color: primaryColor}}
                    >
                        {post.title}
                    </h4>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <a
                        href={edUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all"
                        title="Open in Ed"
                    >
                        <ExternalLink className="w-4 h-4"/>
                    </a>
                    <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5"/>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="pl-5 pr-4 pb-4 pt-2 border-t border-slate-100 bg-white space-y-4 cursor-auto">
                    <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Original
                            Post</h5>
                        <ContentRenderer xmlContent={post.content || post.document}/>
                    </div>
                    {post.gemini_analysis && (
                        <AnalysisDropdown analysis={post.gemini_analysis}/>
                    )}
                </div>
            )}
        </div>
    );
};

// Standard card style for the main feed view
const PostCard = ({post}) => {
    const [expanded, setExpanded] = useState(false);
    const theme = getModelTheme(post.llm);
    const edUrl = `https://edstem.org/us/courses/${post.course_id}/discussion/${post.id}`;

    return (
        <Card className="hover:shadow-md transition-shadow duration-200 group relative">
            <div className={`absolute left-0 top-0 bottom-0 w-1`}
                 style={{backgroundColor: theme.barFill}}/>

            <div className="p-5 pl-7">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
            <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {post.homework_number === -1 ? "Unknown HW" : "HW " + post.homework_number.toString()}
            </span>
                        <Badge theme={theme}>{post.llm}</Badge>
                    </div>

                    <a
                        href={edUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
                    >
                        Open in Ed
                        <ExternalLink className="w-3 h-3"/>
                    </a>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-700 transition-colors">
                    {post.title}
                </h3>

                <div className="mb-3 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Author:</span>
                    <span className="text-slate-700">{post.user_name}</span>
                </div>

                <div className={`relative ${!expanded ? 'max-h-32 overflow-hidden mask-bottom' : ''}`}>
                    <ContentRenderer xmlContent={post.content || post.document}/>
                    {!expanded && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"/>
                    )}
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors w-full justify-center py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 focus:outline-none select-none"
                >
                    {expanded ? (
                        <>Show Less <ChevronUp className="w-4 h-4"/></>
                    ) : (
                        <>Read Analysis <ChevronDown className="w-4 h-4"/></>
                    )}
                </button>
            </div>
        </Card>
    );
};

/* -------------------------------------------------------------------------- */
/* Main Application                                */
/* -------------------------------------------------------------------------- */

export default function App() {
    // Navigation State
    const [activeTab, setActiveTab] = useState('overview');

    // Overview Matrix State (New)
    const [showAllModels, setShowAllModels] = useState(false);

    // Feed State
    const [feedHw, setFeedHw] = useState('All');
    const [feedLlm, setFeedLlm] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // HW Arena State
    const [arenaHwFilter, setArenaHwFilter] = useState('All');
    const [arenaModelA, setArenaModelA] = useState('Gpt');
    const [arenaModelB, setArenaModelB] = useState('Claude');
    const [arenaClientId, setArenaClientId] = useState(null);
    const [arenaVotesByKey, setArenaVotesByKey] = useState({});
    const [arenaRemoteLeaderboard, setArenaRemoteLeaderboard] = useState(null);
    const [arenaSubmittingVote, setArenaSubmittingVote] = useState(false);
    const [arenaError, setArenaError] = useState(null);

    // If VITE_HW_ARENA_API_BASE is set, use it (supports external API).
    // Otherwise, in production, default to same-origin Vercel API routes under /api.
    const arenaApiBase = (import.meta?.env?.VITE_HW_ARENA_API_BASE || '').replace(/\/$/, '');
    const arenaApiEnabled = !!arenaApiBase || import.meta.env.PROD;

    // Process data for charts and matrices
    const processedData = useMemo(() => {
        const unknownConstant = 10000;
        const homeworks = [...new Set(rawData.map(p => (p.homework_number === -1 ? unknownConstant : p.homework_number)))].sort((a, b) => a - b).map(p => (p === unknownConstant ? -1 : p));
        const llms = [...new Set(rawData.map(p => p.llm))].filter(Boolean).sort();

        // Sort LLMs by count descending
        const llmCounts = llms.map(llm => ({
            name: llm,
            count: rawData.filter(p => p.llm === llm).length,
            theme: getModelTheme(llm)
        }));
        llmCounts.sort((a, b) => b.count - a.count);

        // Create sorted list of LLM names
        const sortedLLMs = llmCounts.map(l => l.name);

        // Split for matrix view (First 6 vs Others)
        const VISIBLE_LIMIT = 6;
        const topLLMs = sortedLLMs.slice(0, VISIBLE_LIMIT);
        const hiddenLLMs = sortedLLMs.slice(VISIBLE_LIMIT);

        const pivotData = homeworks.map(hw => {
            const row = {
                name: hw === -1 ? 'Unknown' : `HW ${hw}`,
                total: 0,
                othersTotal: 0, // Track total for hidden columns
                hwId: hw
            };

            sortedLLMs.forEach(llm => {
                const count = rawData.filter(p => p.homework_number === hw && p.llm === llm).length;
                row[llm] = count;
                row.total += count;

                // If this LLM is in the hidden list, add to othersTotal
                if (hiddenLLMs.includes(llm)) {
                    row.othersTotal += count;
                }
            });
            return row;
        });

        return {homeworks, llms: sortedLLMs, topLLMs, hiddenLLMs, pivotData, llmCounts};
    }, []);

    // Filter logic for the Feed view
    const feedPosts = useMemo(() => {
        return rawData.filter(post => {
            const matchesHw = feedHw === 'All' || post.homework_number.toString() === feedHw.toString();
            const matchesLlm = feedLlm === 'All' || post.llm === feedLlm;
            const matchesSearch = searchQuery === '' ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (post.user_name && post.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesHw && matchesLlm && matchesSearch;
        });
    }, [feedHw, feedLlm, searchQuery]);

    // Handlers
    const handleCellClick = (hwId, llm) => {
        setFeedHw(hwId.toString());
        setFeedLlm(llm);
        setActiveTab('feed');
    };

    // Init local HW Arena state
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const id = getOrCreateArenaClientId();
        setArenaClientId(id);
        const votes = safeJsonParse(window.localStorage.getItem(HW_ARENA_VOTES_KEY), {});
        setArenaVotesByKey(votes);
    }, []);

    // HW Arena no longer supports "All" — default to first available homework.
    useEffect(() => {
        if (arenaHwFilter !== 'All') return;
        const firstHw = processedData?.homeworks?.[0];
        if (firstHw === undefined || firstHw === null) return;
        setArenaHwFilter(firstHw.toString());
    }, [arenaHwFilter, processedData]);

    const fetchRemoteLeaderboard = async (hw) => {
        if (!arenaApiEnabled) return null;
        const url = `${arenaApiBase}/api/leaderboard`;
        const res = await fetch(url, {method: 'GET'});
        if (!res.ok) throw new Error(`Leaderboard fetch failed (${res.status})`);
        const data = await res.json();
        // Normalize shape (support both {models} and {ok, models}).
        return data?.models ? data : data;
    };

    useEffect(() => {
        let cancelled = false;
        if (!arenaApiEnabled) {
            setArenaRemoteLeaderboard(null);
            return;
        }
        (async () => {
            try {
                setArenaError(null);
                // Leaderboard is overall (across all HWs).
                const data = await fetchRemoteLeaderboard('All');
                if (!cancelled) setArenaRemoteLeaderboard(data);
            } catch (e) {
                if (!cancelled) {
                    setArenaRemoteLeaderboard(null);
                    setArenaError(e?.message || 'Failed to fetch public leaderboard.');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [arenaApiBase, arenaApiEnabled]);

    const arenaPairKey = canonicalPairKey(arenaModelA, arenaModelB);
    const arenaVoteKey = voteStorageKey({hw: arenaHwFilter, modelA: arenaModelA, modelB: arenaModelB});
    const arenaExistingVote = arenaVotesByKey?.[arenaVoteKey] || null;
    const arenaMatchup = (hwArenaData?.[arenaHwFilter] && arenaPairKey)
        ? hwArenaData[arenaHwFilter][arenaPairKey]
        : null;

    const arenaPostsA = useMemo(() => {
        return rawData.filter(p =>
            p.llm === arenaModelA &&
            p.homework_number?.toString() === arenaHwFilter?.toString()
        );
    }, [arenaModelA, arenaHwFilter]);

    const arenaPostsB = useMemo(() => {
        return rawData.filter(p =>
            p.llm === arenaModelB &&
            p.homework_number?.toString() === arenaHwFilter?.toString()
        );
    }, [arenaModelB, arenaHwFilter]);

    const arenaLocalLeaderboard = useMemo(() => {
        // Leaderboard is overall (across all HWs).
        return computeLeaderboardFromVotes(arenaVotesByKey, 'All');
    }, [arenaVotesByKey]);

    const arenaDisplayLeaderboard = useMemo(() => {
        // If the public API is configured and reachable, prefer it; otherwise fall back to local-only votes.
        const remoteModels = arenaRemoteLeaderboard?.models;
        const base = {};
        // Always include all known models, even if they have 0 votes.
        (processedData?.llms || []).forEach((m) => {
            base[m] = {w: 0, l: 0, t: 0};
        });

        if (remoteModels && typeof remoteModels === 'object') {
            return {...base, ...remoteModels};
        }
        return {...base, ...arenaLocalLeaderboard};
    }, [arenaRemoteLeaderboard, arenaLocalLeaderboard, processedData]);

    const arenaLeaderboardRows = useMemo(() => {
        const rows = Object.entries(arenaDisplayLeaderboard || {}).map(([model, r]) => {
            const w = Number(r?.w || 0);
            const l = Number(r?.l || 0);
            const t = Number(r?.t || 0);
            const total = w + l + t;
            const winRate = total > 0 ? (w + 0.5 * t) / total : 0;
            return {model, w, l, t, total, winRate};
        });
        rows.sort((a, b) => (b.winRate - a.winRate) || (b.w - a.w) || (a.l - b.l) || a.model.localeCompare(b.model));
        return rows;
    }, [arenaDisplayLeaderboard]);

    const submitArenaVote = async (winner) => {
        if (!winner || (winner !== 'A' && winner !== 'B' && winner !== 'T')) return;
        if (!arenaModelA || !arenaModelB || arenaModelA === arenaModelB) return;
        if (!arenaHwFilter) return;
        if (typeof window === 'undefined') return;
        if (!arenaClientId) return;

        // One vote per (hw, pair) per client in local storage (mirrors “light anti-abuse”).
        const nextVotes = {
            ...(arenaVotesByKey || {}),
            [arenaVoteKey]: {
                hw: arenaHwFilter,
                modelA: arenaModelA,
                modelB: arenaModelB,
                winner,
                ts: Date.now()
            }
        };

        setArenaVotesByKey(nextVotes);
        window.localStorage.setItem(HW_ARENA_VOTES_KEY, JSON.stringify(nextVotes));

        if (!arenaApiEnabled) return;

        setArenaSubmittingVote(true);
        setArenaError(null);
        try {
            const res = await fetch(`${arenaApiBase}/api/vote`, {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    hw: arenaHwFilter,
                    modelA: arenaModelA,
                    modelB: arenaModelB,
                    winner,
                    clientId: arenaClientId
                })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Vote failed (${res.status}): ${text || 'unknown error'}`);
            }
            const data = await fetchRemoteLeaderboard('All');
            setArenaRemoteLeaderboard(data);
        } catch (e) {
            setArenaError(e?.message || 'Failed to submit vote.');
        } finally {
            setArenaSubmittingVote(false);
        }
    };

    return (
        <div className="w-screen h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden ">
            {/* --- Top Navigation --- */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm flex-none">
                <div className="w-full px-4 md:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Special Participation Analyzer Logo"
                                className="w-10 h-10 object-contain rounded-lg bg-white"
                            />
                            <span className="text-xl font-bold text-slate-900 tracking-tight">EECS 182/282 Fall 2025 — LLM Performance on Homework</span>
                        </div>

                        <div className="flex items-center gap-1">
                            {[
                                {id: 'overview', label: 'Overview', icon: LayoutDashboard},
                                {id: 'feed', label: 'Post Feed', icon: List},
                                {id: 'arena', label: 'HW Arena', icon: Maximize2},
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                                        activeTab === tab.id
                                            ? 'bg-slate-100 text-blue-700 shadow-sm ring-1 ring-slate-200'
                                            : 'text-slate-500 bg-slate-50 hover:text-slate-900 hover:bg-slate-50'
                                    } focus:outline-none select-none`}
                                >
                                    <tab.icon className="w-4 h-4"/>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            <div className="overflow-hidden w-full p-4 md:p-6">

                {/* --- View 1: Overview (Matrix & Charts) --- */}
                {activeTab === 'overview' && (
                    <div
                        className="w-full h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Data Matrix */}
                            <Card className="lg:col-span-2 p-6">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                    <LayoutDashboard className="w-5 h-5 text-blue-500"/>
                                    Coverage Matrix
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        {/* Added border-collapse for cleaner lines */}
                                        <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="p-3 font-semibold text-slate-700 min-w-[100px]">Homework</th>

                                            {/* Always show Top 6 */}
                                            {processedData.topLLMs.map(llm => (
                                                <th key={llm}
                                                    className="p-3 font-semibold text-slate-700 text-center">{llm}</th>
                                            ))}

                                            {/* Expandable Section Header */}
                                            {!showAllModels ? (
                                                <th
                                                    className="p-3 font-bold text-slate-600 text-center bg-slate-100 cursor-pointer hover:bg-slate-200 hover:text-blue-600 transition-colors border-l border-r border-slate-200"
                                                    onClick={() => setShowAllModels(true)}
                                                    title="Click to reveal other models"
                                                >
                                                    <div
                                                        className="flex items-center justify-center gap-1 whitespace-nowrap">
                                                        Others
                                                        <ChevronRight className="w-4 h-4"/>
                                                    </div>
                                                </th>
                                            ) : (
                                                <>
                                                    {processedData.hiddenLLMs.map(llm => (
                                                        <th key={llm}
                                                            className="p-3 font-semibold text-slate-600 text-center bg-slate-50/50 min-w-[80px]">
                                                            {llm}
                                                        </th>
                                                    ))}

                                                    {/* --- CHANGED: Slim Collapse Rail (Header) --- */}
                                                    <th
                                                        className="w-8 p-0 border-l border-slate-200 bg-slate-50 cursor-pointer hover:bg-red-50 group transition-colors relative"
                                                        onClick={() => setShowAllModels(false)}
                                                        title="Collapse View"
                                                    >
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center">
                                                            <div
                                                                className="h-6 w-6 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                                                <ChevronLeft
                                                                    className="w-4 h-4 text-slate-400 group-hover:text-red-500"/>
                                                            </div>
                                                        </div>
                                                    </th>
                                                </>
                                            )}

                                            <th className="p-3 font-semibold text-slate-700 text-center">Total</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {processedData.pivotData.map((row) => (
                                            <tr key={row.name}
                                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="p-3 font-medium text-slate-900">
                                                    {HW_PDFS[row.hwId] ? (
                                                        <a 
                                                            href={HW_PDFS[row.hwId]} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                                                            title="Open Homework PDF"
                                                        >
                                                            {row.name} 
                                                            <ExternalLink className="w-3 h-3 opacity-50" />
                                                        </a>
                                                    ) : (
                                                        row.name
                                                    )}
                                                </td>

                                                {/* Top 6 Cells */}
                                                {processedData.topLLMs.map(llm => {
                                                    const count = row[llm];
                                                    const theme = getModelTheme(llm);
                                                    return (
                                                        <td key={llm} className="p-1">
                                                            <button
                                                                onClick={() => count > 0 && handleCellClick(row.hwId, llm)}
                                                                disabled={count === 0}
                                                                className={`w-full h-full py-2 rounded transition-all text-center font-medium ${
                                                                    count === 0
                                                                        ? 'bg-gray-100 text-slate-300 cursor-default'
                                                                        : `${theme.badgeBg} ${theme.badgeText} hover:shadow-sm cursor-pointer focus:outline-none select-none`
                                                                }`}
                                                            >
                                                                {count > 0 ? count : '-'}
                                                            </button>
                                                        </td>
                                                    );
                                                })}

                                                {/* Expandable Section Cells */}
                                                {!showAllModels ? (
                                                    <td className="p-1 border-l border-r border-slate-100 bg-slate-50/50">
                                                        <div
                                                            className={`w-full h-full py-2 rounded transition-all text-center ${
                                                                row.othersTotal === 0
                                                                    ? 'bg-gray-100 text-slate-300 cursor-default'
                                                                    : `font-bold text-slate-600 bg-slate-100 hover:shadow-sm cursor-pointer focus:outline-none select-none`
                                                            }`}>
                                                            {row.othersTotal > 0 ? row.othersTotal : '-'}
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <>
                                                        {processedData.hiddenLLMs.map(llm => {
                                                            const count = row[llm];
                                                            const theme = getModelTheme(llm);
                                                            return (
                                                                <td key={llm} className="p-1 bg-slate-50/30">
                                                                    <button
                                                                        onClick={() => count > 0 && handleCellClick(row.hwId, llm)}
                                                                        disabled={count === 0}
                                                                        className={`w-full h-full py-2 rounded transition-all text-center font-medium ${
                                                                            count === 0
                                                                                ? 'bg-gray-100 text-slate-300 cursor-default'
                                                                                : `${theme.badgeBg} ${theme.badgeText} hover:shadow-sm cursor-pointer focus:outline-none select-none`
                                                                        }`}
                                                                    >
                                                                        {count > 0 ? count : '-'}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}

                                                        {/* --- CHANGED: Slim Collapse Rail (Body) --- */}
                                                        {/* This makes the whole vertical strip clickable to collapse */}
                                                        <td
                                                            className="p-0 border-l border-slate-200 cursor-pointer hover:bg-red-50 transition-colors"
                                                            onClick={() => setShowAllModels(false)}
                                                            title="Collapse View"
                                                        >
                                                            {/* Empty cell acting as a hit-area */}
                                                        </td>
                                                    </>
                                                )}

                                                <td className="p-3 text-center font-bold text-slate-900 min-w-[80px]">{row.total}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Total Count Chart */}
                            <Card className="p-6 flex flex-col">
                                <h2 className="text-lg font-bold mb-6 text-slate-800">Total Posts by Model</h2>
                                <div className="flex-1 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={processedData.llmCounts} layout="vertical" margin={{left: 10}}>
                                            <XAxis type="number" hide/>
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={80}
                                                tick={{fontSize: 12, fill: '#64748b'}}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <RechartsTooltip
                                                cursor={{fill: '#f8fafc'}}
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                                {processedData.llmCounts.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.theme.barFill}/>
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- View 2: Post Feed --- */}
                {activeTab === 'feed' && (
                    <div
                        className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden animate-in fade-in duration-300">
                        {/* Sidebar Filters */}
                        <div className="lg:col-span-1 h-full overflow-y-auto pr-2 pb-20">
                            <Card className="p-5 sticky top-0">
                                <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold border-b pb-4">
                                    <Filter className="w-4 h-4"/> Filter Posts
                                </div>

                                {/* Search */}
                                <div className="mb-6 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400"/>
                                    <input
                                        type="text"
                                        placeholder="Search keywords..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                                    />
                                </div>

                                {/* Homework Filter */}
                                <div className="mb-6">
                                    <label
                                        className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Homework</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFeedHw('All')}
                                            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                                feedHw === 'All' ? 'bg-slate-800 text-white border-slate-800 font-bold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            } focus:outline-none select-none`}
                                        >
                                            All
                                        </button>
                                        {processedData.homeworks.map(hw => (
                                            <button
                                                key={hw}
                                                onClick={() => setFeedHw(hw.toString() === feedHw ? 'All' : hw.toString())}
                                                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                                    feedHw === hw.toString() ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                } focus:outline-none select-none`}
                                            >
                                                {hw === -1 ? 'Unknown' : `HW ${hw}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Model Filter */}
                                <div>
                                    <label
                                        className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Model</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFeedLlm('All')}
                                            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                                feedLlm === 'All' ? 'bg-slate-800 text-white border-slate-800 font-bold' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            } focus:outline-none select-none`}
                                        >
                                            All
                                        </button>
                                        {processedData.llms.map(llm => {
                                            const theme = getModelTheme(llm);
                                            const isSelected = feedLlm === llm;
                                            return (
                                                <button
                                                    key={llm}
                                                    onClick={() => setFeedLlm(isSelected ? 'All' : llm)}
                                                    className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                                                        isSelected
                                                            ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} ring-1 ring-${theme.name}-400 font-bold`
                                                            : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 ${theme.hover}`
                                                    } focus:outline-none select-none`}
                                                >
                                                    {llm}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Feed Content */}
                        <div className="lg:col-span-3 h-full overflow-y-auto pb-20 pr-2">
                            {feedLlm !== 'All' && modelAnalysisData[feedLlm] && (
                                <Card className="mb-4 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600"/>
                                        Performance Summary: {feedLlm} on {feedHw === 'All' ? 'All HWs' : `HW ${feedHw}`}
                                    </h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {modelAnalysisData[feedLlm][feedHw] || "No summary data available for this specific selection."}
                                    </p>
                                </Card>
                            )}
                            <div
                                className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                <h3 className="text-sm font-medium text-slate-600">
                                    Showing <span className="font-bold text-slate-900">{feedPosts.length}</span> posts
                                </h3>

                                {(feedHw !== 'All' || feedLlm !== 'All' || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setFeedHw('All');
                                            setFeedLlm('All');
                                            setSearchQuery('');
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3"/> Clear Filters
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {feedPosts.length > 0 ? (
                                    feedPosts.map(post => (
                                        <PostCard key={post.id} post={post}/>
                                    ))
                                ) : (
                                    <div
                                        className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                                        <p className="text-slate-500">No posts found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- View 3: HW Arena (Head-to-Head) --- */}
                {activeTab === 'arena' && (
                    <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in duration-300">

                        {/* Arena Controls */}
                        <Card className="flex-none p-4 mb-4 flex flex-wrap items-center gap-6 z-10 relative min-w-0">
                            {/* Homework Dropdown */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-700">Homework:</label>
                                <div className="relative">
                                    <select
                                        value={arenaHwFilter}
                                        onChange={(e) => setArenaHwFilter(e.target.value)}
                                        className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-500 block w-48 p-2.5 pr-8 outline-none focus:outline-none select-none"
                                    >
                                        {processedData.homeworks.map(hw => (
                                            <option key={hw} value={hw}>
                                                {hw === -1 ? 'Unknown Homework' : `Homework ${hw}`}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none"/>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                            {/* Model A */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Model A:</label>
                                <div className="relative">
                                    <select
                                        value={arenaModelA}
                                        onChange={(e) => {
                                            const nextA = e.target.value;
                                            setArenaModelA(nextA);
                                            if (nextA === arenaModelB) {
                                                const fallback = processedData.llms.find(m => m !== nextA) || nextA;
                                                setArenaModelB(fallback);
                                            }
                                        }}
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-500 block w-48 p-2.5 pr-8 outline-none focus:outline-none select-none"
                                    >
                                        {processedData.llms.map(llm => (
                                            <option key={llm} value={llm}>{llm}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none"/>
                                </div>
                            </div>

                            {/* Model B */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Model B:</label>
                                <div className="relative">
                                    <select
                                        value={arenaModelB}
                                        onChange={(e) => {
                                            const nextB = e.target.value;
                                            setArenaModelB(nextB);
                                            if (nextB === arenaModelA) {
                                                const fallback = processedData.llms.find(m => m !== nextB) || nextB;
                                                setArenaModelA(fallback);
                                            }
                                        }}
                                        className="appearance-none bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-500 block w-48 p-2.5 pr-8 outline-none focus:outline-none select-none"
                                    >
                                        {processedData.llms.map(llm => (
                                            <option key={llm} value={llm}>{llm}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none"/>
                                    </div>
                                </div>
                        </Card>

                        {/* Scrollable Arena Content */}
                        <div className="flex h-full overflow-y-auto pb-20 pr-2">
                            <div className="w-full space-y-4">
                                {/* Leaderboard */}
                                <Card className="p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="w-full">
                                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Maximize2 className="w-5 h-5 text-blue-500"/>
                                                Leaderboard
                                            </h2>
                                            <p className="text-sm text-slate-500 mt-2">
                                                Models are ranked by <strong>Score</strong>, which is the win rate calculated as <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">(Wins + 0.5 × Ties) / Total Matches</span>. 
                                                Columns W, L, and T stand for Wins, Losses, and Ties respectively.
                                            </p>
                                            {arenaError && (
                                                <p className="text-xs text-red-600 mt-2">{arenaError}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Model</th>
                                                <th className="p-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">W</th>
                                                <th className="p-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">L</th>
                                                <th className="p-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">T</th>
                                                <th className="p-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Score</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {arenaLeaderboardRows.length > 0 ? arenaLeaderboardRows.map((r) => {
                                                const theme = getModelTheme(r.model);
                                return (
                                                    <tr key={r.model} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="p-2 font-semibold text-slate-900">
                                                            <span className={`inline-flex items-center gap-2`}>
                                                                <span className={`w-2 h-2 rounded-full`} style={{backgroundColor: theme.barFill}}/>
                                                                {r.model}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center font-bold text-slate-800">{r.w}</td>
                                                        <td className="p-2 text-center font-bold text-slate-800">{r.l}</td>
                                                        <td className="p-2 text-center font-bold text-slate-800">{r.t}</td>
                                                        <td className="p-2 text-center text-slate-700 font-medium">
                                                            {(r.winRate * 100).toFixed(0)}%
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={5} className="p-4 text-center text-sm text-slate-500 italic">
                                                        No votes yet. Pick two models and vote to get started.
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Matchup */}
                                <Card className="p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">
                                                {arenaModelA} vs {arenaModelB}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {arenaHwFilter.toString() === '-1' ? 'Unknown homework' : `Homework ${arenaHwFilter}`}
                                            </p>
                                        </div>
                                    </div>

                                    {arenaExistingVote && (
                                        <div className="mt-3 text-xs text-slate-600">
                                            Your vote: <span className="font-bold">{arenaExistingVote.winner === 'A' ? arenaModelA : arenaExistingVote.winner === 'B' ? arenaModelB : 'Tie'}</span>
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        {arenaMatchup ? (
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex items-start gap-2">
                                                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"/>
                                                    <div className="text-sm text-slate-800">
                                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                            Differences (generated)
                                                        </div>
                                                        {Array.isArray(arenaMatchup.diff_summary) && arenaMatchup.diff_summary.length > 0 ? (
                                                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                                                {arenaMatchup.diff_summary.map((item, idx) => (
                                                                    <li key={idx}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-slate-600 italic">
                                                                Matchup data exists but has no diff summary.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                                <div className="text-sm text-amber-900 font-semibold mb-1">No matchup annotation found.</div>
                                                <div className="text-xs text-amber-900/80">
                                                    Generate <span className="font-mono">src/data/hw_arena.json</span> with the Python script (see <span className="font-mono">generate_hw_arena.py</span>).
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                </Card>

                                {/* Evidence: posts side-by-side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-slate-800">{arenaModelA}</h4>
                                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {arenaPostsA.length} posts
                                            </span>
                                        </div>
                                        <div className="space-y-3 custom-scrollbar">
                                            {arenaPostsA.length > 0 ? arenaPostsA.map(post => (
                                                    <AccordionPost key={post.id} post={post}/>
                                            )) : (
                                                <div className="text-center py-8 text-sm text-slate-400 italic">No posts found.</div>
                                            )}
                                                </div>
                                    </Card>

                                    <Card className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-slate-800">{arenaModelB}</h4>
                                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {arenaPostsB.length} posts
                                            </span>
                                        </div>
                                        <div className="space-y-3 custom-scrollbar">
                                            {arenaPostsB.length > 0 ? arenaPostsB.map(post => (
                                                <AccordionPost key={post.id} post={post}/>
                                            )) : (
                                                <div className="text-center py-8 text-sm text-slate-400 italic">No posts found.</div>
                                            )}
                                        </div>
                                    </Card>
                                    </div>

                                {/* Voting controls (below post boxes) */}
                                <Card className="p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Vote winner</div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Pick who performed better on {arenaHwFilter.toString() === '-1' ? 'Unknown homework' : `Homework ${arenaHwFilter}`}.
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                disabled={!!arenaExistingVote || arenaSubmittingVote || arenaModelA === arenaModelB}
                                                onClick={() => submitArenaVote('A')}
                                                className={`px-5 py-3 text-sm font-extrabold rounded-xl border transition-colors ${
                                                    !!arenaExistingVote
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                                } focus:outline-none select-none`}
                                                title={arenaExistingVote ? 'You already voted on this matchup.' : `Vote ${arenaModelA}`}
                                            >
                                                {arenaModelA} wins
                                            </button>
                                            <button
                                                disabled={!!arenaExistingVote || arenaSubmittingVote || arenaModelA === arenaModelB}
                                                onClick={() => submitArenaVote('T')}
                                                className={`px-5 py-3 text-sm font-extrabold rounded-xl border transition-colors ${
                                                    !!arenaExistingVote
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                                } focus:outline-none select-none`}
                                                title={arenaExistingVote ? 'You already voted on this matchup.' : 'Vote tie'}
                                            >
                                                Tie
                                            </button>
                                            <button
                                                disabled={!!arenaExistingVote || arenaSubmittingVote || arenaModelA === arenaModelB}
                                                onClick={() => submitArenaVote('B')}
                                                className={`px-5 py-3 text-sm font-extrabold rounded-xl border transition-colors ${
                                                    !!arenaExistingVote
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                                } focus:outline-none select-none`}
                                                title={arenaExistingVote ? 'You already voted on this matchup.' : `Vote ${arenaModelB}`}
                                            >
                                                {arenaModelB} wins
                                            </button>
                                        </div>
                                    </div>

                                    {arenaExistingVote && (
                                        <div className="mt-3 text-xs text-slate-600">
                                            Your vote: <span className="font-bold">{arenaExistingVote.winner === 'A' ? arenaModelA : arenaExistingVote.winner === 'B' ? arenaModelB : 'Tie'}</span>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 py-2 px-4 text-center z-40">
                <p className="text-xs font-medium text-slate-500">
                    Built and designed by Akhil Agarwal, Aryan Bansal, Nikhil Mathihalli, and Tyler Pham — students in EECS 182 Fall 2025. Faculty: Prof. Anant Sahai and Prof. Gireeja Ranade.
                </p>
            </div>
        </div>
    );
}