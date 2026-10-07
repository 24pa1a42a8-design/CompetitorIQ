import React, { useState, useEffect } from 'react';
import { 
  Download, ExternalLink, Filter, ArrowRight, ShieldAlert, 
  Activity, CheckCircle2, TrendingUp, Sparkles, RefreshCw, AlertCircle,
  BarChart3, HelpCircle, Layers, Eye, Cpu, ChevronRight, X
} from 'lucide-react';
import apiService from '../services/apiService';

const ANALYSIS_TYPES = [
  { value: 'ALL', label: 'All Analysis Types' },
  { value: 'COMPETITIVE_MOMENTUM', label: 'Competitive Momentum' },
  { value: 'PRICING_STRATEGY', label: 'Pricing Strategy' },
  { value: 'PRODUCT_STRATEGY', label: 'Product Strategy' },
  { value: 'HIRING_STRATEGY', label: 'Hiring Strategy' },
  { value: 'MARKET_EXPANSION', label: 'Market Expansion' },
  { value: 'PARTNERSHIP_STRATEGY', label: 'Partnership Strategy' },
  { value: 'MESSAGING_POSITIONING', label: 'Messaging & Positioning' },
  { value: 'COMPETITIVE_ESCALATION', label: 'Competitive Escalation' },
  { value: 'STRATEGIC_SEQUENCE', label: 'Strategic Sequence' },
  { value: 'EMERGING_TREND', label: 'Emerging Trend' }
];

export default function StrategicPatternsView({ onNavigate, onOpenEvidence, dateFilter }) {
  const [analyses, setAnalyses] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedConfidence, setSelectedConfidence] = useState('ALL');
  const [selectedWindowDays, setSelectedWindowDays] = useState(90);

  // Detail Modal / Traceability
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const reqIdRef = React.useRef(0);

  const loadData = async () => {
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = {
        competitorId: selectedCompetitor || undefined,
        analysisType: selectedType !== 'ALL' ? selectedType : undefined,
        confidence: selectedConfidence !== 'ALL' ? selectedConfidence : undefined
      };
      if (dateFilter?.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter?.endDate) params.endDate = dateFilter.endDate;

      const [analysesRes, compRes] = await Promise.all([
        apiService.getStrategicAnalyses(params).catch(() => ({ data: [] })),
        apiService.getCompetitors().catch(() => ({ data: [] }))
      ]);

      if (currentReqId !== reqIdRef.current) return;

      let loadedAnalyses = analysesRes?.data || [];
      if (loadedAnalyses.length === 0 && !selectedCompetitor && selectedType === 'ALL') {
        try {
          const synth = await apiService.analyzeStrategicData({
            windowDays: Number(selectedWindowDays)
          });
          if (synth?.data?.analyses) {
            loadedAnalyses = synth.data.analyses;
          }
        } catch {
          // ignore auto-synthesis error
        }
      }

      if (currentReqId !== reqIdRef.current) return;
      setAnalyses(Array.isArray(loadedAnalyses) ? loadedAnalyses : []);
      const comps = compRes?.data || [];
      setCompetitors(Array.isArray(comps) ? comps : []);
    } catch (err) {
      if (currentReqId !== reqIdRef.current) return;
      if (err.name === 'AbortError' || err.isCancelled) return;
      setError(err.message || 'Failed to load strategic intelligence analyses.');
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompetitor, selectedType, selectedConfidence, dateFilter?.startDate, dateFilter?.endDate]);

  const handleRunSynthesis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      await apiService.analyzeStrategicData({
        competitorId: selectedCompetitor || undefined,
        analysisType: selectedType !== 'ALL' ? selectedType : undefined,
        windowDays: Number(selectedWindowDays)
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to synthesize strategic intelligence.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'HIGH':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">HIGH CONFIDENCE</span>;
      case 'MEDIUM':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">MEDIUM CONFIDENCE</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">LOW CONFIDENCE</span>;
    }
  };

  const getHindsightStatusBadge = (status) => {
    if (status === 'AVAILABLE' || status === 'ok') {
      return <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><Cpu className="w-3 h-3" /> HINDSIGHT RECALL</span>;
    }
    return <span className="bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">HINDSIGHT DEGRADED (PG TRUTH)</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">


      {/* Hero Header */}
      <div className="bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <span className="text-[10px] font-bold tracking-widest text-orange-300 bg-orange-950/80 border border-orange-700/50 px-2 py-0.5 rounded uppercase">
            Strategic Intelligence Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Evidence-Grounded Strategic Analysis
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Transforms verified competitive events, alerts, and Connect-the-Dots patterns into structured strategic intelligence across 5 rigorous analytical categories.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={handleRunSynthesis}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} /> 
            {analyzing ? 'Synthesizing...' : 'Synthesize Strategy'}
          </button>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Competitor Filter */}
          <select 
            value={selectedCompetitor} 
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            <option value="">All Competitors</option>
            {competitors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            {ANALYSIS_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Confidence Filter */}
          <select 
            value={selectedConfidence} 
            onChange={(e) => setSelectedConfidence(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            <option value="ALL">All Confidence Levels</option>
            <option value="HIGH">High Confidence Only</option>
            <option value="MEDIUM">Medium Confidence Only</option>
            <option value="LOW">Low Confidence Only</option>
          </select>

          {/* Timeframe Window Selector */}
          <select 
            value={selectedWindowDays} 
            onChange={(e) => setSelectedWindowDays(e.target.value)}
            className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-orange-500"
          >
            <option value={30}>30 Days Window</option>
            <option value={60}>60 Days Window</option>
            <option value={90}>90 Days Window</option>
            <option value={180}>180 Days Window</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing {analyses.length} {analyses.length === 1 ? 'Analysis' : 'Analyses'}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading Strategic Intelligence...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && analyses.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Strategic Analyses Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run strategic intelligence synthesis to evaluate verified competitive events and calculate evidence-backed strategic insights.
            </p>
          </div>
          <button 
            onClick={handleRunSynthesis}
            disabled={analyzing}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            {analyzing ? 'Synthesizing...' : 'Synthesize Strategic Intelligence'}
          </button>
        </div>
      )}

      {/* Analyses List View */}
      {!loading && !error && analyses.length > 0 && (
        <div className="space-y-6">
          {analyses.map(item => {
            const competitorName = item.competitor?.name || 'Competitor';
            const facts = Array.isArray(item.facts) ? item.facts : [];
            const observations = Array.isArray(item.observations) ? item.observations : [];
            const inferencesList = Array.isArray(item.inferencesList) ? item.inferencesList : (Array.isArray(item.inferences) ? item.inferences : []);
            const implications = Array.isArray(item.implications) ? item.implications : [];
            const unknowns = Array.isArray(item.unknowns) ? item.unknowns : [];
            const momentumMetrics = item.momentumMetrics;

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden space-y-4 p-6 hover:border-slate-300 transition">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {competitorName}
                      </span>
                      <span className="bg-orange-100 text-orange-900 border border-orange-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {(item.analysisType || 'STRATEGIC').replace(/_/g, ' ')}
                      </span>
                      {getConfidenceBadge(item.confidence)}
                      {getHindsightStatusBadge(item.hindsightStatus)}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setSelectedAnalysis(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Traceability
                    </button>
                    {onOpenEvidence && (
                      <button
                        onClick={() => onOpenEvidence({
                          title: item.title,
                          competitor: competitorName,
                          category: (item.analysisType || 'STRATEGIC').replace(/_/g, ' '),
                          excerpt: item.summary,
                          facts: facts,
                          capturedAt: item.createdAt,
                          sourceUrl: 'Verified PostgreSQL Records'
                        })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold text-xs rounded-lg transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Evidence
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                  <span className="font-bold text-slate-900">Summary: </span>{item.summary}
                </p>

                {/* Momentum Indicators Card if available */}
                {momentumMetrics && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">MOMENTUM SCORE</span>
                      <div className="text-lg font-black text-slate-900">{momentumMetrics.score} / 100</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">MOMENTUM LEVEL</span>
                      <div className="text-sm font-bold text-orange-600">{(momentumMetrics.level || '').replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">VELOCITY RATIO</span>
                      <div className="text-sm font-bold text-emerald-600">{momentumMetrics.recentVsHistoricalRatio}x</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px]">CONNECTED PATTERNS</span>
                      <div className="text-sm font-bold text-purple-600">{momentumMetrics.patternCount || 0} Patterns</div>
                    </div>
                  </div>
                )}

                {/* 5-Box Visually Distinct Analytical Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. FACTS (Blue) */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                        FACTS (Ground Truth Events)
                      </span>
                      <span className="text-[10px] font-bold text-blue-600">{facts.length} Verified</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-blue-950">
                      {facts.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2. OBSERVATIONS (Amber) */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        OBSERVATIONS (Historical Telemetry)
                      </span>
                      <span className="text-[10px] font-bold text-amber-600">{observations.length} Signals</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {observations.map((o, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. STRATEGIC INFERENCES (Purple) */}
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-purple-800 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded">
                        STRATEGIC INFERENCES (Supported Interpretations)
                      </span>
                      <span className="text-[10px] font-bold text-purple-600">{inferencesList.length} Inferences</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-purple-950">
                      {inferencesList.map((inf, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{inf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 4. BUSINESS IMPLICATIONS (Emerald) */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        BUSINESS IMPLICATIONS (Commercial Impact)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">{implications.length} Areas</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-950">
                      {implications.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5. UNKNOWN / LIMITATIONS (Slate) */}
                <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-800 bg-slate-200 border border-slate-400 px-2 py-0.5 rounded">
                      UNKNOWN / LIMITATIONS (Unestablished Boundaries)
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {unknowns.map((u, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Traceability Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Provenance & Traceability Chain</span>
                <h3 className="text-base font-bold text-slate-900">{selectedAnalysis.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="font-bold text-orange-900 uppercase text-[10px]">1. Strategic Insight</span>
                <p className="mt-1 font-medium text-slate-900">{selectedAnalysis.summary}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 uppercase text-[10px]">2. Supporting Patterns & Observations</span>
                <ul className="mt-1 space-y-1 text-slate-800 list-disc list-inside">
                  {(selectedAnalysis.observations || []).map((o, idx) => (
                    <li key={idx}>{o}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 uppercase text-[10px]">3. Supporting Ground Truth Events</span>
                <ul className="mt-1 space-y-1 text-slate-800 list-disc list-inside">
                  {(selectedAnalysis.facts || []).map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 uppercase text-[10px]">4. Provenance Metadata</span>
                <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div><span className="font-bold">Confidence:</span> {selectedAnalysis.confidence}</div>
                  <div><span className="font-bold">Hindsight Status:</span> {selectedAnalysis.hindsightStatus}</div>
                  <div><span className="font-bold">Generated At:</span> {new Date(selectedAnalysis.createdAt).toLocaleString()}</div>
                  <div><span className="font-bold">Organization ID:</span> {selectedAnalysis.organizationId}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close Traceability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
