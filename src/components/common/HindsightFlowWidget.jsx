import React, { useState } from 'react';
import { 
  Database, BrainCircuit, Sparkles, CheckCircle2, ArrowRight, Activity, ShieldCheck 
} from 'lucide-react';

export default function HindsightFlowWidget({
  defaultStage = 'reflect',
  signalCount = 8,
  confidence = '94.2%',
  customTitle,
  customSubtext,
  variant = 'banner', // 'banner' | 'compact' | 'inline'
  onNavigate
}) {
  const [activeStage, setActiveStage] = useState(defaultStage);

  const stages = [
    {
      id: 'retain',
      label: 'RETAIN',
      subtitle: 'Signal Ingestion',
      icon: Database,
      statusMessage: 'New competitor signal stored',
      detail: 'Storing raw telemetry, pricing diffs & hire events into persistent vector memory.'
    },
    {
      id: 'recall',
      label: 'RECALL',
      subtitle: 'Memory Retrieval',
      icon: BrainCircuit,
      statusMessage: 'Relevant memories retrieved',
      detail: 'Connecting historical Q1-Q4 signals and cross-temporal competitor records.'
    },
    {
      id: 'reflect',
      label: 'REFLECT',
      subtitle: 'Pattern Synthesis',
      icon: Sparkles,
      statusMessage: 'Strategic pattern identified',
      detail: `Synthesizing ${signalCount} connected signals into high-confidence actionable insights.`
    }
  ];

  const getStageStatus = (stageId) => {
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
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
              HINDSIGHT INTELLIGENCE
            </span>
          </div>
          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            {confidence} Confidence
          </span>
        </div>

        {/* 3 Stage Horizontal Flow */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {stages.map((st, idx) => {
            const status = getStageStatus(st.id);
            const isLast = idx === stages.length - 1;

            return (
              <button
                key={st.id}
                onClick={() => setActiveStage(st.id)}
                className={`p-2 rounded-xl text-left border transition duration-150 flex flex-col justify-between ${
                  status === 'active'
                    ? 'bg-orange-50/90 border-orange-500 shadow-2xs text-orange-950 font-bold'
                    : status === 'completed'
                    ? 'bg-stone-50 border-stone-200 text-slate-700'
                    : 'bg-white border-stone-100 text-slate-400 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className={status === 'active' ? 'text-orange-600 font-extrabold' : 'text-slate-500'}>
                    {st.label}
                  </span>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <st.icon className={`w-3 h-3 ${status === 'active' ? 'text-orange-600' : 'text-slate-400'}`} />
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
            <span className="font-bold text-orange-600 text-[11px] uppercase">{currentStageObj.label}:</span>
            <span className="text-[11px]">{currentStageObj.statusMessage}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
            {signalCount} Memories
          </span>
        </div>
      </div>
    );
  }

  // Default 'banner' variant
  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4 font-sans relative overflow-hidden">
      {/* Top Meta Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {customTitle || 'Hindsight Intelligence Flow'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                RETAIN → RECALL → REFLECT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {customSubtext || `Continuous vector stream connecting ${signalCount} competitor signals into verified strategic patterns.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Connected: <strong className="text-slate-900">{signalCount} signals</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Confidence: <strong className="text-emerald-700">{confidence}</strong>
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
                  ? 'bg-orange-50/80 border-orange-500 shadow-xs ring-2 ring-orange-500/20'
                  : status === 'completed'
                  ? 'bg-stone-50/90 border-stone-200/90 text-slate-700 hover:bg-stone-100/60'
                  : 'bg-white border-stone-200/60 text-slate-500 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    status === 'active'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-slate-600'
                  }`}>
                    {status === 'completed' ? '✓' : idx + 1}
                  </span>
                  <span className={`text-xs font-black tracking-wider ${
                    status === 'active' ? 'text-orange-950' : 'text-slate-800'
                  }`}>
                    {st.label}
                  </span>
                </div>

                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  status === 'active'
                    ? 'bg-orange-600 text-white'
                    : status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-slate-400'
                }`}>
                  {status === 'active' ? 'ACTIVE STAGE' : status === 'completed' ? 'COMPLETED' : 'PENDING'}
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
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Current active execution: <strong className="text-slate-900 font-bold">{currentStageObj.statusMessage}</strong></span>
        </div>
        {onNavigate && (
          <button 
            onClick={() => onNavigate(activeStage === 'retain' ? 'activity_timeline' : activeStage === 'recall' ? 'hindsight_memory' : 'connect_dots')}
            className="font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 text-xs transition"
          >
            Explore {currentStageObj.label} Details →
          </button>
        )}
      </div>
    </div>
  );
}
