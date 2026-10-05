import React from 'react';
import { 
  Bot, CheckCircle2, Loader2, Circle, BrainCircuit, 
  Database, Scale, DollarSign, Sparkles, RefreshCw, AlertTriangle 
} from 'lucide-react';

function getStepIcon(step, isActive, isCompleted) {
  if (step.status === 'self_corrected' || step.id === 'self_correct_broaden_search') {
    return <RefreshCw className="w-4 h-4 text-indigo-600" />;
  }
  if (step.status === 'degraded') {
    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  }
  if (isCompleted) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  }
  if (isActive) {
    return <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />;
  }
  return <Circle className="w-3.5 h-3.5 text-slate-300" />;
}

function getToolBadge(toolName) {
  switch (toolName) {
    case 'search_events':
      return { label: 'search_events', icon: <Database className="w-2.5 h-2.5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'get_competitor_comparison':
      return { label: 'competitor_comparison', icon: <Scale className="w-2.5 h-2.5" />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'analyze_pricing_signals':
      return { label: 'pricing_signals', icon: <DollarSign className="w-2.5 h-2.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'correlate_strategic_patterns':
      return { label: 'strategic_patterns', icon: <Sparkles className="w-2.5 h-2.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'recall_memory':
      return { label: 'recall_memory', icon: <BrainCircuit className="w-2.5 h-2.5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    default:
      return null;
  }
}

export default function AgentActivityPanel({ steps = [], activeStepId, currentStatus }) {
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'self_corrected').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const hasSelfCorrection = steps.some((s) => s.status === 'self_corrected' || s.id === 'self_correct_broaden_search');

  return (
    <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-2xs border border-stone-200/80 space-y-4 animate-in fade-in duration-200 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
                Autonomous Agent Orchestrator & Tool Registry
              </h3>
              {hasSelfCorrection && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" /> Self-Corrected
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Status: <span className="text-orange-600 font-bold">{currentStatus || 'Processing'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution Progress</span>
            <span className="text-xs font-mono font-bold text-emerald-600">{progressPercent}%</span>
          </div>
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isSelfCorrected = step.status === 'self_corrected' || step.id === 'self_correct_broaden_search';
          const isDegraded = step.status === 'degraded';
          const isActive = step.id === activeStepId || step.status === 'active';
          const toolBadge = step.tool ? getToolBadge(step.tool) : null;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition flex items-start gap-2.5 ${
                isSelfCorrected
                  ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 ring-1 ring-indigo-500/20'
                  : isDegraded
                  ? 'bg-amber-50/60 border-amber-300 text-amber-950'
                  : isCompleted
                  ? 'bg-slate-50/80 border-stone-200/80 text-slate-600'
                  : isActive
                  ? 'bg-orange-50/80 border-orange-400 text-slate-900 ring-1 ring-orange-500/20'
                  : 'bg-white border-stone-200/40 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {getStepIcon(step, isActive, isCompleted)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="font-bold truncate text-xs text-slate-900">
                    {step.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {toolBadge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${toolBadge.color}`}>
                        {toolBadge.icon}
                        {toolBadge.label}
                      </span>
                    )}
                    {typeof step.durationMs === 'number' && (
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {step.durationMs}ms
                      </span>
                    )}
                    {typeof step.itemCount === 'number' && step.itemCount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        {step.itemCount} items
                      </span>
                    )}
                  </div>
                </div>
                {step.detail && (
                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed line-clamp-2">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Pill */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <BrainCircuit className="w-3.5 h-3.5 text-orange-600" />
          Hindsight Vector Memory & Ollama Reasoning Loop
        </span>
        <span className="text-slate-400">
          Agent Protocol v3.0 (Tool Registry Active)
        </span>
      </div>
    </div>
  );
}
