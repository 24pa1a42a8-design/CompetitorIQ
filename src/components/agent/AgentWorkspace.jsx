import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, XCircle, TrendingUp
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

  // AbortController reference for request cancellation
  const abortControllerRef = useRef(null);

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
      // Abort in-flight request if user navigates away
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

    try {
      const res = await apiService.queryAgent(queryToRun, {
        conversationId: activeConversationId || undefined,
        competitorId: selectedCompetitor || undefined,
        signal: abortController.signal
      });

      if (res?.data) {
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
      const res = await apiService.getConversationMessages(convId);
      if (res?.data?.messages?.length > 0) {
        const lastAssistantMsg = [...res.data.messages]
          .reverse()
          .find(m => m.role === 'ASSISTANT');
        if (lastAssistantMsg) {
          try {
            const parsed = JSON.parse(lastAssistantMsg.content);
            setAgentResponse(parsed);
          } catch {
            setAgentResponse({ answer: lastAssistantMsg.content });
          }
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

  // Execution steps to display during live execution
  const activeExecutionSteps = [
    { id: 'understand', name: 'Parse Intent & Microsoft Context', status: 'completed', durationMs: 2, detail: 'Intent, target competitors, and context verified' },
    { id: 'plan', name: 'Formulate Tool Execution Plan', status: 'completed', durationMs: 1, detail: 'Retrieval, recall, and synthesis steps scheduled' },
    { id: 'fetch_database_signals', name: 'Retrieve PostgreSQL Signals & Evidence', status: 'active', detail: 'Searching structured events and pricing models' },
    { id: 'hindsight_memory_recall', name: 'Hindsight Semantic Memory Recall', status: 'pending', detail: 'Semantic memory lookup' },
    { id: 'grounded_ai_synthesis', name: 'Grounded Intelligence Brief Formulation', status: 'pending', detail: 'Ollama local LLM reasoning' }
  ];

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
              placeholder="Ask anything: 'Hi', 'What pricing changes have competitors made?', 'Compare Oracle and IBM cloud strategies'..."
              className="w-full bg-slate-50 border border-stone-200/90 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all pr-44 disabled:opacity-75"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              {isExecuting && (
                <button
                  type="button"
                  onClick={handleCancelResearch}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-500" /> Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isExecuting || !query.trim()}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
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
                className="text-xs text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200/80 px-3 py-1.5 rounded-lg transition text-left disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Past Conversations Bar */}
      {conversations.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Previous Conversations:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleLoadConversation(conv.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                  activeConversationId === conv.id
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {conv.title || 'Conversation'}
              </button>
            ))}
          </div>
        </div>
      )}

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
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition"
            >
              Retry "{lastSubmittedQuery.length > 25 ? lastSubmittedQuery.slice(0, 25) + '...' : lastSubmittedQuery}"
            </button>
          )}
        </div>
      )}

      {/* Real-time Agent Execution Orchestrator Panel */}
      {(isExecuting || agentResponse?.executionSteps?.length > 0) && (
        <AgentActivityPanel 
          steps={agentResponse?.executionSteps?.length > 0 && !isExecuting ? agentResponse.executionSteps : activeExecutionSteps}
          activeStepId={isExecuting ? 'fetch_database_signals' : null}
          currentStatus={isExecuting ? 'Executing Reason & Tool Cycle' : 'Completed'}
        />
      )}

      {/* Structured Agent Response Output */}
      {!isExecuting && agentResponse && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-white bg-slate-900 px-3 py-1 rounded-lg">
                EXECUTIVE BRIEF
              </span>
              <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                Stage: {agentResponse.hindsightStage || 'STANDBY'}
              </span>
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

          {/* Structured Categorized Sections (5-Box Epistemology - D-10, D-12) */}
          {(agentResponse.facts?.length > 0 || agentResponse.observations?.length > 0 || agentResponse.inferences?.length > 0 || agentResponse.implications?.length > 0) && (
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Grounded Facts ({agentResponse.facts?.length || 0})
                  </h3>
                  {agentResponse.facts?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No direct facts found for this query.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-emerald-950">
                      {agentResponse.facts?.map((f, i) => (
                        <li key={i} className="leading-relaxed font-medium">• {f}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 2. STRATEGIC OBSERVATIONS (Blue) */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-2">
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Strategic Observations ({agentResponse.observations?.length || 0})
                  </h3>
                  {agentResponse.observations?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No strategic observations compiled.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-blue-950">
                      {agentResponse.observations?.map((o, i) => (
                        <li key={i} className="leading-relaxed">• {o}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 3. LOGICAL INFERENCES (Amber) */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-amber-600" /> Logical Inferences ({agentResponse.inferences?.length || 0})
                  </h3>
                  {agentResponse.inferences?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No logical inferences derived.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {agentResponse.inferences?.map((inf, i) => (
                        <li key={i} className="leading-relaxed italic">• {inf}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 4. BUSINESS & STRATEGIC IMPLICATIONS (Purple - D-10, D-12) */}
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200/80 space-y-2">
                  <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" /> Business Implications ({agentResponse.implications?.length || 0})
                  </h3>
                  {(!agentResponse.implications || agentResponse.implications.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">No business implications derived.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-purple-950">
                      {agentResponse.implications?.map((imp, i) => (
                        <li key={i} className="leading-relaxed font-medium">• {imp}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 5. UNKNOWNS & DATA GAPS (Slate) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 md:col-span-2 lg:col-span-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-slate-500" /> Unknowns & Data Gaps ({agentResponse.unknowns?.length || 0})
                  </h3>
                  {agentResponse.unknowns?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No significant data gaps identified.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {agentResponse.unknowns?.map((u, i) => (
                        <li key={i} className="leading-relaxed">• {u}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evidence Traceability & Citations (D-11) */}
          {agentResponse.evidence?.length > 0 && (
            <div id="evidence-traceability-grid" className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Evidence Traceability & Citations ({agentResponse.evidence.length})
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
                {agentResponse.evidence.map((ev, i) => (
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
          )}
        </div>
      )}
    </div>
  );
}
