import React, { useState, useEffect } from 'react';
import { 
  Printer, Sparkles, RefreshCw, AlertTriangle, ShieldAlert, 
  CheckCircle, FileText, ExternalLink, Cpu, Eye, Layers, TrendingUp, Filter, Activity, X
} from 'lucide-react';
import HindsightFlowWidget from '../components/common/HindsightFlowWidget';
import apiService from '../services/apiService';

const REPORT_TYPES = [
  { value: 'EXECUTIVE_SUMMARY', label: 'Executive Summary Brief' },
  { value: 'COMPETITOR_DEEP_DIVE', label: 'Competitor Deep Dive' },
  { value: 'WEEKLY_INTELLIGENCE', label: 'Weekly Tactical Digest (7d)' },
  { value: 'MONTHLY_INTELLIGENCE', label: 'Monthly Strategic Brief (30d)' },
  { value: 'COMPETITIVE_LANDSCAPE', label: 'Competitive Landscape Matrix' }
];

export default function ExecutiveReportView({ onNavigate }) {
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [reportType, setReportType] = useState('EXECUTIVE_SUMMARY');
  const [windowDays, setWindowDays] = useState(90);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Evidence modal state
  const [activeEvidence, setActiveEvidence] = useState(null);

  useEffect(() => {
    async function initData() {
      try {
        const compRes = await apiService.getCompetitors().catch(() => ({ data: [] }));
        setCompetitors(compRes?.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    initData();
  }, []);

  const fetchOrGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.generateExecutiveReport({
        competitorIds: selectedCompId ? [selectedCompId] : [],
        reportType,
        windowDays: Number(windowDays)
      });
      setReport(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to assemble executive intelligence report.');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchOrGenerateReport();
  }, [reportType, windowDays, selectedCompId]);

  const handleGenerateClick = () => {
    setGenerating(true);
    fetchOrGenerateReport();
  };

  const sections = report?.sections || {};
  const metadata = report?.metadata || {};
  const timeframe = report?.timeframe || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Hindsight Intelligence Banner */}
      <HindsightFlowWidget 
        variant="banner" 
        defaultStage="reflect" 
        stageMessage="Synthesizing retained signals, historical timelines, and cross-competitor patterns into executive intelligence" 
        memoriesCount={metadata.eventCount || 0}
        confidenceScore="98%"
      />

      {/* Top Banner / Document Metadata */}
      <div className="bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest text-orange-300 bg-orange-950/80 border border-orange-700/50 px-2 py-0.5 rounded uppercase">
              {reportType.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">POSTGRESQL-VERIFIED GROUND TRUTH</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {report?.title || 'Executive Competitor Intelligence Report'}
          </h1>
          <p className="text-xs text-slate-300">
            Generated Live • Grounded in {metadata.eventCount || 0} verified events, {metadata.alertCount || 0} alerts, and {metadata.patternCount || 0} connected patterns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button 
            onClick={fetchOrGenerateReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Brief
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF / Print
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase mr-1">
            <Filter className="w-3.5 h-3.5" /> Options:
          </div>

          {/* Report Type Selector */}
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            {REPORT_TYPES.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>

          {/* Timeframe Selector */}
          <select 
            value={windowDays} 
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            <option value={7}>7 Days (Weekly Tactical)</option>
            <option value={30}>30 Days (Monthly Digest)</option>
            <option value={60}>60 Days Window</option>
            <option value={90}>90 Days (Quarterly Strategy)</option>
            <option value={180}>180 Days Window</option>
          </select>

          {/* Competitor Selector */}
          <select 
            value={selectedCompId} 
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            <option value="">All Competitors (Market Landscape)</option>
            {competitors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateClick}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          {generating ? 'Assembling...' : 'Re-Assemble Report'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Assembling Structured Executive Report...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
          <button 
            onClick={fetchOrGenerateReport}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Report Assembly
          </button>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && report && (
        <div className="space-y-6">

          {/* Insufficient Evidence Notice if applicable */}
          {report.insufficientEvidence ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-4">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Insufficient Evidence for Executive Report</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No verified competitor events were recorded in the database during the selected {windowDays}-day timeframe. Please ingest competitive signals to compile executive intelligence.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-2xs space-y-8">

              {/* Report Metadata Chips Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">VERIFIED EVENTS</span>
                  <div className="text-lg font-black text-slate-900">{metadata.eventCount}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">TRIGGERED ALERTS</span>
                  <div className="text-lg font-black text-orange-600">{metadata.alertCount}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">CONNECTED PATTERNS</span>
                  <div className="text-lg font-black text-purple-600">{metadata.patternCount}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">HINDSIGHT STATUS</span>
                  <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-orange-600" />
                    {metadata.hindsightStatus || 'POSTGRESQL TRUTH'}
                  </div>
                </div>
              </div>

              {/* SECTION A: Executive Summary */}
              {sections.executiveSummary && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> A. Executive Summary
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Facts */}
                    <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        FACTS (Grounded Telemetry)
                      </span>
                      <ul className="space-y-1.5 text-blue-950">
                        {(sections.executiveSummary.facts || []).map((f, idx) => (
                          <li key={idx}>• {f}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Observations */}
                    <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        OBSERVATIONS (Event Patterns)
                      </span>
                      <ul className="space-y-1.5 text-amber-950">
                        {(sections.executiveSummary.observations || []).map((o, idx) => (
                          <li key={idx}>• {o}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Inferences */}
                    <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        INFERENCES (Strategic Takeaways)
                      </span>
                      <ul className="space-y-1.5 text-purple-950">
                        {(sections.executiveSummary.inferences || []).map((inf, idx) => (
                          <li key={idx}>• {inf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: Competitor Activity */}
              {sections.competitorActivity?.length > 0 && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-600" /> B. Competitor Activity Breakdown
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.competitorActivity.map(ca => (
                      <div key={ca.competitorId} className="bg-slate-50 border border-stone-200 p-4 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-stone-200 pb-2">
                          <span className="text-sm">{ca.competitorName}</span>
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                            {ca.totalEvents} Total Events ({ca.recentEventsCount} Recent 30d)
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-700">
                          <span className="font-bold text-slate-900 text-[10px] uppercase">Notable Developments:</span>
                          <ul className="space-y-1 list-disc list-inside">
                            {ca.notableEvents.map(ne => (
                              <li key={ne.id}>
                                <span className="font-semibold text-slate-900">[{ne.eventType}]</span> {ne.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: Key Competitive Signals */}
              {sections.keySignals?.length > 0 && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> C. Key Competitive Signals
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {sections.keySignals.map(sig => (
                      <div key={sig.category} className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                        <span className="font-bold text-slate-900 uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded">
                          {sig.category.replace(/_/g, ' ')} ({sig.events.length})
                        </span>
                        {sig.events.length === 0 ? (
                          <p className="text-slate-400 italic text-[11px]">No events recorded in this signal category.</p>
                        ) : (
                          <ul className="space-y-1.5 text-slate-800">
                            {sig.events.map((e, idx) => (
                              <li key={idx} className="border-b border-stone-200/60 pb-1.5 last:border-b-0">
                                <span className="font-bold text-slate-900">{e.competitorName}: </span>
                                {e.title} <span className="text-slate-400">({e.date})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION D: Connect-the-Dots Patterns */}
              {sections.patterns?.length > 0 && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> D. Connect-the-Dots Patterns
                  </h2>

                  <div className="space-y-3 text-xs">
                    {sections.patterns.map(p => (
                      <div key={p.id} className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-bold text-purple-950">
                          <span className="text-sm">{p.patternTitle}</span>
                          <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px]">
                            {p.confidence} CONFIDENCE
                          </span>
                        </div>
                        <p className="text-purple-900 font-medium">{p.summary}</p>
                        {(p.inferences || []).length > 0 && (
                          <div className="text-purple-800 bg-purple-100/60 p-2.5 rounded-lg border border-purple-200">
                            <span className="font-bold uppercase text-[9px] block">STRATEGIC INFERENCE</span>
                            {p.inferences[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION E: Strategic Analysis */}
              {sections.strategicAnalysis?.length > 0 && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" /> E. Strategic Analysis Synthesis
                  </h2>

                  <div className="space-y-4 text-xs">
                    {sections.strategicAnalysis.map(s => (
                      <div key={s.id} className="bg-slate-50 border border-stone-200 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                          <span className="font-bold text-slate-900 text-sm">{s.title}</span>
                          <span className="bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {s.confidence} CONFIDENCE
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                          <div><span className="font-bold text-slate-900">Fact: </span>{(s.facts || [])[0]}</div>
                          <div><span className="font-bold text-slate-900">Inference: </span>{(s.inferences || [])[0]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION G: Watch Items */}
              {sections.watchItems?.length > 0 && (
                <div className="space-y-3 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" /> G. Tactical Watch Items
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {sections.watchItems.map((wi, idx) => (
                      <div key={idx} className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                        <span className="font-bold text-emerald-900 text-[10px] uppercase bg-emerald-100 px-2 py-0.5 rounded">
                          {wi.competitorName} — {wi.category}
                        </span>
                        <p className="text-emerald-950 font-semibold mt-1">{wi.observation}</p>
                        <p className="text-emerald-800 text-[11px]">{wi.watchFocus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION H: Data Limitations */}
              {sections.dataLimitations?.length > 0 && (
                <div className="bg-slate-100 border border-slate-300 p-4 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-slate-800 uppercase text-[10px]">
                    H. Data Limitations & Grounding Boundaries
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {sections.dataLimitations.map((dl, idx) => (
                      <li key={idx}>{dl}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Supporting Evidence Source Citations */}
              {report.supportingEvents?.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-stone-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Verified Source Citations & Primary Evidence ({report.supportingEvents.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {report.supportingEvents.slice(0, 10).map((ev, i) => (
                      <div key={ev.id || i} className="p-3 bg-slate-50 rounded-xl border border-stone-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{ev.competitorName || 'Competitor'}</span>
                          <span className="text-[10px] text-slate-400">{new Date(ev.eventDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 font-semibold">{ev.title}</p>
                        {ev.evidenceExcerpt && (
                          <div className="bg-blue-50 border border-blue-200 p-2 rounded text-[11px] text-blue-950 font-mono">
                            "{ev.evidenceExcerpt}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
