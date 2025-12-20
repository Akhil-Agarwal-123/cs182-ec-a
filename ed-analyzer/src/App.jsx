import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Search,
  BookOpen,
  MessageSquare,
  Filter,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  List,
  FileText,
  ExternalLink,
  Trash2,
  Maximize2,
  Plus,
  Info // Added Info icon
} from 'lucide-react';

// Import local data
import rawData from './data/posts.json';

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
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    borderTop: 'border-blue-500',
    titleText: 'text-blue-700',
    barFill: '#3b82f6',
    hover: 'hover:bg-blue-50 hover:border-blue-300'
  };
  if (normalized.includes('llama')) return {
    name: 'sky',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    borderTop: 'border-sky-500',
    titleText: 'text-sky-700',
    barFill: '#0ea5e9',
    hover: 'hover:bg-sky-50 hover:border-sky-300'
  };
  if (normalized.includes('perplexity')) return {
    name: 'cyan',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    borderTop: 'border-cyan-500',
    titleText: 'text-cyan-700',
    barFill: '#06b6d4',
    hover: 'hover:bg-cyan-50 hover:border-cyan-300'
  };
  if (normalized.includes('deepseek')) return {
    name: 'indigo',
    badgeBg: 'bg-indigo-50',
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
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200',
    borderTop: 'border-violet-500',
    titleText: 'text-violet-700',
    barFill: '#8b5cf6',
    hover: 'hover:bg-violet-50 hover:border-violet-300'
  };
  if (normalized.includes('mistral')) return {
    name: 'fuchsia',
    badgeBg: 'bg-fuchsia-50',
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
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    borderTop: 'border-amber-500',
    titleText: 'text-amber-700',
    barFill: '#f59e0b',
    hover: 'hover:bg-amber-50 hover:border-amber-300'
  };
  if (normalized.includes('kimi')) return {
    name: 'rose',
    badgeBg: 'bg-rose-50',
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
    badgeBg: 'bg-slate-100',
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

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, theme }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
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
const ContentRenderer = ({ xmlContent }) => {
  if (!xmlContent) return null;

  // Extract Files/PDFs
  const fileRegex = /<file url="([^"]+)"\s*(?:filename="([^"]+)")?\s*\/>/g;
  const files = [];
  let fileMatch;
  while ((fileMatch = fileRegex.exec(xmlContent)) !== null) {
    files.push({ url: fileMatch[1], name: fileMatch[2] || 'Document' });
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
      <div dangerouslySetInnerHTML={{ __html: formattedText }} />

      {/* Attachment Preview Section */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</div>
          <div className="grid grid-cols-1 gap-4">
            {files.map((file, idx) => {
              // UPDATED LOGIC: Check for Office docs AND PDFs
              // This regex checks for .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx
              const isViewableDoc = /\.(pdf|docx?|pptx?|xlsx?)$/i.test(file.name) ||
                                    /\.(pdf|docx?|pptx?|xlsx?)$/i.test(file.url);

              // If it is a viewable doc, use Google Viewer. Otherwise (e.g. images), use direct link.
              const viewerUrl = isViewableDoc
                ? `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`
                : file.url;

              return (
                <div key={idx} className="border rounded-lg overflow-hidden bg-slate-50 flex flex-col">
                  <div className="px-3 py-2 bg-white border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Open Original"
                    >
                      <ExternalLink className="w-4 h-4" />
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
const AnalysisDropdown = ({ analysis }) => {
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
        <div className={`text-slate-400 transition-transform duration-200 ${isAnalysisOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4" />
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
                <div className="text-sm font-semibold text-slate-900">{analysis.performance.accuracy || 'N/A'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">One-Shot</div>
                <div className="text-sm font-semibold text-slate-900">{analysis.performance.one_shot_capability || 'N/A'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reasoning</div>
                <div className="text-sm font-semibold text-slate-900">{analysis.performance.reasoning_quality || 'N/A'}</div>
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
              <h6 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Notable Behaviors</h6>
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
              <h6 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Detailed Analysis</h6>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis.detailed_analysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact accordion style for the columnar analysis view
const AccordionPost = ({ post }) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = getModelTheme(post.llm);
  const primaryColor = theme.barFill;

  // Construct EdStem URL
  const edUrl = `https://edstem.org/us/courses/${post.course_id}/discussion/${post.id}`;

  return (
    <div
      className="relative bg-white rounded-xl transition-all duration-200 shadow-sm overflow-hidden"
      style={{
        borderColor: primaryColor,
        borderWidth: `2px`
      }}
    >
      {/* Decorative accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 overflow-hidden"
        style={{
            backgroundColor: primaryColor
        }}
      />

      {/* Changed from <button> to <div> to allow nesting the <a> tag.
        added cursor-pointer to mimic button behavior.
      */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-100 w-full pl-5 pr-3 py-3 flex items-start justify-between text-left hover:bg-slate-200 transition-colors cursor-pointer select-none"
      >
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded">
              HW {post.homework_number === -1 ? '?' : post.homework_number}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Author: {post.user_name}
            </span>
          </div>

          <h4
            className="text-sm font-bold leading-tight"
            style={{ color: primaryColor }}
          >
            {post.title}
          </h4>
        </div>

        <div className="flex flex-col items-center gap-2">
           {/* Ed Button - Uses stopPropagation to prevent toggling the accordion */}
           <a
            href={edUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all"
            title="Open in Ed"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Chevron Indicator */}
          <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="pl-5 pr-4 pb-4 pt-2 border-t border-slate-100 bg-white space-y-4 cursor-auto">
          {/* Original Post Content */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Original Post</h5>
            <ContentRenderer xmlContent={post.content || post.document} />
          </div>
          
          {/* Gemini Analysis */}
          {post.gemini_analysis && (
            <AnalysisDropdown analysis={post.gemini_analysis} />
          )}
        </div>
      )}
    </div>
  );
};

// Standard card style for the main feed view
const PostCard = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = getModelTheme(post.llm);

  // Construct EdStem URL
  const edUrl = `https://edstem.org/us/courses/${post.course_id}/discussion/${post.id}`;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 group relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1`}
      style={{backgroundColor: theme.barFill}}/>

      <div className="p-5 pl-7">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              HW {post.homework_number}
            </span>
            <Badge theme={theme}>{post.llm}</Badge>
          </div>

          {/* Ed Link Button */}
          <a
            href={edUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
          >
            Open in Ed
            <ExternalLink className="w-3 h-3" />
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
          <ContentRenderer xmlContent={post.content || post.document} />
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors w-full justify-center py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 focus:outline-none select-none"
        >
          {expanded ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Read Analysis <ChevronDown className="w-4 h-4" /></>
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

  // Feed State
  const [feedHw, setFeedHw] = useState('All');
  const [feedLlm, setFeedLlm] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Analysis State
  const [analysisColumns, setAnalysisColumns] = useState(['Gpt', 'Claude']);
  const [analysisHwFilter, setAnalysisHwFilter] = useState('All');
  const [expandedSummaries, setExpandedSummaries] = useState(new Set());

  // Process data for charts and matrices
  const processedData = useMemo(() => {
    const homeworks = [...new Set(rawData.map(p => p.homework_number))].sort((a, b) => a - b);
    const llms = [...new Set(rawData.map(p => p.llm))].filter(Boolean).sort();

    const pivotData = homeworks.map(hw => {
      const row = {
        name: hw === -1 ? 'Unknown' : `HW ${hw}`,
        total: 0,
        hwId: hw
      };
      llms.forEach(llm => {
        const count = rawData.filter(p => p.homework_number === hw && p.llm === llm).length;
        row[llm] = count;
        row.total += count;
      });
      return row;
    });

    const llmCounts = llms.map(llm => ({
      name: llm,
      count: rawData.filter(p => p.llm === llm).length,
      theme: getModelTheme(llm)
    })).sort((a,b) => b.count - a.count);

    // Aggregate strengths and weaknesses by LLM
    const llmAnalyses = llms.map(llm => {
      const postsWithAnalysis = rawData.filter(p => p.llm === llm && p.gemini_analysis);
      
      if (postsWithAnalysis.length === 0) {
        return {
          llm,
          strengths: [],
          weaknesses: [],
          theme: getModelTheme(llm)
        };
      }

      // Collect all strengths and weaknesses
      const allStrengths = [];
      const allWeaknesses = [];
      
      postsWithAnalysis.forEach(post => {
        if (post.gemini_analysis.strengths) {
          allStrengths.push(...post.gemini_analysis.strengths);
        }
        if (post.gemini_analysis.weaknesses) {
          allWeaknesses.push(...post.gemini_analysis.weaknesses);
        }
      });

      // Count frequency of each strength/weakness
      const strengthCounts = {};
      const weaknessCounts = {};
      
      allStrengths.forEach(s => {
        strengthCounts[s] = (strengthCounts[s] || 0) + 1;
      });
      
      allWeaknesses.forEach(w => {
        weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
      });

      // Get top 5 most common strengths and weaknesses
      const topStrengths = Object.entries(strengthCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([strength, count]) => ({ text: strength, count }));
      
      const topWeaknesses = Object.entries(weaknessCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([weakness, count]) => ({ text: weakness, count }));

      return {
        llm,
        strengths: topStrengths,
        weaknesses: topWeaknesses,
        theme: getModelTheme(llm),
        analysisCount: postsWithAnalysis.length
      };
    });

    return { homeworks, llms, pivotData, llmCounts, llmAnalyses };
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

  const addColumn = (llm) => {
    if (!analysisColumns.includes(llm)) {
      setAnalysisColumns([...analysisColumns, llm]);
    }
  };

  const removeColumn = (llm) => {
    setAnalysisColumns(analysisColumns.filter(c => c !== llm));
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
              <span className="text-xl font-bold text-slate-900 tracking-tight">Special Participation Analyzer</span>
            </div>

            <div className="flex items-center gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'feed', label: 'Post Feed', icon: List },
                { id: 'analysis', label: 'Model Analysis', icon: Maximize2 },
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
                  <tab.icon className="w-4 h-4" />
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
          <div className="w-full h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Data Matrix */}
              <Card className="lg:col-span-2 p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <LayoutDashboard className="w-5 h-5 text-blue-500" />
                  Coverage Matrix
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-semibold text-slate-700">Homework</th>
                        {processedData.llms.map(llm => (
                          <th key={llm} className="p-3 font-semibold text-slate-700 text-center">{llm}</th>
                        ))}
                        <th className="p-3 font-semibold text-slate-700 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.pivotData.map((row) => (
                        <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-900">{row.name}</td>
                          {processedData.llms.map(llm => {
                            const count = row[llm];
                            const theme = getModelTheme(llm);
                            return (
                              <td key={llm} className="p-1">
                                <button
                                  onClick={() => count > 0 && handleCellClick(row.hwId, llm)}
                                  disabled={count === 0}
                                  className={`w-full h-full py-2 rounded transition-all text-center font-medium ${
                                    count === 0
                                      ? 'bg-gray-800 text-slate-300 cursor-default'
                                      : `${theme.badgeBg} ${theme.badgeText} hover:shadow-sm cursor-pointer focus:outline-none select-none`
                                  }`}
                                >
                                  {count > 0 ? count : '-'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="p-3 text-right font-bold text-slate-900">{row.total}</td>
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
                    <BarChart data={processedData.llmCounts} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                        {processedData.llmCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.theme.barFill} />
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden animate-in fade-in duration-300">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 h-full overflow-y-auto pr-2 pb-20">
              <Card className="p-5 sticky top-0">
                <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold border-b pb-4">
                  <Filter className="w-4 h-4" /> Filter Posts
                </div>

                {/* Search */}
                <div className="mb-6 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Homework</label>
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Model</label>
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
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <h3 className="text-sm font-medium text-slate-600">
                  Showing <span className="font-bold text-slate-900">{feedPosts.length}</span> posts
                </h3>

                {(feedHw !== 'All' || feedLlm !== 'All' || searchQuery) && (
                  <button
                    onClick={() => { setFeedHw('All'); setFeedLlm('All'); setSearchQuery(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Filters
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {feedPosts.length > 0 ? (
                  feedPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No posts found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- View 3: Model Analysis (Columnar) --- */}
        {activeTab === 'analysis' && (
          <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in duration-300">

            {/* Analysis Controls */}
            <Card className="flex-none p-4 mb-4 flex flex-wrap items-center gap-6 z-10 relative min-w-0">
              {/* Homework Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Homework:</label>
                <div className="relative">
                  <select
                    value={analysisHwFilter}
                    onChange={(e) => setAnalysisHwFilter(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-lg focus:ring-blue-500 block w-48 p-2.5 pr-8 outline-none focus:outline-none select-none"
                  >
                    <option value="All">All Assignments</option>
                    {processedData.homeworks.map(hw => (
                      <option key={hw} value={hw}>
                         {hw === -1 ? 'Unknown Homework' : `Homework ${hw}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

              {/* Column Adder */}
              <div className="flex items-center gap-3 flex-1 overflow-x-auto min-w-0">
                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Add Column:</label>
                <div className="flex gap-2">
                  {processedData.llms.map(llm => {
                    const isActive = analysisColumns.includes(llm);
                    const theme = getModelTheme(llm);
                    if (isActive) return null;
                    return (
                      <button
                        key={llm}
                        onClick={() => addColumn(llm)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-1 ${theme.hover} focus:outline-none select-none`}
                      >
                        <Plus className="w-3 h-3" />
                        {llm}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Horizontal Scroll Container */}
            <div className="flex h-full overflow-x-scroll gap-4 px-1">
              {analysisColumns.length === 0 && (
                <div className="w-full flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <Maximize2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Select models above to compare analysis.</p>
                </div>
              </div>
              )}
              {/* Dynamic Columns */}
              {analysisColumns.map(llmName => {
                  const theme = getModelTheme(llmName);
                  const columnPosts = rawData.filter(p =>
                    p.llm === llmName &&
                    (analysisHwFilter === 'All' || p.homework_number.toString() === analysisHwFilter.toString())
                  );

                  // Get aggregated analysis for this LLM (filtered by homework if needed)
                  const llmAnalysis = processedData.llmAnalyses.find(a => a.llm === llmName);
                  let filteredAnalysis = null;

                  if (llmAnalysis && analysisHwFilter !== 'All') {
                    // Filter posts by homework for this analysis
                    const filteredPosts = rawData.filter(p =>
                      p.llm === llmName &&
                      p.gemini_analysis &&
                      p.homework_number.toString() === analysisHwFilter.toString()
                    );

                    if (filteredPosts.length > 0) {
                      // Collect strengths and weaknesses for filtered posts
                      const allStrengths = [];
                      const allWeaknesses = [];

                      filteredPosts.forEach(post => {
                        if (post.gemini_analysis.strengths) {
                          allStrengths.push(...post.gemini_analysis.strengths);
                        }
                        if (post.gemini_analysis.weaknesses) {
                          allWeaknesses.push(...post.gemini_analysis.weaknesses);
                        }
                      });

                      // Count frequency
                      const strengthCounts = {};
                      const weaknessCounts = {};

                      allStrengths.forEach(s => {
                        strengthCounts[s] = (strengthCounts[s] || 0) + 1;
                      });

                      allWeaknesses.forEach(w => {
                        weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
                      });

                      // Get top 5
                      const topStrengths = Object.entries(strengthCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([text, count]) => ({ text, count }));

                      const topWeaknesses = Object.entries(weaknessCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([text, count]) => ({ text, count }));

                      filteredAnalysis = {
                        strengths: topStrengths,
                        weaknesses: topWeaknesses,
                        analysisCount: filteredPosts.length
                      };
                    }
                  } else if (llmAnalysis && analysisHwFilter === 'All') {
                    // Use the full analysis for "All"
                    filteredAnalysis = llmAnalysis;
                  }

                  return (
                    <div
                      key={llmName}
                      className="flex-none w-[400px] flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                    >
                      {/* Column Header */}
                      <div className={`p-4 bg-slate-100 border-b border-t-4 ${theme.borderTop}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-lg font-black ${theme.titleText} uppercase tracking-wide`}>{llmName}</h3>
                          <button
                            onClick={() => removeColumn(llmName)}
                            className="text-black-300 hover:text-red-500 transition-colors p-1 bg-white outline-none focus:outline-none select-none border-none"
                            title="Remove Column"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-xs mb-2">
                           <span className="text-slate-500 font-medium">
                              {analysisHwFilter === 'All'
                                ? 'All Assignments'
                                : (analysisHwFilter.toString() === '-1' ? 'Unknown Homework' : `Homework ${analysisHwFilter}`)
                              }
                           </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600`}>
                            {columnPosts.length} Posts
                          </span>
                        </div>

                        {/* --- Performance Summary (Collapsible) --- */}
                        {(filteredAnalysis || columnPosts.length > 0) && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                const summaryKey = `${llmName}-${analysisHwFilter}`;
                                const newExpanded = new Set(expandedSummaries);
                                if (newExpanded.has(summaryKey)) {
                                  newExpanded.delete(summaryKey);
                                } else {
                                  newExpanded.add(summaryKey);
                                }
                                setExpandedSummaries(newExpanded);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 transition-colors text-left focus:outline-none select-none"
                            >
                              <div className="flex items-center gap-2">
                                <Info className={`w-4 h-4 flex-shrink-0 ${theme.badgeText}`} />
                                <span className={`text-xs font-bold ${theme.badgeText}`}>Performance Summary</span>
                              </div>
                              <div className={`text-slate-400 transition-transform duration-200 ${expandedSummaries.has(`${llmName}-${analysisHwFilter}`) ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </button>
                            {expandedSummaries.has(`${llmName}-${analysisHwFilter}`) && (
                              <div className="mt-1 p-3 rounded-lg bg-white border border-slate-200 space-y-4 shadow-sm">

                                {/* Strengths & Weaknesses */}
                                {filteredAnalysis && (filteredAnalysis.strengths.length > 0 || filteredAnalysis.weaknesses.length > 0) && (
                                  <div className="space-y-3">
                                    {/* Strengths */}
                                    {filteredAnalysis.strengths.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                          Top Strengths
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {filteredAnalysis.strengths.map((item, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                                              <span className="text-emerald-600 font-bold mt-0.5">+</span>
                                              <span className="flex-1">{item.text}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Weaknesses */}
                                    {filteredAnalysis.weaknesses.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                          Top Weaknesses
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {filteredAnalysis.weaknesses.map((item, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                                              <span className="text-red-600 font-bold mt-0.5">−</span>
                                              <span className="flex-1">{item.text}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Show message if no data available */}
                                {(!filteredAnalysis || (filteredAnalysis.strengths.length === 0 && filteredAnalysis.weaknesses.length === 0)) && (
                                  <div className="text-xs text-slate-500 italic">
                                    No analysis data available for this selection.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Scrollable Post List */}
                      <div className="p-3 space-y-3 custom-scrollbar">
                        {columnPosts.length > 0 ? (
                          columnPosts.map(post => (
                            <AccordionPost key={post.id} post={post} />
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-sm text-slate-400 italic">No posts found for this selection.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
          </div>
        )}

      </div>
    </div>
  );
}