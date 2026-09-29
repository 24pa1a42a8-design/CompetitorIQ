import React from 'react';
import { 
  Columns2, CheckCircle2, XCircle, ArrowRight, Sparkles, 
  ShieldCheck, Network, Layers, Zap, Clock, TrendingUp
} from 'lucide-react';

export default function BeforeAfterView({ onNavigate }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded uppercase">
            Product Architecture Paradigm
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            The Hindsight Advantage
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Standard AI models only see what happened yesterday. CompetitorIQ's Hindsight Memory maintains a persistent, chronological chain of events, allowing strategic leads to spot shifts in long-term momentum that others miss.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => alert('Opening Methodology Specification (PDF)...')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Methodology
          </button>
          <button 
            onClick={() => onNavigate('hindsight_memory')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition"
          >
            Configure My Agents
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            MEMORY DEPTH
          </span>
          <div className="text-2xl font-black text-slate-900">Infinite</div>
          <span className="text-[10px] text-slate-500">vs 24h standard</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TIME TO INSIGHT
          </span>
          <div className="text-2xl font-black text-orange-600">-42%</div>
          <span className="text-[10px] text-slate-500">Latency reduction</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            PATTERN CORRELATION
          </span>
          <div className="text-2xl font-black text-slate-900">94.2%</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Cross-signal accuracy</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            HALLUCINATION RATE
          </span>
          <div className="text-2xl font-black text-emerald-600">Zero</div>
          <span className="text-[10px] text-slate-500">Ground-truth verified</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Column: Short-Term Pulse */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">STANDARD TOOLS</span>
              <h3 className="text-lg font-bold text-slate-900">Short-Term Pulse</h3>
              <p className="text-xs text-slate-500 mt-1">Reactive, unlinked alerts. 24-48h window, no cross-temporal context.</p>
            </div>

            {/* Visual Disconnected Dots */}
            <div className="h-32 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 flex items-center justify-around relative">
              <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              <div className="w-5 h-5 rounded-full bg-slate-300"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300"></div>
              <div className="w-6 h-6 rounded-full bg-slate-300"></div>
              <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              <span className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">Disconnected Isolated Signals</span>
            </div>

            {/* List */}
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Isolation of current PR announcements</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Misses ground-level execution in engineering</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Recent job posting spikes treated as noise</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Direct responses to immediate moves only</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Short-term pricing fluctuations with no trajectory</span>
              </li>
            </ul>
          </div>

          {/* Typical Insight Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">TYPICAL INSIGHT</span>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "Oracle launched a new feature today. That matches a current trend, but there's no context on whether this aligns with an architectural rewrite or a temporary experiment."
            </p>
          </div>
        </div>

        {/* Right Column: Hindsight Intelligence (Highlighted) */}
        <div className="bg-white rounded-xl border-2 border-orange-500 shadow-md p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            CompetitorIQ Advantage
          </div>

          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase text-orange-600 block">PERSISTENT SYSTEM</span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" /> Hindsight Intelligence
              </h3>
              <p className="text-xs text-slate-500 mt-1">Persistent semantic memory connecting events over months & years.</p>
            </div>

            {/* Visual Connected Network */}
            <div className="h-32 bg-orange-50/50 rounded-xl border border-orange-200 p-4 relative flex items-center justify-around overflow-hidden">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 120">
                <path d="M 50 60 Q 150 20, 250 80 T 350 40" fill="none" stroke="#f97316" strokeWidth="2.5" />
                <path d="M 50 60 L 250 80" stroke="#fdba74" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 150 20 L 350 40" stroke="#fdba74" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
              <div className="w-5 h-5 rounded-full bg-orange-600 ring-4 ring-orange-200 z-10 flex items-center justify-center text-[10px] text-white font-bold">1</div>
              <div className="w-6 h-6 rounded-full bg-amber-600 ring-4 ring-amber-200 z-10 flex items-center justify-center text-[10px] text-white font-bold">2</div>
              <div className="w-5 h-5 rounded-full bg-rose-500 ring-4 ring-rose-200 z-10 flex items-center justify-center text-[10px] text-white font-bold">3</div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-emerald-200 z-10 flex items-center justify-center text-[10px] text-white font-bold">4</div>
            </div>

            {/* List */}
            <ul className="space-y-2 text-xs text-slate-800 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cross-quarter hiring pattern analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>M&A groundwork detected 6 months early</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Executive transition correlation with roadmap changes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Patent roadmap shift evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Entropy-aware verification on raw sources</span>
              </li>
            </ul>
          </div>

          {/* Hindsight Intelligence Insight Box */}
          <div className="p-4 bg-orange-50/70 rounded-lg border border-orange-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-orange-700 block">HINDSIGHT INTELLIGENCE</span>
            <p className="text-xs text-orange-950 font-medium leading-relaxed">
              "Oracle's feature launch is the final step in a year-long pivot detected in Q1 hiring records and patent filings. Their intent is to bypass AWS marketplace fees by delivering custom on-premise solutions to key enterprise accounts."
            </p>
          </div>
        </div>

      </div>

      {/* Real-World Application 3 Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Real-World Application</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">Oracle</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pivoted to OCI GenAI: Hindsight flagged Q1 foundational hires before official PR rollout.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">IBM</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Undercut hybrid pricing by 25%: Hindsight correlated the 2-week stealth test to anticipate pricing.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">AWS</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Removed support for legacy integrations: Hindsight recognized this as the same pattern seen before IBM's recent expansion.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Card */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-black tracking-tight text-white">
            Ready to unlock deep strategic context?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Join the world's leading strategy teams using CompetitorIQ to maintain a permanent edge. Stop reacting to news and start anticipating moves.
          </p>
          <div className="flex items-center gap-6 pt-2 text-xs">
            <div>
              <span className="font-extrabold text-white text-base block">11+</span>
              <span className="text-slate-400 text-[10px]">Fortune 500 Teams</span>
            </div>
            <div>
              <span className="font-extrabold text-white text-base block">2.4k</span>
              <span className="text-slate-400 text-[10px]">Tracked Moves</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => alert('Demo request submitted!')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition"
          >
            Request Full Demo
          </button>
          <button 
            onClick={() => onNavigate('executive_report')}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            Start Analysis Now
          </button>
        </div>
      </div>
    </div>
  );
}

