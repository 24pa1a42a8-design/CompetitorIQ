import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Sparkles, RefreshCw, AlertTriangle, ShieldAlert, 
  CheckCircle, FileText, ExternalLink, Cpu, Eye, Layers, TrendingUp, Filter, Activity, X,
  ShieldCheck, ArrowRight, Zap, Target, Calendar, Award, Building2
} from 'lucide-react';
import HindsightFlowWidget from '../components/common/HindsightFlowWidget';
import EvidenceModal from '../components/EvidenceModal';
import CompetitorLogo from '../components/common/CompetitorLogo';
import { CompetitorIQLogo } from '../components/common/BrandLogo';
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

  const abortControllerRef = useRef(null);
  const reqIdRef = useRef(0);

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

  const storageKey = `exec_report_${reportType}_${windowDays}_${selectedCompId || 'all'}`;

  // Helper to load report from localStorage
  const loadLocalCache = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.metadata || parsed.sections)) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore storage error
    }
    return null;
  };

  // Helper to save report to localStorage
  const saveLocalCache = (payload) => {
    try {
      if (payload && (payload.metadata || payload.sections)) {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
    } catch (e) {
      // Ignore storage error
    }
  };

  const loadLatestReport = async () => {
    reqIdRef.current += 1;
    const currentReqId = reqIdRef.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Load from localStorage first if available
    const local = loadLocalCache();
    if (local) {
      setReport(local);
      setLoading(false);
    } else if (!report) {
      setLoading(true);
    }

    setError(null);

    try {
      const res = await apiService.getLatestExecutiveReport({
        competitorIds: selectedCompId ? [selectedCompId] : [],
        reportType,
        windowDays: Number(windowDays),
        signal: controller.signal
      });

      if (currentReqId !== reqIdRef.current) return;

      const reportPayload = res?.data?.report || res?.data?.data || (res?.data?.metadata ? res.data : null) || res?.data || res;
      if (reportPayload && (reportPayload.metadata || reportPayload.sections)) {
        setReport(reportPayload);
        saveLocalCache(reportPayload);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.isCancelled) return;
      if (currentReqId !== reqIdRef.current) return;
      console.warn('Latest executive report fetch notice:', err.message);
      // Keep existing report if available, only set non-blocking notice
      if (!report && !loadLocalCache()) {
        setError('Latest executive report could not be retrieved from server.');
      }
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  };

  const reassembleReport = async () => {
    // Duplicate click protection: ignore if re-assembly is already active
    if (generating) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setGenerating(true);
    setError(null);

    try {
      const res = await apiService.generateExecutiveReport({
        competitorIds: selectedCompId ? [selectedCompId] : [],
        reportType,
        windowDays: Number(windowDays),
        forceRefresh: true,
        signal: controller.signal
      });

      const reportPayload = res?.data?.report || res?.data?.data || (res?.data?.metadata ? res.data : null) || res?.data || res;
      if (reportPayload && (reportPayload.metadata || reportPayload.sections)) {
        setReport(reportPayload);
        saveLocalCache(reportPayload);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Executive report re-assembly notice:', err.message);
      // NEVER erase existing report; display non-blocking notice instead
      setError('Latest verified report is shown. Refresh could not complete within timeframe.');
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    loadLatestReport();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [reportType, windowDays, selectedCompId]);

  const handleGenerateClick = () => {
    reassembleReport();
  };

  const sections = report?.sections || {};
  const metadata = report?.metadata || {};
  const timeframe = report?.timeframe || {};

  const handleOpenEvidence = (evData) => {
    setActiveEvidence({
      title: evData.title,
      competitor: evData.competitorName || evData.company || 'Monitored Competitor',
      category: evData.eventType || 'VERIFIED_SIGNAL',
      excerpt: evData.evidenceExcerpt || evData.description || evData.summary || 'Verified primary source signal captured from official corporate release.',
      capturedAt: evData.eventDate || evData.createdAt || new Date().toISOString(),
      sourceUrl: evData.sourceUrl || evData.source?.url || '#',
      sourcePublisher: evData.sourceName || evData.source?.publisher || 'Official Press Release',
      facts: evData.facts || []
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Evidence Modal Popup */}
      <EvidenceModal 
        isOpen={Boolean(activeEvidence)} 
        onClose={() => setActiveEvidence(null)} 
        evidenceData={activeEvidence} 
      />

      {/* Hindsight Intelligence Banner */}
      <HindsightFlowWidget 
        variant="banner" 
        defaultStage="reflect" 
        stageMessage="Synthesizing retained signals, historical timelines, and cross-competitor patterns into executive intelligence" 
        memoriesCount={metadata.eventCount || 0}
        confidenceScore="99%"
      />

      {/* Top Banner / Document Metadata */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Background City Skyline Visual Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-right-bottom bg-no-repeat opacity-30 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/images/corporate_city_skyline.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70 pointer-events-none" />

        <div className="relative z-10 flex items-start gap-4">
          <CompetitorIQLogo size={40} className="shrink-0 mt-0.5 border border-white/20" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-widest text-orange-300 bg-orange-950/80 border border-orange-700/50 px-2 py-0.5 rounded uppercase">
                {reportType.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">POSTGRESQL-VERIFIED GROUND TRUTH</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {report?.title || 'Microsoft Executive Competitor Intelligence Report'}
            </h1>
            <p className="text-xs text-slate-300">
              Generated Live • Grounded in {metadata.eventCount || 0} verified events, {metadata.alertCount || 0} alerts, and {metadata.patternCount || 0} connected patterns.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center gap-2.5 shrink-0 flex-wrap">
          <button 
            onClick={() => loadLatestReport()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Brief
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-xs transition cursor-pointer"
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
          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          {generating ? 'Assembling...' : 'Re-Assemble Report'}
        </button>
      </div>

      {/* Initial Loading State */}
      {loading && !report && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Assembling Structured Executive Report...</p>
        </div>
      )}

      {/* Initial Error State */}
      {error && !report && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
          <button 
            onClick={() => reassembleReport()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Report Assembly
          </button>
        </div>
      )}

      {/* Background Error Notice when Report already exists */}
      {error && report && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Background refresh notice: {error}. Displaying latest verified report.</span>
          </div>
          <button onClick={() => setError(null)} className="text-amber-600 hover:text-amber-800 font-bold ml-2">Dismiss</button>
        </div>
      )}

      {/* Report Content */}
      {report && (
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
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> A. Executive Summary & Strategic Position
                  </h2>

                  {/* Strategic Position Callout */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">MICROSOFT FOCAL POSITION</span>
                    <p className="text-sm font-semibold">{sections.executiveSummary.microsoftPosition}</p>
                    <p className="text-xs text-slate-300 font-medium">Strategic Direction: {sections.executiveSummary.strategicDirection}</p>
                  </div>

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

                    {/* Threats */}
                    <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> BIGGEST COMPETITIVE THREATS
                      </span>
                      <ul className="space-y-1.5 text-rose-950">
                        {(sections.executiveSummary.biggestThreats || []).map((t, idx) => (
                          <li key={idx}>• {t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600" /> STRATEGIC OPPORTUNITIES
                      </span>
                      <ul className="space-y-1.5 text-emerald-950">
                        {(sections.executiveSummary.biggestOpportunities || []).map((o, idx) => (
                          <li key={idx}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: Key Competitive Moves */}
              {sections.competitorActivity?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-600" /> B. Key Competitive Moves & Activity Breakdown
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.competitorActivity.map(ca => (
                      <div key={ca.competitorId} className="bg-slate-50 border border-stone-200 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 border-b border-stone-200 pb-2">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <CompetitorLogo name={ca.competitorName} size={16} />
                            {ca.competitorName}
                          </span>
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                            {ca.totalEvents} Verified Events
                          </span>
                        </div>

                        <div className="space-y-2 text-slate-700">
                          <span className="font-bold text-slate-900 text-[10px] uppercase block">Recent Key Developments:</span>
                          <div className="space-y-2">
                            {ca.notableEvents.map(ne => (
                              <div key={ne.id} className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-1">
                                <div className="flex items-center justify-between font-semibold text-slate-900">
                                  <span className="text-orange-700 font-bold">[{ne.eventType}]</span>
                                  <span className="text-[10px] text-slate-400">{new Date(ne.eventDate).toLocaleDateString()}</span>
                                </div>
                                <p className="font-bold text-slate-900">{ne.title}</p>
                                <p className="text-slate-600 text-[11px] line-clamp-2">{ne.summary}</p>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-mono text-slate-400">{ne.sourceName}</span>
                                  <button
                                    onClick={() => handleOpenEvidence(ne)}
                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    View Evidence <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: Microsoft vs Competitors Matrix */}
              {sections.comparisonMatrix?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" /> C. Microsoft vs Competitors Strategic Matrix
                  </h2>

                  <div className="overflow-x-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                          <th className="p-3 font-bold border-b border-slate-800">Dimension</th>
                          <th className="p-3 font-bold border-b border-slate-800 bg-orange-950/80 text-orange-300">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="Microsoft" size={14} /> Microsoft (Focal)</span>
                          </th>
                          <th className="p-3 font-bold border-b border-slate-800">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="AWS" size={14} /> AWS</span>
                          </th>
                          <th className="p-3 font-bold border-b border-slate-800">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="Google Cloud" size={14} /> Google Cloud</span>
                          </th>
                          <th className="p-3 font-bold border-b border-slate-800">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="Oracle" size={14} /> Oracle</span>
                          </th>
                          <th className="p-3 font-bold border-b border-slate-800">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="Salesforce" size={14} /> Salesforce</span>
                          </th>
                          <th className="p-3 font-bold border-b border-slate-800">
                            <span className="inline-flex items-center gap-1.5"><CompetitorLogo name="IBM" size={14} /> IBM</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 text-slate-700">
                        {sections.comparisonMatrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-bold text-slate-900 bg-stone-50/80 w-36">{row.dimension}</td>
                            <td className="p-3 font-medium bg-orange-50/50 text-slate-900 border-x border-orange-100">{row.microsoft}</td>
                            <td className="p-3">{row.aws}</td>
                            <td className="p-3">{row.googleCloud}</td>
                            <td className="p-3">{row.oracle}</td>
                            <td className="p-3">{row.salesforce}</td>
                            <td className="p-3">{row.ibm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION D: Connect-the-Dots Patterns */}
              {sections.patterns?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> D. Strategic Patterns (Derived from Factual Telemetry)
                  </h2>

                  <div className="space-y-3 text-xs">
                    {sections.patterns.map(p => (
                      <div key={p.id} className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-bold text-purple-950">
                          <span className="text-sm flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            {p.patternTitle}
                          </span>
                          <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px]">
                            {p.confidence} CONFIDENCE
                          </span>
                        </div>
                        <p className="text-purple-900 font-medium">{p.summary}</p>
                        
                        {p.facts && p.facts.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold uppercase text-purple-800">Supporting Evidence Facts:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-purple-900">
                              {p.facts.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION E: Evidence-Backed Alerts */}
              {sections.alerts?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> E. Evidence-Backed Alerts
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {sections.alerts.map(alt => (
                      <div key={alt.id} className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-rose-900 font-bold">{alt.company}: {alt.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${alt.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-orange-200 text-orange-900'}`}>
                            {alt.severity}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">{alt.reason}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 text-[10px]">
                          <span className="text-slate-500 font-mono">{alt.sourceTitle}</span>
                          {alt.sourceUrl && alt.sourceUrl !== '#' && (
                            <a href={alt.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline flex items-center gap-1 font-bold">
                              Source Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION F: Recommended Actions for Microsoft */}
              {sections.recommendedActions?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" /> F. Strategic Recommended Actions for Microsoft
                  </h2>

                  <div className="space-y-3 text-xs">
                    {sections.recommendedActions.map(rec => (
                      <div key={rec.id} className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-bold text-emerald-950">
                          <span className="text-sm font-bold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            {rec.title}
                          </span>
                          <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold">
                            {rec.impact} IMPACT • {rec.targetTimeframe}
                          </span>
                        </div>
                        <p className="text-emerald-950 font-semibold">{rec.recommendation}</p>
                        <div className="p-2 bg-white/80 rounded border border-emerald-200 text-[11px] text-emerald-900 font-mono">
                          <span className="font-bold uppercase text-[9px] block text-emerald-700">Grounded Evidence Reference:</span>
                          "{rec.evidenceReference}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION G: Timeline of Competitive Activity */}
              {sections.timeline?.length > 0 && (
                <div className="space-y-4 border-b border-stone-200 pb-6">
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-700" /> G. Competitive Activity Timeline (Last 90 Days)
                  </h2>

                  <div className="relative pl-6 border-l-2 border-stone-200 space-y-4 text-xs">
                    {sections.timeline.map((item, idx) => (
                      <div key={item.id || idx} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-orange-600 border-2 border-white ring-2 ring-stone-200" />
                        <div className="p-3 bg-slate-50 rounded-xl border border-stone-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="text-orange-700 font-bold">{item.company} — [{item.eventType}]</span>
                            <span className="text-[10px] text-slate-400">{item.date}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{item.title}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">{item.sourceTitle}</span>
                            {item.sourceUrl && item.sourceUrl !== '#' && (
                              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-[10px] font-bold flex items-center gap-1">
                                View Source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
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
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Official Source Citations & Primary Evidence ({report.supportingEvents.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {report.supportingEvents.slice(0, 12).map((ev, i) => (
                      <div key={ev.id || i} className="p-3.5 bg-slate-50 rounded-xl border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                            {ev.competitorName}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(ev.eventDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 font-bold">{ev.title}</p>
                        {ev.evidenceExcerpt && (
                          <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded text-[11px] text-blue-950 font-mono">
                            "{ev.evidenceExcerpt}"
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/80">
                          <button
                            onClick={() => handleOpenEvidence(ev)}
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" /> View Evidence Record
                          </button>
                          {ev.sourceUrl && ev.sourceUrl !== '#' && (
                            <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                              Official Link <ExternalLink className="w-3 h-3" />
                            </a>
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
      )}
    </div>
  );
}
