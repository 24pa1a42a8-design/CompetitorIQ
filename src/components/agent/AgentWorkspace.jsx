import React, { useState, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, RefreshCw, AlertCircle, CheckCircle2, ExternalLink
} from 'lucide-react';
import HindsightFlowWidget from '../common/HindsightFlowWidget';
import apiService from '../../services/apiService';

export default function AgentWorkspace({ onNavigate, onOpenEvidence }) {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [agentResponse, setAgentResponse] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [ollamaInfo, setOllamaInfo] = useState(null);

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
  }, []);

  const sampleQueries = [
    "What changed recently for Oracle?",
    "What has IBM been doing over the last few months?",
    "Compare Oracle and IBM pricing and expansion strategies",
    "What patterns are emerging in enterprise cloud AI moves?"
  ];

  const handleStartResearch = async (targetQuery) => {
    const queryToRun = targetQuery || query;
    if (!queryToRun.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);

    try {
      const res = await apiService.queryAgent(queryToRun, {
        conversationId: activeConversationId || undefined
      });

      if (res?.data) {
        setAgentResponse(res.data);
        if (res.data.conversationId) {
          setActiveConversationId(res.data.conversationId);
        }
        fetchConversations();
      }
    } catch (err) {
      setError(err.message || 'Agent execution failed. Please retry.');
    } finally {
      setIsExecuting(false);
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
            REST API Connected
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            CompetitorIQ AI Research Agent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Query competitor moves, pricing shifts, and strategic patterns. The agent retrieves PostgreSQL events, queries Hindsight memories, and outputs strictly grounded briefs with facts, observations, and inferences.
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
              placeholder="Ask anything: What changed recently for Oracle? Compare IBM and Oracle expansion strategies..."
              className="w-full bg-slate-50 border border-stone-200/90 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all pr-36"
            />
            <button
              type="submit"
              disabled={isExecuting || !query.trim()}
              className="absolute right-2.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
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
                onClick={() => {
                  setQuery(sq);
                  handleStartResearch(sq);
                }}
                className="text-xs text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200/80 px-3 py-1.5 rounded-lg transition text-left"
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
          <button
            onClick={() => handleStartResearch()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isExecuting && (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Agent Executing Grounded Analysis</h3>
          <p className="text-xs text-slate-500">Querying PostgreSQL events, checking Hindsight vector memory, and formulating facts...</p>
        </div>
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
                Stage: {agentResponse.hindsightStage || 'RECALL'}
              </span>
              {agentResponse.ollamaStatus && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  agentResponse.ollamaStatus.used
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {agentResponse.ollamaStatus.used 
                    ? `Ollama (${agentResponse.ollamaStatus.model}) Grounded` 
                    : 'Deterministic Synthesis Fallback'}
                </span>
              )}
            </div>

            {agentResponse.insufficientEvidence && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                Insufficient Evidence
              </span>
            )}
          </div>

          {/* Render Markdown Answer */}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-800 font-sans bg-slate-50 p-5 rounded-xl border border-stone-200">
            {agentResponse.answer}
          </div>

          {/* Structured Categorized Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* VERIFIED FACTS */}
            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 space-y-2">
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

            {/* STRATEGIC OBSERVATIONS */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 space-y-2">
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

            {/* LOGICAL INFERENCES */}
            <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 space-y-2">
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

            {/* UNKNOWNS & DATA GAPS */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
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

          {/* Evidence Traceability */}
          {agentResponse.evidence?.length > 0 && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Evidence Traceability & Citations ({agentResponse.evidence.length})
                </h3>
                {onOpenEvidence && (
                  <span className="text-[11px] text-slate-400">Click any card to inspect full citation evidence</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agentResponse.evidence.map((ev, i) => (
                  <div 
                    key={i} 
                    onClick={() => onOpenEvidence && onOpenEvidence(ev)}
                    className={`p-3 bg-slate-50 rounded-lg border border-stone-200 text-xs space-y-1.5 transition ${
                      onOpenEvidence ? 'cursor-pointer hover:bg-orange-50/50 hover:border-orange-300' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.competitorName || 'Competitor'}</span>
                      <span className="text-[10px] text-slate-400">{ev.date}</span>
                    </div>
                    <p className="text-slate-700 font-semibold">{ev.title}</p>
                    {ev.excerpt && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 italic">"{ev.excerpt}"</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      {ev.sourceUrl ? (
                        <a 
                          href={ev.sourceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
                        >
                          Source Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span />}
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
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
