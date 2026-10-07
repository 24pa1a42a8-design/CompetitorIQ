import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Check, Sparkles, RefreshCw, AlertCircle,
  Eye, TrendingUp, TrendingDown, ShieldAlert, Cpu, X, FileText
} from 'lucide-react';
import CompetitiveActivityChart from '../components/charts/CompetitiveActivityChart';
import CategoryActivityChart from '../components/charts/CategoryActivityChart';
import CompetitiveTrendChart from '../components/charts/CompetitiveTrendChart';
import apiService from '../services/apiService';

const CATEGORY_ROWS = [
  { key: 'PRODUCT', label: '1. Product & Feature Activity', metricKey: 'productEvents', trendKey: 'product' },
  { key: 'PRICING', label: '2. Pricing & Billing Model Moves', metricKey: 'pricingEvents', trendKey: 'pricing' },
  { key: 'HIRING', label: '3. Hiring & Recruitment Signals', metricKey: 'hiringEvents', trendKey: 'hiring' },
  { key: 'EXPANSION', label: '4. Geographic & Market Expansion', metricKey: 'expansionEvents', trendKey: 'expansion' },
  { key: 'PARTNERSHIP', label: '5. Strategic & Ecosystem Partnerships', metricKey: 'partnershipEvents', trendKey: 'partnership' },
  { key: 'MESSAGING', label: '6. Positioning & Messaging Shifts', metricKey: 'messagingEvents', trendKey: 'messaging' }
];

export default function CompetitiveComparisonView({ onNavigate, onOpenEvidence, dateFilter }) {
  const [allCompetitors, setAllCompetitors] = useState([]);
  const [selectedCompIds, setSelectedCompIds] = useState([]);
  const [windowDays, setWindowDays] = useState(90);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence Modal state
  const [evidenceModalData, setEvidenceModalData] = useState(null);

  // Initial load of competitors list
  useEffect(() => {
    async function loadCompetitorsList() {
      try {
        const res = await apiService.getCompetitors();
        const comps = res?.data || [];
        setAllCompetitors(comps);
        if (comps.length > 0) {
          // Select up to 4 competitors by default
          setSelectedCompIds(comps.slice(0, 4).map(c => c.id));
        }
      } catch {
        setError('Failed to load competitors list.');
      }
    }
    loadCompetitorsList();
  }, []);

  const reqIdRef = React.useRef(0);

  // Fetch comparison matrix when selected competitors or windowDays change
  const fetchComparison = async () => {
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = {
        competitorIds: selectedCompIds,
        windowDays
      };
      if (dateFilter?.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter?.endDate) params.endDate = dateFilter.endDate;

      const res = await apiService.getCompetitiveComparison(params);
      if (currentReqId !== reqIdRef.current) return;
      const matrix = res?.data?.competitors ? res.data : (res?.competitors ? res : res?.data || null);
      setComparisonData(matrix);
    } catch (err) {
      if (currentReqId !== reqIdRef.current) return;
      if (err.name === 'AbortError' || err.isCancelled) return;
      setError(err.message || 'Failed to generate competitive comparison matrix.');
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedCompIds, windowDays, dateFilter?.startDate, dateFilter?.endDate]);

  const toggleCompetitorSelection = (id) => {
    if (selectedCompIds.includes(id)) {
      if (selectedCompIds.length === 1) return; // Keep at least one selected
      setSelectedCompIds(selectedCompIds.filter(cId => cId !== id));
    } else {
      setSelectedCompIds([...selectedCompIds, id]);
    }
  };

  const comparedCompetitors = comparisonData?.competitors || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">


      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <span className="text-[10px] font-bold tracking-widest text-orange-300 bg-orange-950/80 border border-orange-700/50 px-2 py-0.5 rounded uppercase flex items-center gap-1.5 w-fit">
            <BarChart3 className="w-3.5 h-3.5" /> Factual Benchmarking Matrix
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Evidence-Backed Competitive Comparison
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Neutral, factual side-by-side comparison derived strictly from verified PostgreSQL events. Evaluates category velocity and period-over-period trend deltas without subjective overall rankings.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button 
            onClick={fetchComparison}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={() => onNavigate('ai_analyst')}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Query AI Agent
          </button>
        </div>
      </div>

      {/* Filters & Selector Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-3">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase">Select Competitors to Compare:</span>
            <p className="text-[11px] text-slate-500">Toggle active competitors for side-by-side analysis</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase mr-1">Timeframe Window:</span>
            <select 
              value={windowDays} 
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-stone-300 rounded-lg px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:border-orange-500"
            >
              <option value={30}>30 Days Window</option>
              <option value={60}>60 Days Window</option>
              <option value={90}>90 Days Window</option>
              <option value={180}>180 Days Window</option>
            </select>
          </div>
        </div>

        {/* Competitor Toggle Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {allCompetitors.map(comp => {
            const isSelected = selectedCompIds.includes(comp.id);
            return (
              <button
                key={comp.id}
                onClick={() => toggleCompetitorSelection(comp.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                    : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                {comp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Generating Evidence-Backed Comparison Matrix...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
          <button 
            onClick={fetchComparison}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Comparison
          </button>
        </div>
      )}

      {/* Main Comparison Display */}
      {!loading && !error && comparedCompetitors.length > 0 && (
        <div className="space-y-6">
          {/* Status & Timeframe Legend */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-stone-200">
            <div>
              <span className="font-bold text-slate-900">Comparison Period: </span>
              {windowDays} Days ({new Date(comparisonData.timeframe?.startDate).toLocaleDateString()} to {new Date(comparisonData.timeframe?.endDate).toLocaleDateString()})
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Hindsight Memory Status: </span>
              {comparisonData.hindsightStatus === 'AVAILABLE' ? (
                <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> RECALL AVAILABLE
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  DEGRADED (POSTGRESQL TRUTH)
                </span>
              )}
            </div>
          </div>

          {/* NEW VISUAL ANALYTICS SECTION: GRAPH 1, GRAPH 2, GRAPH 3 */}
          <div className="space-y-6">
            {/* Graph 1: Competitive Activity Overview Bar Chart */}
            <CompetitiveActivityChart competitors={comparedCompetitors} />

            {/* Graphs 2 & 3 Grid: Activity by Dimension & Activity Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryActivityChart competitors={comparedCompetitors} />
              <CompetitiveTrendChart competitors={comparedCompetitors} windowDays={windowDays} />
            </div>
          </div>

          {/* Metric Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparedCompetitors.map(item => {
              const comp = item.competitor;
              const metrics = item.metrics;
              const hasData = item.hasSufficientEvidence;

              return (
                <div key={comp.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{comp.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{comp.industry || 'Technology'}</span>
                    </div>
                    {hasData ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {metrics.momentumLevel.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        INSUFFICIENT DATA
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">FACTUAL METRIC (Total Events):</span>
                        <span className="font-extrabold text-slate-900 text-sm">{metrics.totalEvents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Event Velocity (30d Rate):</span>
                        <span className="font-bold text-orange-600">{metrics.eventFrequency} / mo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Triggered Alerts:</span>
                        <span className="font-bold text-slate-800">{metrics.alertsCount} ({metrics.highCriticalAlertsCount} High)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Connected Patterns:</span>
                        <span className="font-bold text-purple-600">{metrics.connectDotsPatternsCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl text-center space-y-1">
                      <ShieldAlert className="w-5 h-5 text-amber-500 mx-auto" />
                      <p className="text-xs font-bold text-amber-800">Insufficient evidence</p>
                      <p className="text-[10px] text-amber-600">No events recorded in {windowDays}d window.</p>
                    </div>
                  )}

                  {hasData && (
                    <button 
                      onClick={() => setEvidenceModalData({ competitorName: comp.name, events: item.supportingEvents })}
                      className="w-full mt-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect {item.supportingEvents.length} Supporting Events
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Category Breakdown & Side-by-Side Comparison Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden space-y-4 p-6">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Dimension Breakdown</span>
              <h2 className="text-lg font-bold text-slate-900">Side-by-Side Competitive Activity Matrix</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3.5 font-bold w-1/5">Comparison Vector</th>
                    {comparedCompetitors.map(item => (
                      <th key={item.competitor.id} className="p-3.5 font-extrabold w-1/5 border-l border-slate-800">
                        {item.competitor.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {CATEGORY_ROWS.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900 bg-slate-50/70 border-r border-stone-200">
                        {row.label}
                      </td>

                      {comparedCompetitors.map(item => {
                        const hasData = item.hasSufficientEvidence;
                        const count = hasData ? (item.metrics[row.metricKey] || 0) : 0;
                        const trend = hasData ? (item.trends[row.trendKey] || null) : null;

                        return (
                          <td key={item.competitor.id} className="p-4 border-r border-stone-200 last:border-r-0 align-top space-y-1.5">
                            {!hasData ? (
                              <span className="text-amber-700 italic font-semibold text-[11px]">Insufficient evidence</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">
                                    FACTUAL METRIC: {count} {count === 1 ? 'Event' : 'Events'}
                                  </span>
                                </div>

                                {trend && (
                                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between text-slate-600 font-bold">
                                      <span>CHANGE FROM PREVIOUS PERIOD:</span>
                                      <span className={`flex items-center gap-0.5 ${trend.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {trend.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {trend.delta >= 0 ? `+${trend.delta}` : trend.delta}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 leading-snug">
                                      <span className="font-bold text-slate-800">OBSERVATION: </span>
                                      {trend.observation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Evidence Traceability Modal */}
      {evidenceModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Supporting Events & Source Evidence</span>
                <h3 className="text-base font-bold text-slate-900">{evidenceModalData.competitorName} — Verified Telemetry</h3>
              </div>
              <button 
                onClick={() => setEvidenceModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {evidenceModalData.events.map((evt, i) => (
                <div key={evt.id || i} className="p-4 bg-slate-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {evt.eventType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(evt.eventDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                  <p className="text-slate-700 leading-relaxed">{evt.summary}</p>

                  {evt.source && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="font-bold">Source:</span> {evt.source.publisher || evt.source.title || evt.source.url}
                    </div>
                  )}

                  {evt.evidence && evt.evidence.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-blue-950 font-mono text-[11px]">
                      <span className="font-bold text-blue-800 uppercase text-[9px] block">PRIMARY SOURCE EXCERPT</span>
                      "{evt.evidence[0].excerpt}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setEvidenceModalData(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close Evidence Traceability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
