import React, { useState, useEffect } from 'react';
import { 
  Users, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Database, Zap
} from 'lucide-react';
import apiService from '../services/apiService';

export default function CompetitorEcosystemView({ onNavigate, onSelectCompetitor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ingestion state
  const [isIngestingAll, setIsIngestingAll] = useState(false);
  const [ingestingCompetitors, setIngestingCompetitors] = useState({});
  const [ingestionResult, setIngestionResult] = useState(null);

  const fetchCompetitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getCompetitors();
      setCompetitors(res?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load competitors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const defaultCompetitors = [
    { id: 'Microsoft', name: 'Microsoft (Focal)', slug: 'microsoft', category: 'Focal Enterprise: Cloud, AI Agents, Enterprise Software', icon: 'M', isFocal: true },
    { id: 'Google Cloud', name: 'Google Cloud', slug: 'google-cloud', category: 'Hyperscale Cloud & Vertex AI', icon: 'G' },
    { id: 'AWS', name: 'AWS', slug: 'aws', category: 'Cloud Infrastructure & Bedrock AI', icon: 'A' },
    { id: 'Oracle', name: 'Oracle', slug: 'oracle', category: 'Enterprise Cloud & Autonomous DB', icon: 'O' },
    { id: 'IBM', name: 'IBM', slug: 'ibm', category: 'watsonx AI & Hybrid Cloud', icon: 'I' },
    { id: 'Salesforce', name: 'Salesforce', slug: 'salesforce', category: 'CRM & Autonomous Agents', icon: 'S' }
  ];

  const displayList = competitors.length > 0 ? competitors : defaultCompetitors;
  const filtered = displayList.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.category || c.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIngestAll = async () => {
    setIsIngestingAll(true);
    setIngestionResult(null);
    try {
      const res = await apiService.refreshOfficialData();
      if (res?.data) {
        setIngestionResult({
          type: 'all',
          message: res.data.message || `Processed ${res.data.sourcesChecked || 0} sources. ${res.data.newEvents || 0} new events added, ${res.data.duplicatesSkipped || 0} duplicates skipped.`
        });
      }
      fetchCompetitors();
    } catch (err) {
      setIngestionResult({
        type: 'error',
        message: err.message || 'Ingestion failed for public sources.'
      });
    } finally {
      setIsIngestingAll(false);
    }
  };

  const handleIngestCompetitor = async (e, comp) => {
    e.stopPropagation();
    const slug = comp.slug || (comp.name || 'competitor').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setIngestingCompetitors(prev => ({ ...prev, [slug]: true }));
    setIngestionResult(null);

    try {
      const res = await apiService.refreshCompetitorData(slug);
      if (res?.data) {
        setIngestionResult({
          type: 'competitor',
          competitorName: comp.name,
          message: res.data.message || `Ingested updates for ${comp.name}: ${res.data.newEvents || 0} new records.`
        });
      }
      fetchCompetitors();
    } catch (err) {
      setIngestionResult({
        type: 'error',
        message: err.message || `Ingestion failed for ${comp.name}.`
      });
    } finally {
      setIngestingCompetitors(prev => ({ ...prev, [slug]: false }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Tracked Competitor Entities
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Competitor Ecosystem Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time monitoring of Microsoft and the 5 hyperscaler rivals (AWS, Google Cloud, Oracle, Salesforce, IBM) backed by SHA-256 deduplication and hybrid adapter collection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchCompetitors}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
          </button>
          <button 
            type="button"
            onClick={handleIngestAll}
            disabled={isIngestingAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isIngestingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting Ecosystem...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" /> Ingest All Hyperscalers
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center gap-3">
        <Database className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter competitors by name or ecosystem taxonomy..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Ingestion Telemetry Banner Notification */}
      {ingestionResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
          ingestionResult.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {ingestionResult.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{ingestionResult.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setIngestionResult(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 space-y-2">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading Competitors from Database...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((comp) => {
            const slug = comp.slug || (comp.name || 'competitor').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const isIngestingThis = ingestingCompetitors[slug] || false;

            return (
              <div 
                key={comp.id || comp.name}
                onClick={() => {
                  if (onSelectCompetitor) onSelectCompetitor(comp.name || comp.id);
                  onNavigate('competitor_profile');
                }}
                className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs hover:border-orange-300 hover:shadow-md transition cursor-pointer space-y-4 group"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-xs">
                      {(comp.name || 'C')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition">{comp.name}</h3>
                        {comp.slug === 'microsoft' && (
                          <span className="text-[9px] font-extrabold text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded uppercase">
                            Focal
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{comp.industry || comp.category || 'Enterprise Cloud & AI'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isIngestingThis}
                    onClick={(e) => handleIngestCompetitor(e, comp)}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    title={`Trigger ingestion adapter for ${comp.name}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isIngestingThis ? 'animate-spin text-orange-600' : ''}`} />
                    {isIngestingThis ? 'Ingesting...' : 'Ingest Signals'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {comp.description || `Monitored competitor profile for ${comp.name}. Ingested events, pricing telemetry, product signals, and evidence citations.`}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-bold">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Monitoring
                  </span>

                  <div className="flex items-center gap-1 text-orange-600 group-hover:text-orange-700">
                    <span>Inspect Intelligence Profile</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
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
