import React, { useState } from 'react';
import { 
  Sparkles, ExternalLink, Download, BrainCircuit, RefreshCw, 
  ShieldCheck, ArrowRight, Table, Send, Copy
} from 'lucide-react';

export default function ResearchResultsView({ results, onAskFollowUp, onOpenEvidence }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!results) return null;

  const { plan, competitors, hindsightContext, webSources, comparison, changes, insights, report } = results;

  const handleDownloadReport = () => {
    const element = document.createElement('a');
    const file = new Blob([report.markdownText], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `CompetitorIQ_Report_${new Date().toISOString().substring(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report.markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpQuery.trim()) return;
    onAskFollowUp(followUpQuery);
    setFollowUpQuery('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans text-slate-800">
      {/* Top Results Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Agent Intelligence Brief
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                98.4% Confidence Score
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {plan.query}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Domain: <strong className="text-slate-700">{plan.domainCategory}</strong> • Analyzed {competitors.length} competitors across {webSources.length} verified web sources.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-slate-700 border border-stone-200 text-xs font-semibold rounded-xl transition"
            >
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Brief'}
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-orange-300" /> Export Report (.md)
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto text-xs font-semibold text-slate-600">
          {[
            { id: 'summary', label: 'Executive Summary' },
            { id: 'changes', label: `What Changed? (${changes.length})` },
            { id: 'comparison', label: 'Competitor Comparison' },
            { id: 'insights', label: `AI Insights (${insights.length})` },
            { id: 'sources', label: `Sources & Telemetry (${webSources.length})` },
            { id: 'hindsight', label: 'Hindsight Memory Context' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600 font-extrabold bg-orange-50/40'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" /> Executive Intelligence Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-stone-200/80">
              {report.executiveSummary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COMPETITORS IDENTIFIED</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{competitors.length} RIVALS</span>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SIGNALS & CHANGES DETECTED</span>
                <span className="text-2xl font-black text-orange-600 mt-1 block">{changes.length} MOVEMENTS</span>
              </div>
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HINDSIGHT CONTEXT MATCH</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{hindsightContext.length} MEMORIES</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Discovered Competitor Ecosystem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {competitors.map((comp, idx) => (
                <div key={idx} className="p-4 bg-slate-50/80 rounded-2xl border border-stone-200/80 space-y-2 hover:border-orange-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{comp.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {comp.badge || 'Tracked'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{comp.category}</div>
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Pricing</span>
                    <span className="font-semibold text-slate-800">{comp.pricingRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: What Changed? */}
      {activeTab === 'changes' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-600" /> What Changed? (Delta Detection)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Differences detected between historical Hindsight baseline and latest research data.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">{changes.length} verified events</span>
          </div>

          <div className="space-y-4">
            {changes.map((ch) => (
              <div key={ch.id} className="p-4 bg-slate-50/70 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
                      {ch.competitor}
                    </span>
                    <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {ch.changeType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono">{ch.date}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {ch.confidence}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{ch.title}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">PREVIOUS BASELINE</span>
                    <span className="text-slate-700 leading-relaxed block">{ch.previousState}</span>
                  </div>
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200 text-orange-950">
                    <span className="text-[10px] font-bold text-orange-700 block uppercase mb-1">OBSERVED CURRENT STATE</span>
                    <span className="font-medium leading-relaxed block">{ch.currentState}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Source: <strong className="text-slate-600">{ch.source}</strong></span>
                  <button 
                    onClick={() => onOpenEvidence({ title: ch.title, entity: ch.competitor, description: ch.currentState })}
                    className="font-bold text-orange-600 hover:text-orange-800 underline"
                  >
                    View Evidence Log →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-orange-600" /> Multi-Competitor Comparison Matrix
            </h3>
            <span className="text-xs text-slate-400">Verified Fact vs AI Analysis Legend</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-stone-200 text-slate-700">
                  <th className="p-3 font-bold w-1/4">Comparison Vector</th>
                  {competitors.map((c, i) => (
                    <th key={i} className="p-3 font-bold text-slate-900">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {comparison.matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900 bg-slate-50/30">{row.field}</td>
                    {competitors.map((c, i) => {
                      const key = c.name.split(' ')[0];
                      const val = row[key] || row[c.name] || 'N/A';
                      return (
                        <td key={i} className="p-3 text-slate-700 leading-relaxed">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI Insights */}
      {activeTab === 'insights' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" /> AI Strategic Insights & Threat Analysis
          </h3>

          <div className="space-y-4">
            {insights.map((ins) => (
              <div key={ins.id} className="p-5 bg-slate-50/80 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                    {ins.type}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    [{ins.badge}] • {ins.confidence} Confidence
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{ins.title}</h4>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <strong className="text-slate-900 block mb-0.5">AI Analytical Evaluation:</strong>
                    {ins.analysis}
                  </div>
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-950">
                    <strong className="text-amber-900 block mb-0.5">Analyst Tactical Recommendation:</strong>
                    {ins.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Follow-Up Bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-600" /> Continue Conversation or Request Follow-up Analysis
        </span>

        <form onSubmit={handleFollowUpSubmit} className="relative">
          <input
            type="text"
            value={followUpQuery}
            onChange={(e) => setFollowUpQuery(e.target.value)}
            placeholder="Ask a follow-up question (e.g., 'Compare only pricing', 'What changed this month?')..."
            className="w-full bg-[#F8FAFC] border border-stone-200 rounded-xl pl-4 pr-24 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
