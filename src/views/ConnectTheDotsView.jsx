import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Sparkles, ShieldAlert, RefreshCw, ExternalLink, AlertCircle,
  CheckCircle2, ArrowRight, HelpCircle, Eye, Database, Layers
} from 'lucide-react';
import apiService from '../services/apiService';

export default function ConnectTheDotsView({ onNavigate, onOpenEvidence, dateFilter }) {
  const [patterns, setPatterns] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const reqIdRef = React.useRef(0);

  const fetchPatterns = async (targetTab = activeTab) => {
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (dateFilter?.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter?.endDate) params.endDate = dateFilter.endDate;

      if (targetTab === 'HIGH_CONFIDENCE') {
        params.confidence = 'HIGH';
      } else if (targetTab === 'PRICING_PRODUCT') {
        params.patternType = 'PRICING_PRODUCT';
      } else if (targetTab === 'HIRING_PRODUCT') {
        params.patternType = 'HIRING_PRODUCT';
      } else if (targetTab === 'FUNDING_EXPANSION') {
        params.patternType = 'FUNDING_EXPANSION';
      }

      const res = await apiService.getConnectDotsPatterns(params);
      if (currentReqId !== reqIdRef.current) return;
      let loadedPatterns = res?.data || [];

      // If no patterns stored in DB yet, trigger analysis over ingested events
      if (loadedPatterns.length === 0 && targetTab === 'ALL') {
        try {
          const evalRes = await apiService.analyzeConnectDots({});
          if (evalRes?.data?.patterns) {
            loadedPatterns = evalRes.data.patterns;
          }
        } catch {
          // Ignore auto-analyze fallback error
        }
      }

      if (currentReqId !== reqIdRef.current) return;
      setPatterns(loadedPatterns);
    } catch (err) {
      if (currentReqId !== reqIdRef.current) return;
      if (err.name === 'AbortError' || err.isCancelled) return;
      console.error('Failed to load Connect-the-Dots patterns:', err);
      setError(err.message || 'Failed to load pattern analysis chain data.');
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    fetchPatterns(tabId);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const evalRes = await apiService.analyzeConnectDots({});
      if (evalRes?.data?.patterns) {
        setPatterns(evalRes.data.patterns);
      } else {
        await fetchPatterns(activeTab);
      }
    } catch (err) {
      console.error('Failed to trigger pattern analysis:', err);
      setError(err.message || 'Failed to execute Connect-the-Dots relationship analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchPatterns(activeTab);
  }, [dateFilter?.startDate, dateFilter?.endDate]);

  const PATTERN_LABELS = {
    PRICING_PRODUCT: 'Pricing → Product',
    HIRING_PRODUCT: 'Hiring → Product',
    FUNDING_EXPANSION: 'Funding → Expansion',
    PRODUCT_TO_MESSAGING: 'Product → Messaging'
  };

  const filteredPatterns = React.useMemo(() => {
    if (!patterns || !Array.isArray(patterns)) return [];
    if (activeTab === 'ALL') return patterns;
    if (activeTab === 'HIGH_CONFIDENCE') {
      return patterns.filter(p => (p.confidence || '').toUpperCase() === 'HIGH');
    }
    return patterns.filter(p => p.patternType === activeTab);
  }, [patterns, activeTab]);

  const getConfidenceBadge = (confidence, score) => {
    const label = confidence ? `${confidence} CONFIDENCE${score ? ` (${score}%)` : ''}` : 'CONFIDENCE';
    switch (confidence) {
      case 'HIGH':
        return <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">{label}</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">{label}</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">{label}</span>;
    }
  };

  const highConfCount = patterns.filter(p => p.confidence === 'HIGH').length;
  const dynamicConfidence = patterns.length > 0
    ? `${Math.round(((highConfCount * 0.94 + (patterns.length - highConfCount) * 0.78) / patterns.length) * 100)}%`
    : 'Insufficient evidence';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 font-sans text-slate-800">


      {/* Top Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-5 h-5 text-orange-600" />
            <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase">
              Cross-Event Relationship Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Connect the Dots: Intelligence Pattern Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Multi-event strategic chains constructed from verified PostgreSQL records. Correlates product launches, pricing shifts, hiring spikes, and leadership moves into explainable intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing || loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} /> Run Chain Analysis
          </button>
          <button
            onClick={() => fetchPatterns(activeTab)}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Patterns' },
          { id: 'HIGH_CONFIDENCE', label: 'High Confidence' },
          { id: 'PRICING_PRODUCT', label: 'Pricing → Product' },
          { id: 'HIRING_PRODUCT', label: 'Hiring → Product' },
          { id: 'FUNDING_EXPANSION', label: 'Funding → Expansion' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {(loading || analyzing) && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Building Multi-Event Relationship Chains from PostgreSQL...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && !analyzing && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">{error}</p>
          <button onClick={handleRunAnalysis} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700">
            Retry Analysis
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !analyzing && !error && filteredPatterns.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'FUNDING_EXPANSION'
              ? 'No verified Funding → Expansion patterns found.'
              : activeTab === 'HIRING_PRODUCT'
              ? 'No verified Hiring → Product patterns found.'
              : activeTab === 'PRICING_PRODUCT'
              ? 'No verified Pricing → Product patterns found.'
              : 'No verified multi-event patterns detected'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            We only display patterns supported by verified public evidence. Try another time range or run historical signal analysis.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-2xs hover:bg-orange-700 transition"
          >
            Analyze Historical Signals
          </button>
        </div>
      )}

      {/* Patterns Chain List */}
      {!loading && !analyzing && !error && filteredPatterns.length > 0 && (
        <div className="space-y-6">
          {filteredPatterns.map((pattern) => {
            const factsList = Array.isArray(pattern.facts) ? pattern.facts : [];
            const observationsList = Array.isArray(pattern.observations) ? pattern.observations : [];
            const inferencesList = Array.isArray(pattern.inferences) ? pattern.inferences : [];
            const unknownsList = Array.isArray(pattern.unknowns) ? pattern.unknowns : [];

            return (
              <div key={pattern.id || pattern.title} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-5">
                {/* Pattern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getConfidenceBadge(pattern.confidence)}
                      <span className="text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {PATTERN_LABELS[pattern.patternType] || pattern.displayLabel || 'Pattern Relationship'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {pattern.competitor?.name || 'Competitor'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{pattern.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pattern.summary}</p>
                  </div>

                  {/* Hindsight Status Pill */}
                  <div className="shrink-0 bg-slate-50 p-2.5 rounded-xl border border-stone-200 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Context</span>
                    <span className="text-xs font-bold text-orange-600 flex items-center gap-1 justify-end">
                      <Database className="w-3 h-3" />
                      {pattern.hindsightStatus === 'AVAILABLE'
                        ? 'Historical Memory Used'
                        : 'PostgreSQL Evidence (Hindsight Degraded)'}
                    </span>
                  </div>
                </div>

                {/* Visual Connected Sequential Chain of Real Events */}
                {Array.isArray(pattern.events) && pattern.events.length > 0 && (
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-orange-600" /> Sequential Real Event Chain (Click node for full evidence)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified PostgreSQL Signals
                      </span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1">
                      {pattern.events.map((evt, eIdx) => (
                        <React.Fragment key={evt.id || eIdx}>
                          <div 
                            onClick={() => onOpenEvidence && onOpenEvidence(evt)}
                            className="flex-1 p-3 bg-white rounded-xl border border-stone-200 hover:border-orange-400 hover:shadow-md transition cursor-pointer group space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                {evt.eventType}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 line-clamp-2 transition-colors">
                              {evt.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {evt.summary}
                            </p>
                            <div className="flex items-center justify-between text-[10px] pt-1.5 text-slate-400 border-t border-slate-100">
                              <span className="truncate max-w-[140px] font-medium">{evt.source?.publisher || 'Official Source'}</span>
                              <span className="text-orange-600 font-bold group-hover:underline flex items-center gap-0.5">
                                View Evidence <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                          {eIdx < pattern.events.length - 1 && (
                            <div className="flex items-center justify-center text-slate-400 shrink-0">
                              <ArrowRight className="w-5 h-5 hidden md:block text-orange-500" />
                              <span className="text-xs font-bold md:hidden text-orange-500">↓ Next Move</span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4-Box Explainable Intelligence Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FACTS Box */}
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Ground Truth Facts</h4>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-emerald-800 leading-relaxed">
                      {factsList.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>

                  {/* OBSERVATIONS Box */}
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-700" />
                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Empirical Observations</h4>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-blue-800 leading-relaxed">
                      {observationsList.map((obs, idx) => (
                        <li key={idx}>{obs}</li>
                      ))}
                    </ul>
                  </div>

                  {/* INFERENCES Box */}
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Strategic Inferences</h4>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-amber-800 leading-relaxed">
                      {inferencesList.map((inf, idx) => (
                        <li key={idx}>{inf}</li>
                      ))}
                    </ul>
                  </div>

                  {/* UNKNOWNS Box */}
                  <div className="bg-slate-100/80 p-4 rounded-xl border border-stone-300/80 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Unverified Unknowns</h4>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700 leading-relaxed">
                      {unknownsList.map((unk, idx) => (
                        <li key={idx}>{unk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
