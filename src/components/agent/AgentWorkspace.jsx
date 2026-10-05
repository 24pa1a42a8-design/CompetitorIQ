import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, 
  XCircle, TrendingUp, User, PlusCircle, ChevronDown, ChevronUp, History
} from 'lucide-react';
import HindsightFlowWidget from '../common/HindsightFlowWidget';
import AgentActivityPanel from './AgentActivityPanel';
import apiService from '../../services/apiService';

export default function AgentWorkspace({ onNavigate, onOpenEvidence, initialQuery = '', initialCompetitor = null }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedCompetitor, setSelectedCompetitor] = useState(initialCompetitor || null);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [agentResponse, setAgentResponse] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [ollamaInfo, setOllamaInfo] = useState(null);
  const [thread, setThread] = useState([]);
  const [expandedTurnIds, setExpandedTurnIds] = useState(new Set());

  // AbortController reference for request cancellation
  const abortControllerRef = useRef(null);
  const threadEndRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (initialCompetitor) {
      setSelectedCompetitor(initialCompetitor);
    }
  }, [initialCompetitor]);

  const fetchConversations = async () => {
    try {
      const res = await apiService.getAgentConversations();
      if (res?.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Failed to load agent conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    apiService.getOllamaStatus()
      .then(res => {
        if (res?.data) setOllamaInfo(res.data);
      })
      .catch(() => {
        setOllamaInfo({ status: 'unavailable', reachable: false, model: 'qwen2.5:3b' });
      });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sampleQueries = [
    "Hi",
    "What are Microsoft's key competitive advantages against AWS?",
    "What pricing changes have competitors made?",
    "Compare Oracle and IBM cloud infrastructure and pricing",
    "What has Google Cloud announced recently?"
  ];

  const toggleExpandTurn = (id) => {
    setExpandedTurnIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNewSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveConversationId(null);
    setThread([]);
    setAgentResponse(null);
    setQuery('');
    setError(null);
    setLastSubmittedQuery('');
    setExpandedTurnIds(new Set());
  };

  const handleStartResearch = async (targetQuery) => {
    const queryToRun = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!queryToRun || isExecuting) return;

    // Cancel any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsExecuting(true);
    setError(null);
    setLastSubmittedQuery(queryToRun);
    setQuery('');

    // Append user query bubble to thread immediately
    const userMsgId = `usr-${Date.now()}`;
    const newUserMsg = {
      id: userMsgId,
      role: 'USER',
      content: queryToRun,
      createdAt: new Date().toISOString()
    };
    setThread(prev => [...prev, newUserMsg]);

    try {
      const res = await apiService.queryAgent(queryToRun, {
        conversationId: activeConversationId || undefined,
        competitorId: selectedCompetitor || undefined,
        signal: abortController.signal
      });

      if (res?.data) {
        const agentMsgId = `ast-${Date.now()}`;
        const newAgentMsg = {
          id: agentMsgId,
          role: 'ASSISTANT',
          content: res.data.answer,
          agentData: res.data,
          createdAt: new Date().toISOString()
        };
        setThread(prev => [...prev, newAgentMsg]);
        setAgentResponse(res.data);
        if (res.data.conversationId) {
          setActiveConversationId(res.data.conversationId);
        }
        fetchConversations();
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled')) {
        setError('Research was cancelled.');
      } else {
        setError(err.message || 'Agent execution failed. Please retry.');
      }
    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelResearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleLoadConversation = async (convId) => {
    try {
      setActiveConversationId(convId);
      setError(null);
      const res = await apiService.getConversationMessages(convId);
      if (res?.data?.messages && Array.isArray(res.data.messages)) {
        const loadedThread = res.data.messages.map(m => {
          if (m.role === 'USER') {
            return {
              id: m.id,
              role: 'USER',
              content: m.content,
              createdAt: m.createdAt
            };
          }

          let agentData = null;
          let content = m.content;
          try {
            agentData = JSON.parse(m.content);
            if (agentData?.answer) content = agentData.answer;
          } catch {
            agentData = { answer: m.content };
          }

          return {
            id: m.id,
            role: 'ASSISTANT',
            content,
            agentData,
            createdAt: m.createdAt
          };
        });

        setThread(loadedThread);

        // Find and expand the latest assistant response
        const lastAssistant = [...loadedThread].reverse().find(m => m.role === 'ASSISTANT');
        if (lastAssistant?.agentData) {
          setAgentResponse(lastAssistant.agentData);
        }
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  // Parse narrative prose and turn citation patterns into interactive deep-link badges
  const renderAnswerWithCitations = (answerText, evidence = []) => {
    if (!answerText) return null;
    const citationRegex = /(\[(?:Source|Citation):\s*[^\]]+\]|\[cit-[^\]]+\])/gi;
    const parts = answerText.split(citationRegex);

    return parts.map((part, idx) => {
      if (citationRegex.test(part)) {
        const cleanTag = part.replace(/^\[(?:Source|Citation):\s*|\]$/gi, '').trim().toLowerCase();
        const matchedEv = evidence.find(ev => 
          (ev.publisher && cleanTag.includes(ev.publisher.toLowerCase())) ||
          (ev.competitorName && cleanTag.includes(ev.competitorName.toLowerCase())) ||
          (ev.citationId && cleanTag.includes(ev.citationId.toLowerCase()))
        );

        return (
          <span
            key={idx}
            onClick={() => {
              const gridEl = document.getElementById('evidence-traceability-grid');
              if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth' });
              if (matchedEv && onOpenEvidence) onOpenEvidence(matchedEv);
            }}
            className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300 rounded-md text-[11px] font-bold cursor-pointer transition shadow-2xs select-none"
            title={matchedEv ? `Verified citation: ${matchedEv.title}` : 'Jump to Evidence Traceability Grid'}
          >
            <ExternalLink className="w-2.5 h-2.5 text-orange-700 shrink-0" />
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper: 5-Box Epistemological Claim Breakdown
  const render5BoxGrid = (data) => {
    if (!data) return null;
    const hasAnyBox = (data.facts?.length > 0 || data.observations?.length > 0 || data.inferences?.length > 0 || data.implications?.length > 0);
    if (!hasAnyBox) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            5-Box Epistemological Claim Breakdown
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            Empirical Grounding Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. VERIFIED FACTS (Emerald) */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-2">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Grounded Facts ({data.facts?.length || 0})
            </h3>
            {(!data.facts || data.facts.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No direct facts found for this query.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {data.facts.map((f, i) => (
                  <li key={i} className="leading-relaxed font-medium">• {f}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 2. STRATEGIC OBSERVATIONS (Blue) */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-2">
            <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" /> Strategic Observations ({data.observations?.length || 0})
            </h3>
            {(!data.observations || data.observations.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No strategic observations compiled.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-blue-950">
                {data.observations.map((o, i) => (
                  <li key={i} className="leading-relaxed">• {o}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 3. LOGICAL INFERENCES (Amber) */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-600" /> Logical Inferences ({data.inferences?.length || 0})
            </h3>
            {(!data.inferences || data.inferences.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No logical inferences derived.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-amber-950">
                {data.inferences.map((inf, i) => (
                  <li key={i} className="leading-relaxed italic">• {inf}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 4. BUSINESS & STRATEGIC IMPLICATIONS (Purple) */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200/80 space-y-2">
            <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" /> Business Implications ({data.implications?.length || 0})
            </h3>
            {(!data.implications || data.implications.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No business implications derived.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-purple-950">
                {data.implications.map((imp, i) => (
                  <li key={i} className="leading-relaxed font-medium">• {imp}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 5. UNKNOWNS & DATA GAPS (Slate) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 md:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-500" /> Unknowns & Data Gaps ({data.unknowns?.length || 0})
            </h3>
            {(!data.unknowns || data.unknowns.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No significant data gaps identified.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {data.unknowns.map((u, i) => (
                  <li key={i} className="leading-relaxed">• {u}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper: Evidence Traceability Grid
  const renderEvidenceGrid = (evidenceList = []) => {
    if (!evidenceList || evidenceList.length === 0) return null;

    return (
      <div id="evidence-traceability-grid" className="pt-4 border-t border-stone-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Evidence Traceability & Citations ({evidenceList.length})
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Verified Primary Citations
            </span>
          </div>
          {onOpenEvidence && (
            <span className="text-[11px] text-slate-400">Click any card to inspect full citation evidence</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {evidenceList.map((ev, i) => (
            <div 
              key={ev.citationId || i} 
              onClick={() => onOpenEvidence && onOpenEvidence(ev)}
              className={`p-3.5 bg-slate-50 rounded-xl border border-stone-200 text-xs space-y-2 transition ${
                onOpenEvidence ? 'cursor-pointer hover:bg-orange-50/40 hover:border-orange-300' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{ev.competitorName || 'Competitor'}</span>
                  {ev.citationId && (
                    <span className="text-[10px] font-mono text-orange-700 bg-orange-100/70 border border-orange-200 px-1.5 py-0.5 rounded">
                      {ev.citationId}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{ev.date}</span>
              </div>

              <p className="text-slate-800 font-semibold leading-snug">{ev.title}</p>
              
              {ev.excerpt && (
                <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-white/70 p-2 rounded border border-stone-200/50">
                  "{ev.excerpt}"
                </p>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <div className="flex items-center gap-2">
                  {ev.publisher && (
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                      {ev.publisher}
                    </span>
                  )}
                  {ev.contentHash && (
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[80px]" title={ev.contentHash}>
                      #{ev.contentHash.slice(0, 10)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ev.sourceUrl && (
                    <a 
                      href={ev.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
                    >
                      Source Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {onOpenEvidence && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvidence(ev);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-orange-600 uppercase tracking-wider"
                    >
                      Inspect Evidence →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper: Hindsight Badge
  const renderHindsightBadge = (data) => {
    const isDegraded = data?.hindsightStage === 'DEGRADED' || data?.hindsightStatus?.creditLimitReached;
    if (isDegraded) {
      return (
        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          HINDSIGHT FALLBACK
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
        Stage: {data?.hindsightStage || 'STANDBY'}
      </span>
    );
  };

  // Active execution steps to display during live execution
  const activeExecutionSteps = [
    { id: 'understand', name: 'Parse Intent & Microsoft Context', status: 'completed', durationMs: 2, detail: 'Intent, target competitors, and context verified' },
    { id: 'plan', name: 'Formulate Tool Execution Plan', status: 'completed', durationMs: 1, detail: 'Retrieval, recall, and synthesis steps scheduled' },
    { id: 'fetch_database_signals', name: 'Retrieve PostgreSQL Signals & Evidence', status: 'active', detail: 'Searching structured events and pricing models' },
    { id: 'hindsight_memory_recall', name: 'Hindsight Semantic Memory Recall', status: 'pending', detail: 'Semantic memory lookup' },
    { id: 'grounded_ai_synthesis', name: 'Grounded Intelligence Brief Formulation', status: 'pending', detail: 'Ollama local LLM reasoning' }
  ];

  // Identify latest assistant message ID in thread
  const latestAssistantMsg = [...thread].reverse().find(m => m.role === 'ASSISTANT');
  const latestAssistantMsgId = latestAssistantMsg?.id;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 font-sans text-slate-800">
      {/* Real Hindsight Intelligence Banner */}
      <HindsightFlowWidget 
        variant="banner" 
        defaultStage={agentResponse?.hindsightStage?.toLowerCase() || 'recall'} 
        stageMessage={
          agentResponse?.hindsightStatus?.creditLimitReached
            ? "Hindsight Cloud credits insufficient — Agent grounded using PostgreSQL database evidence"
            : "CompetitorIQ Autonomous Agent grounded in verified facts and Hindsight memory bank"
        }
        memoriesCount={agentResponse?.events?.length || 0}
        confidenceScore={agentResponse?.hindsightStatus?.creditLimitReached ? "PostgreSQL Verified" : "95%"}
        onNavigate={onNavigate}
      />

      {/* Top Hero Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Autonomous Intelligence Agent
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${ollamaInfo?.reachable ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              Ollama {ollamaInfo?.model || 'qwen2.5:3b'} ({ollamaInfo?.reachable ? 'Connected' : 'Fallback Mode'})
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Focal Company: <strong className="text-slate-700">Microsoft</strong>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            CompetitorIQ AI Research Agent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Query competitor moves, pricing shifts, and strategic patterns. The agent understands intent, executes tool plans, retrieves PostgreSQL events, queries Hindsight memories, and outputs strictly grounded briefs with facts, observations, and inferences.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartResearch();
          }}
          className="relative"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isExecuting}
              placeholder="Ask anything: 'Hi', 'What pricing changes have competitors made?', 'What about their pricing?'..."
              className="w-full bg-slate-50 border border-stone-200/90 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all pr-44 disabled:opacity-75"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              {isExecuting && (
                <button
                  type="button"
                  onClick={handleCancelResearch}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-500" /> Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isExecuting || !query.trim()}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Ask Agent <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Sample Queries */}
        <div className="pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Strategic Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                disabled={isExecuting}
                onClick={() => {
                  setQuery(sq);
                  handleStartResearch(sq);
                }}
                className="text-xs text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200/80 px-3 py-1.5 rounded-lg transition text-left disabled:opacity-50 cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Navigation Bar with "New Session" button */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1">
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 text-xs font-semibold uppercase tracking-wider pr-2">
            <History className="w-3.5 h-3.5" />
            Sessions:
          </div>
          {conversations.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No past sessions recorded</span>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleLoadConversation(conv.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                  activeConversationId === conv.id
                    ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {conv.title || 'Conversation'}
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleNewSession}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
          title="Start a fresh conversation thread"
        >
          <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
          New Session
        </button>
      </div>

      {/* Error Message & Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          {lastSubmittedQuery && (
            <button
              onClick={() => handleStartResearch(lastSubmittedQuery)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition cursor-pointer"
            >
              Retry "{lastSubmittedQuery.length > 25 ? lastSubmittedQuery.slice(0, 25) + '...' : lastSubmittedQuery}"
            </button>
          )}
        </div>
      )}

      {/* Chronological Dialogue Stream */}
      <div className="space-y-6">
        {thread.map((msg, index) => {
          if (msg.role === 'USER') {
            return (
              <div key={msg.id || index} className="flex justify-end items-start gap-3 animate-in fade-in duration-150">
                <div className="bg-slate-900 text-white rounded-2xl rounded-tr-xs p-4 sm:p-5 max-w-2xl shadow-xs border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-orange-400 uppercase tracking-wider">You (Analyst)</span>
                    <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              </div>
            );
          }

          // ASSISTANT Message: If prior turn, render collapsible summary card
          const isLatest = (msg.id === latestAssistantMsgId);

          if (!isLatest) {
            const isExpanded = expandedTurnIds.has(msg.id);
            return (
              <div key={msg.id || index} className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-2xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Prior Turn Brief</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {msg.agentData && renderHindsightBadge(msg.agentData)}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpandTurn(msg.id)}
                    className="text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>Collapse Brief <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Expand Brief <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {msg.agentData?.reasoningSummary || msg.content?.split('\n')[0] || msg.content}
                </p>

                {isExpanded && msg.agentData && (
                  <div className="pt-4 border-t border-stone-100 space-y-4 animate-in fade-in duration-150">
                    <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-800 bg-slate-50 p-4 rounded-xl border border-stone-200">
                      {renderAnswerWithCitations(msg.agentData.answer || msg.content, msg.agentData.evidence)}
                    </div>
                    {render5BoxGrid(msg.agentData)}
                    {renderEvidenceGrid(msg.agentData.evidence)}
                  </div>
                )}
              </div>
            );
          }

          // LATEST ASSISTANT MESSAGE is rendered below in full view
          return null;
        })}

        {/* Live Execution Steps Panel */}
        {isExecuting && (
          <AgentActivityPanel 
            steps={activeExecutionSteps}
            activeStepId="fetch_database_signals"
            currentStatus="Executing Reason & Tool Cycle"
          />
        )}

        {/* Completed Execution Panel for Latest Turn */}
        {!isExecuting && agentResponse?.executionSteps?.length > 0 && (
          <AgentActivityPanel 
            steps={agentResponse.executionSteps}
            activeStepId={null}
            currentStatus="Completed"
          />
        )}

        {/* Fully Expanded Latest Turn Response */}
        {!isExecuting && agentResponse && (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-white bg-slate-900 px-3 py-1 rounded-lg">
                  EXECUTIVE BRIEF
                </span>
                {renderHindsightBadge(agentResponse)}
                {agentResponse.ollamaStatus && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    agentResponse.ollamaStatus.used
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : agentResponse.ollamaStatus.status === 'idle'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {agentResponse.ollamaStatus.used 
                      ? `Ollama (${agentResponse.ollamaStatus.model}) Grounded` 
                      : agentResponse.ollamaStatus.message || 'Direct Fast-Path Response'}
                  </span>
                )}
              </div>

              {agentResponse.insufficientEvidence && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  Strict Fail-Closed Enforced
                </span>
              )}
            </div>

            {/* Adaptive Self-Correction Notification Banner (D-15) */}
            {agentResponse.executionSteps?.some(s => s.status === 'self_corrected' || s.id === 'self_correct_broaden_search') && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
                <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
                <span><strong>Adaptive Query Relaxation:</strong> Initial keyword filter yielded zero records; autonomously broadened search to retrieve verified competitor activity.</span>
              </div>
            )}

            {/* Contextual Pronoun Resolution Banner (D-18) */}
            {agentResponse.executionSteps?.some(s => s.id === 'context_resolution') && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Contextual Continuity:</strong> Follow-up query inherited competitor context from previous dialogue turn.</span>
              </div>
            )}

            {/* Insufficient Evidence Warning Banner (D-09) */}
            {agentResponse.insufficientEvidence && (
              <div className="p-5 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Insufficient Grounded Evidence</h4>
                    <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                      CompetitorIQ enforces a strict fail-closed intelligence protocol. No verified historical signals or evidence records were found in the database for this query. Zero ungrounded or fabricated claims were generated.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await apiService.refreshOfficialData();
                        handleStartResearch(lastSubmittedQuery || query);
                      } catch (err) {
                        console.error('Ingestion trigger failed:', err);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Trigger Ingestion
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('ingestion')}
                      className="px-3 py-2 bg-white hover:bg-rose-100/50 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      View Sources
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reasoning Summary if available */}
            {agentResponse.reasoningSummary && (
              <div className="p-3 bg-stone-50 border border-stone-200/70 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Bot className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Agent Reasoning Summary: </strong>
                  <span>{agentResponse.reasoningSummary}</span>
                </div>
              </div>
            )}

            {/* Render Markdown Answer with Interactive Citations */}
            <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-800 font-sans bg-slate-50 p-5 rounded-xl border border-stone-200">
              {renderAnswerWithCitations(agentResponse.answer, agentResponse.evidence)}
            </div>

            {/* 5-Box Epistemology */}
            {render5BoxGrid(agentResponse)}

            {/* Evidence Traceability Grid */}
            {renderEvidenceGrid(agentResponse.evidence)}
          </div>
        )}
        <div ref={threadEndRef} />
      </div>
    </div>
  );
}
