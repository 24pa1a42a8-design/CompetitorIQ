import React, { useState, useEffect } from 'react';
import { 
  Database, BrainCircuit, Sparkles, CheckCircle2, ArrowRight, Activity, ShieldCheck, AlertTriangle 
} from 'lucide-react';

export default function HindsightFlowWidget({
  defaultStage = 'reflect',
  signalCount,
  memoriesCount,
  confidence,
  confidenceScore,
  customTitle,
  customSubtext,
  stageMessage,
  variant = 'banner', // 'banner' | 'compact' | 'inline'
  onNavigate
}) {
  const [activeStage, setActiveStage] = useState(defaultStage?.toLowerCase() || 'reflect');

  useEffect(() => {
    if (defaultStage) {
      setActiveStage(defaultStage.toLowerCase());
    }
  }, [defaultStage]);

  const effectiveCount = signalCount !== undefined ? signalCount : (memoriesCount !== undefined ? memoriesCount : 8);
  const effectiveSubtext = customSubtext || stageMessage;

  const isDegraded = activeStage === 'degraded' || 
    activeStage === 'standby' ||
    (effectiveSubtext && (
      effectiveSubtext.toLowerCase().includes('insufficient') ||
      effectiveSubtext.toLowerCase().includes('credit') ||
      effectiveSubtext.toLowerCase().includes('fallback')
    ));

  const effectiveConfidence = confidence || confidenceScore || (isDegraded ? 'PostgreSQL Grounded' : '94.2%');

  const stages = [
    {
      id: 'retain',
      label: 'RETAIN',
      subtitle: isDegraded ? 'PostgreSQL Store' : 'Signal Ingestion',
      icon: Database,
      statusMessage: isDegraded ? 'Competitor telemetry saved in DB' : 'New competitor signal stored',
      detail: isDegraded
        ? 'Storing pricing diffs, news releases, and hiring telemetry directly into PostgreSQL.'
        : 'Storing raw telemetry, pricing diffs & hire events into persistent vector memory.'
    },
    {
      id: 'recall',
      label: 'RECALL',
      subtitle: isDegraded ? 'Relational Search' : 'Memory Retrieval',
      icon: BrainCircuit,
      statusMessage: isDegraded ? 'Grounded DB events retrieved' : 'Relevant memories retrieved',
      detail: isDegraded
        ? 'Querying PostgreSQL indexed events, pricing tables, and competitor metadata.'
        : 'Connecting historical Q1-Q4 signals and cross-temporal competitor records.'
    },
    {
      id: 'reflect',
      label: 'REFLECT',
      subtitle: isDegraded ? 'Grounded AI Synthesis' : 'Pattern Synthesis',
      icon: Sparkles,
      statusMessage: isDegraded ? 'Grounded brief generated' : 'Strategic pattern identified',
      detail: isDegraded
        ? `Synthesizing ${effectiveCount} verified database events with local Ollama LLM reasoning.`
        : `Synthesizing ${effectiveCount} connected signals into high-confidence actionable insights.`
    }
  ];

  const getStageStatus = (stageId) => {
    if (isDegraded) {
      if (stageId === 'retain' || stageId === 'recall') return 'completed';
      return 'active';
    }
    const order = ['retain', 'recall', 'reflect'];
    const currentIndex = order.indexOf(activeStage);
    const stageIndex = order.indexOf(stageId);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const currentStageObj = stages.find(s => s.id === activeStage) || stages[2];

  if (variant === 'compact') {
    return (
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDegraded ? 'bg-amber-500' : 'bg-orange-600'} animate-pulse`}></span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              {isDegraded ? 'HINDSIGHT FALLBACK' : 'HINDSIGHT INTELLIGENCE'}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            isDegraded 
              ? 'text-amber-800 bg-amber-50 border-amber-200' 
              : 'text-orange-700 bg-orange-50 border-orange-200'
          }`}>
            {effectiveConfidence}
          </span>
        </div>

        {/* 3 Stage Horizontal Flow */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {stages.map((st, idx) => {
            const status = getStageStatus(st.id);

            return (
              <button
                key={st.id}
                onClick={() => setActiveStage(st.id)}
                className={`p-2 rounded-xl text-left border transition duration-150 flex flex-col justify-between ${
                  status === 'active'
                    ? (isDegraded 
                        ? 'bg-amber-50/90 border-amber-400 shadow-2xs text-amber-950 font-bold'
                        : 'bg-orange-50/90 border-orange-500 shadow-2xs text-orange-950 font-bold')
                    : status === 'completed'
                    ? 'bg-stone-50 border-stone-200 text-slate-700'
                    : 'bg-white border-stone-100 text-slate-400 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className={status === 'active' ? (isDegraded ? 'text-amber-700 font-extrabold' : 'text-orange-600 font-extrabold') : 'text-slate-500'}>
                    {st.label}
                  </span>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <st.icon className={`w-3 h-3 ${status === 'active' ? (isDegraded ? 'text-amber-600' : 'text-orange-600') : 'text-slate-400'}`} />
                  )}
                </div>
                <span className="text-[9px] text-slate-500 truncate mt-1 block font-medium">
                  {st.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Status Output */}
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <span className={`font-bold text-[11px] uppercase ${isDegraded ? 'text-amber-700' : 'text-orange-600'}`}>
              {currentStageObj.label}:
            </span>
            <span className="text-[11px]">{currentStageObj.statusMessage}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
            {effectiveCount} Signals
          </span>
        </div>
      </div>
    );
  }

  // Default 'banner' variant
  return (
    <div className={`p-5 rounded-2xl border shadow-2xs space-y-4 font-sans relative overflow-hidden ${
      isDegraded 
        ? 'bg-amber-50/20 border-amber-200/90' 
        : 'bg-white border-stone-200/90'
    }`}>
      {/* Top Meta Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
            isDegraded 
              ? 'bg-amber-100/80 border-amber-300 text-amber-700' 
              : 'bg-orange-50 border-orange-200 text-orange-600'
          }`}>
            {isDegraded ? (
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            ) : (
              <Sparkles className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {customTitle || (isDegraded ? 'Intelligence Engine Status (PostgreSQL Fallback)' : 'Hindsight Intelligence Flow')}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                isDegraded 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {isDegraded ? 'RETAIN (DB) → RECALL (DB) → REFLECT (OLLAMA)' : 'RETAIN → RECALL → REFLECT'}
              </span>
              {isDegraded && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Cloud Credits Exhausted — Safe Fallback Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {effectiveSubtext || (isDegraded 
                ? `Hindsight Cloud credits insufficient. Operating in verified PostgreSQL database fallback mode across ${effectiveCount} signals.`
                : `Continuous vector stream connecting ${effectiveCount} competitor signals into verified strategic patterns.`)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Connected: <strong className="text-slate-900">{effectiveCount} signals</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Grounding: <strong className={isDegraded ? 'text-amber-800' : 'text-emerald-700'}>{effectiveConfidence}</strong>
          </span>
        </div>
      </div>

      {/* 3-Stage Visual Flow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {stages.map((st, idx) => {
          const status = getStageStatus(st.id);
          const isLast = idx === stages.length - 1;

          return (
            <div
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between space-y-2 ${
                status === 'active'
                  ? (isDegraded 
                      ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-2 ring-amber-400/20'
                      : 'bg-orange-50/80 border-orange-500 shadow-xs ring-2 ring-orange-500/20')
                  : status === 'completed'
                  ? 'bg-stone-50/90 border-stone-200/90 text-slate-700 hover:bg-stone-100/60'
                  : 'bg-white border-stone-200/60 text-slate-500 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    status === 'active'
                      ? (isDegraded ? 'bg-amber-600 text-white shadow-xs' : 'bg-orange-600 text-white shadow-xs')
                      : status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-slate-600'
                  }`}>
                    {status === 'completed' ? '✓' : idx + 1}
                  </span>
                  <span className={`text-xs font-black tracking-wider ${
                    status === 'active' ? (isDegraded ? 'text-amber-950' : 'text-orange-950') : 'text-slate-800'
                  }`}>
                    {st.label}
                  </span>
                </div>

                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  status === 'active'
                    ? (isDegraded ? 'bg-amber-600 text-white' : 'bg-orange-600 text-white')
                    : status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-slate-400'
                }`}>
                  {status === 'active' ? 'ACTIVE' : status === 'completed' ? 'COMPLETED' : 'PENDING'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {st.statusMessage}
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  {st.detail}
                </p>
              </div>

              {/* Connecting Indicator Arrow for Next Step */}
              {!isLast && (
                <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-5 h-5 rounded-full bg-white border border-stone-200 text-slate-400 flex items-center justify-center text-[10px] shadow-2xs">
                    →
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Action & Link */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isDegraded ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
          <span>Current execution state: <strong className="text-slate-900 font-bold">{currentStageObj.statusMessage}</strong></span>
        </div>
        {onNavigate && (
          <button 
            type="button"
            onClick={() => onNavigate(activeStage === 'retain' ? 'activity_timeline' : activeStage === 'recall' ? 'hindsight_memory' : 'connect_dots')}
            className={`font-bold flex items-center gap-1 text-xs transition ${
              isDegraded ? 'text-amber-700 hover:text-amber-900' : 'text-orange-600 hover:text-orange-800'
            }`}
          >
            Explore {currentStageObj.label} Details →
          </button>
        )}
      </div>
    </div>
  );
}
