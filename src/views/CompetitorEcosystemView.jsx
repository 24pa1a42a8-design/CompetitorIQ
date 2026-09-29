import React, { useState, useEffect } from 'react';
import { 
  Users, ExternalLink, Plus, Filter, Search, ArrowRight, ShieldCheck, TrendingUp, RefreshCw, AlertCircle
} from 'lucide-react';
import apiService from '../services/apiService';

export default function CompetitorEcosystemView({ onNavigate, onSelectCompetitor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    { id: 'Oracle', name: 'Oracle', slug: 'oracle', category: 'Enterprise Cloud & Autonomous DB', icon: 'O', color: 'bg-orange-600 text-white' },
    { id: 'IBM', name: 'IBM', slug: 'ibm', category: 'watsonx AI & Hybrid Cloud', icon: 'I', color: 'bg-amber-600 text-white' },
    { id: 'AWS', name: 'AWS', slug: 'aws', category: 'Cloud Infrastructure & Bedrock AI', icon: 'A', color: 'bg-[#ea580c] text-white' },
    { id: 'Salesforce', name: 'Salesforce', slug: 'salesforce', category: 'CRM & Autonomous Agents', icon: 'S', color: 'bg-stone-700 text-white' }
  ];

  const displayList = competitors.length > 0 ? competitors : defaultCompetitors;
  const filtered = displayList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
            Real-time monitoring of enterprise rivals stored in PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchCompetitors}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={() => onNavigate('competitive_comparison')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-300" /> Comparison Matrix
          </button>
        </div>
      </div>

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
          {filtered.map((comp) => (
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
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {(comp.name || 'C')[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition">{comp.name}</h3>
                    <span className="text-xs text-slate-500">{comp.industry || comp.category || 'Enterprise Software'}</span>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  {comp.status || 'ACTIVE'}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {comp.description || `Monitored competitor profile for ${comp.name}. Ingested events, pricing telemetry and evidence signals.`}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-orange-600">
                <span>View Full Profile & Ingested Events</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
