import React, { useState } from 'react';
import { 
  Search, Bell, LayoutGrid, Calendar, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopNavbar({ currentView, setCurrentView, breadcrumbs, selectedCompetitor = 'Oracle' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickJump, setShowQuickJump] = useState(false);
  const [dateRange, setDateRange] = useState('Last 6 months');
  const { user } = useAuth();

  const pages = [
    { id: 'dashboard', label: '1. CompetitorIQ Dashboard', desc: 'Main Executive Intelligence Overview' },
    { id: 'competitor_ecosystem', label: '2. Competitor Ecosystem', desc: 'Oracle, IBM, AWS, Salesforce' },
    { id: 'competitor_profile', label: '3. Competitor Profile: Oracle', desc: 'KPIs, Capability Matrix, Pricing' },
    { id: 'activity_timeline', label: '4. Activity Timeline', desc: 'Intelligence Stream, Weekly Signals' },
    { id: 'connect_dots', label: '5. Connect the Dots', desc: 'Strategic Pattern Visualizer, Chains' },
    { id: 'strategic_patterns', label: '6. Strategic Analysis', desc: 'Tactical Shifts, 6-Month Intensity' },
    { id: 'hindsight_memory', label: '7. Hindsight Memory', desc: 'Persistent Semantic Intelligence' },
    { id: 'ai_analyst', label: '8. AI Strategic Analyst', desc: 'Natural Language Query & Synthesis' },
    { id: 'alerts', label: '9. Critical Alerts', desc: 'Signal Triage, AI Synthesis in Noise' },
    { id: 'competitive_comparison', label: '10. Market Comparison Matrix', desc: 'Oracle vs IBM vs AWS vs Salesforce' },
    { id: 'executive_report', label: '11. Executive Strategy Report', desc: 'Brief, Market Trajectory, Risks' },
  ];

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs font-sans">
      <div className="relative w-96 max-w-md hidden sm:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Oracle, IBM, AWS, Salesforce, pricing..."
          className="w-full bg-[#F8FAFC] border border-stone-200/90 rounded-full pl-10 pr-10 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition duration-150"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-stone-200 rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative hidden md:block">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200/90 bg-white text-xs font-semibold text-slate-700 hover:bg-stone-50 transition">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowQuickJump(!showQuickJump)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200/90 bg-white text-xs font-semibold text-slate-700 hover:text-orange-600 transition"
            title="Jump to any view"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Views (11)</span>
          </button>

          {showQuickJump && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>CompetitorIQ Views</span>
                <span className="text-orange-600 font-mono">11 Views</span>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentView(p.id);
                      setShowQuickJump(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-orange-50/70 transition ${
                      currentView === p.id ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span className="font-semibold text-slate-900">{p.label}</span>
                    <span className="text-[11px] text-slate-400">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setCurrentView('alerts')}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-stone-100/70 rounded-full transition"
          title="2 Critical Alerts"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-600 ring-2 ring-white"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs cursor-pointer">
          {user?.initials || 'S'}
        </div>
      </div>
    </header>
  );
}
