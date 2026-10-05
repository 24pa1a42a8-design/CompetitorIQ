import React, { useState, useEffect } from 'react';
import { 
  Filter, Calendar, ShieldCheck, Sparkles, ArrowRight, Search, 
  ExternalLink, Clock, TrendingUp, ChevronDown, CheckCircle2, RefreshCw, AlertCircle
} from 'lucide-react';
import HindsightFlowWidget from '../components/common/HindsightFlowWidget';
import apiService from '../services/apiService';

export default function ActivityTimelineView({ onOpenEvidence, onNavigate, dateFilter }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTag, setSearchTag] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (dateFilter?.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter?.endDate) params.endDate = dateFilter.endDate;

      const res = await apiService.getEvents(params);
      const rawEvents = res?.data?.events || res?.data || [];
      setEvents(Array.isArray(rawEvents) ? rawEvents : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch competitive activity events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateFilter?.startDate, dateFilter?.endDate]);

  const eventList = Array.isArray(events) ? events : [];
  const filteredEvents = eventList.filter(e => {
    if (filterType !== 'ALL' && e.eventType !== filterType) return false;
    if (searchTag) {
      const q = searchTag.toLowerCase();
      return (
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.summary && e.summary.toLowerCase().includes(q)) ||
        (e.competitor?.name && e.competitor.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Stream</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time chronological feed of competitor strategic shifts, product launches, and market signals stored in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('ai_analyst')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Ask Agent
          </button>
        </div>
      </div>

      <HindsightFlowWidget 
        variant="banner" 
        defaultStage="retain" 
        stageMessage="Ingested competitive signals stored with deterministic SHA-256 content hashes" 
        memoriesCount={events.length}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Filter events by keyword..."
            className="w-full text-xs bg-slate-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'PRODUCT', 'PRICING', 'FEATURE', 'HIRING', 'FUNDING', 'EXPANSION'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                filterType === type 
                  ? 'bg-orange-600 text-white shadow-2xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Activity Timeline...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Failed to Load Activity Timeline</h3>
          <p className="text-xs text-rose-700">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Events Found</h3>
          <p className="text-xs text-slate-500">No competitive intelligence events match your filter criteria.</p>
        </div>
      )}

      {/* Events List */}
      {!loading && !error && filteredEvents.length > 0 && (
        <div className="space-y-4">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                    {evt.competitor?.name || 'Competitor'}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                    {evt.eventType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Confidence: <strong className="text-slate-700 font-semibold">{Math.round((evt.confidence || 0.9) * 100)}%</strong>
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evt.summary}</p>
              </div>

              {/* Source & Evidence Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-md">
                  <span className="font-semibold text-slate-700">Source:</span>
                  <span className="truncate">{evt.source?.publisher || evt.source?.url || 'Verified Web Telemetry'}</span>
                </div>

                <button
                  onClick={() => onOpenEvidence && onOpenEvidence({
                    title: evt.title,
                    competitor: evt.competitor?.name || 'Competitor',
                    category: evt.eventType,
                    source: evt.source?.publisher || 'Official Press',
                    url: evt.source?.url || '#',
                    summary: evt.summary,
                    excerpt: evt.evidence?.[0]?.excerpt || evt.summary,
                    capturedAt: evt.eventDate
                  })}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Evidence
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
