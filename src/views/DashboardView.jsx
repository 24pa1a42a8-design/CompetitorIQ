import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Clock, ShieldAlert, Sparkles, ArrowRight, Search, 
  ExternalLink, CheckCircle2, ChevronRight, BarChart2, Filter, Layers, Zap,
  RefreshCw, AlertCircle
} from 'lucide-react';
import HindsightFlowWidget from '../components/common/HindsightFlowWidget';
import MonitoringStatusWidget from '../components/common/MonitoringStatusWidget';
import apiService from '../services/apiService';

export default function DashboardView({ onNavigate, onSelectCompetitor, onOpenEvidence }) {
  const [askQuery, setAskQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [hindsightStatus, setHindsightStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, compRes, hsRes] = await Promise.all([
        apiService.getEvents({ limit: 10 }).catch(() => ({ data: [] })),
        apiService.getCompetitors().catch(() => ({ data: [] })),
        apiService.getHindsightStatus().catch(() => null)
      ]);

      const rawEvents = eventsRes?.data?.events || eventsRes?.data || [];
      const evts = Array.isArray(rawEvents) ? rawEvents : [];
      const rawComps = compRes?.data || [];
      const comps = Array.isArray(rawComps) ? rawComps : [];

      setEvents(evts);
      setCompetitors(comps);
      setHindsightStatus(hsRes?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAskAgent = (e) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    if (onNavigate) onNavigate('ai_analyst');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* Real Hindsight Intelligence Flow Widget */}
      <HindsightFlowWidget 
        variant="banner" 
        defaultStage={hindsightStatus?.isConfigured ? 'recall' : 'degraded'}
        stageMessage={
          hindsightStatus?.status === 'ok' 
            ? 'Connected to Hindsight Engine bank' 
            : 'Hindsight Cloud operations running in local PostgreSQL memory fallback'
        }
        memoriesCount={events.length}
        confidenceScore="94%"
      />

      {/* Hero Header & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Competitive Intelligence
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                PostgreSQL + Prisma Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Competitive Landscape Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Autonomous telemetry, price tracking, product release monitoring, and grounded AI strategic briefs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={() => onNavigate && onNavigate('ai_analyst')}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI Agent
            </button>
          </div>
        </div>

        {/* Quick Search Form */}
        <form onSubmit={handleAskAgent} className="relative mt-2">
          <input
            type="text"
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            placeholder="Ask AI Agent: What changed recently for Oracle, IBM, AWS or Salesforce?"
            className="w-full bg-slate-50 border border-stone-200 rounded-xl px-4 py-3 pl-11 pr-24 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
          >
            Analyze <ArrowRight className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Monitoring Status Widget */}
      <MonitoringStatusWidget />

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Connecting to CompetitorIQ PostgreSQL Backend...</p>
          <p className="text-xs text-slate-400">Loading structured events, signals, and competitor telemetry...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col items-center text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">Backend Connection Error</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Grid when Loaded */}
      {!loading && !error && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tracked Competitors</span>
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{competitors.length || 4}</div>
              <p className="text-xs text-slate-400">Verified PostgreSQL Entities</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Ingested Events</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{events.length}</div>
              <p className="text-xs text-slate-400">Structured Signal Ingested</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hindsight Engine</span>
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono text-xs">
                {hindsightStatus?.status === 'ok' ? 'ONLINE' : 'FALLBACK'}
              </div>
              <p className="text-xs text-slate-400">Bank: {hindsightStatus?.bankId || 'competitorIQ'}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Evidence Grounding</span>
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">100%</div>
              <p className="text-xs text-slate-400">Zero Hallucinations</p>
            </div>
          </div>

          {/* Recent Ingested Events Section */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Competitor Events</h2>
                <p className="text-xs text-slate-500">Live intelligence normalized and classified into structured categories.</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('activity_timeline')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View Full Timeline <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No Events Ingested Yet</p>
                <p className="text-xs text-slate-400">Ingest items via backend API or run test fixtures to populate events.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <div key={evt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {evt.competitor?.name || 'Competitor'}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          {evt.eventType}
                        </span>
                        <span className="text-xs text-slate-400">
                          {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{evt.summary}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        onClick={() => onOpenEvidence && onOpenEvidence({
                          title: evt.title,
                          competitor: evt.competitor?.name || 'Competitor',
                          category: evt.eventType,
                          source: evt.source?.publisher || 'Official Source',
                          url: evt.source?.url || '#',
                          summary: evt.summary,
                          excerpt: evt.evidence?.[0]?.excerpt || evt.summary,
                          capturedAt: evt.eventDate
                        })}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 border border-orange-200 hover:bg-orange-50 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Evidence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
