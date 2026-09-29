import React from 'react';
import { 
  Bot, CheckCircle2, Loader2, Circle, BrainCircuit 
} from 'lucide-react';

export default function AgentActivityPanel({ steps = [], activeStepId, currentStatus }) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-2xs border border-stone-200/80 space-y-4 animate-in fade-in duration-200 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
              Autonomous Agent Orchestrator
            </h3>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.id === activeStepId || step.status === 'active';

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition flex items-start gap-2.5 ${
                isCompleted
                  ? 'bg-slate-50/80 border-stone-200/80 text-slate-600'
                  : isActive
                  ? 'bg-orange-50/80 border-orange-400 text-slate-900 ring-1 ring-orange-500/20'
                  : 'bg-white border-stone-200/40 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="font-bold truncate flex items-center gap-1.5 text-xs text-slate-900">
                  <span>{step.name}</span>
                </div>
                {step.detail && (
                  <p className="text-[10px] text-slate-500 line-clamp-1 font-mono">
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
          Hindsight Vector Memory: Active & Syncing
        </span>
        <span className="text-slate-400">
          Agent Protocol v2.4
        </span>
      </div>
    </div>
  );
}
