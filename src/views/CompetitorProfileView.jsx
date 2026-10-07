import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ExternalLink, Plus, Globe, Calendar, MapPin, 
  Sparkles, PieChart, BarChart2, Users, Activity, TrendingUp, 
  ChevronDown, RefreshCw, AlertCircle
} from 'lucide-react';
import HindsightFlowWidget from '../components/common/HindsightFlowWidget';
import CompetitorLogo from '../components/common/CompetitorLogo';
import apiService from '../services/apiService';

export default function CompetitorProfileView({ onNavigate, selectedCompetitor = 'Oracle', onOpenEvidence, dateFilter }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const compName = typeof selectedCompetitor === 'string' ? selectedCompetitor : 'Oracle';
  const reqIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchProfileData = async () => {
    reqIdRef.current += 1;
    const currentReqId = reqIdRef.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = { query: compName, limit: 30, signal: controller.signal };
      if (dateFilter?.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter?.endDate) params.endDate = dateFilter.endDate;

      const res = await apiService.getEvents(params);
      if (currentReqId !== reqIdRef.current) return;

      const rawEvents = res?.data?.events || res?.data || [];
      setEvents(Array.isArray(rawEvents) ? rawEvents : []);
    } catch (err) {
      if (err.name === 'AbortError' || err.isCancelled) return;
      if (currentReqId === reqIdRef.current) {
        setError(err.message || 'Failed to load competitor events.');
      }
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfileData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedCompetitor, dateFilter?.startDate, dateFilter?.endDate]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 font-sans text-slate-800">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('competitor_ecosystem')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Competitor Directory
        </button>

        <button
          onClick={fetchProfileData}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Header Profile Box */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CompetitorLogo name={compName} size={36} showContainer containerClassName="w-14 h-14 rounded-2xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{compName}</h1>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  PostgreSQL Profile
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time competitor profile and grounded intelligence events.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai_analyst', { 
              competitor: compName, 
              query: `Analyze strategic developments, product roadmap, and pricing changes for ${compName}` 
            })}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-orange-300" /> Query AI Agent for {compName}
          </button>
        </div>
      </div>

      <HindsightFlowWidget 
        variant="banner" 
        defaultStage="recall" 
        stageMessage={`Recalling historical events and stored memories for ${compName}`} 
        memoriesCount={events.length}
      />

      {/* Events List for Competitor */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-stone-100 pb-3">
          Inbound Events & Telemetry for {compName} ({events.length})
        </h3>

        {loading && (
          <div className="p-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading events for {compName}...</p>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Activity className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No Events Found for {compName}</p>
            <p className="text-xs text-slate-400">Ingest competitor events via API to build competitor telemetry.</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 bg-slate-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {evt.competitor?.name || compName}
                    </span>
                    <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded uppercase">
                      {evt.eventType}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{evt.summary}</p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Source: <strong>{evt.source?.publisher || 'Verified Source'}</strong></span>
                  <button
                    onClick={() => onOpenEvidence && onOpenEvidence({
                      title: evt.title,
                      competitor: evt.competitor?.name || compName,
                      category: evt.eventType,
                      source: evt.source?.publisher || 'Official Source',
                      url: evt.source?.url || '#',
                      summary: evt.summary,
                      excerpt: evt.evidence?.[0]?.excerpt || evt.summary,
                      capturedAt: evt.eventDate
                    })}
                    className="text-orange-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Evidence <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
