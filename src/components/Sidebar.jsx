import React from 'react';
import {
  Users,
  Clock,
  GitBranch,
  TrendingUp,
  BrainCircuit,
  Bot,
  Bell,
  BarChart3,
  FileText,
  LogOut,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandHeader } from './common/BrandLogo';
import CompetitorLogo from './common/CompetitorLogo';

export default function Sidebar({ currentView, setCurrentView, selectedCompetitor = 'Microsoft', setSelectedCompetitor }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of CompetitorIQ?')) {
      logout();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'competitor_ecosystem', label: 'Competitors', icon: Users, isCompetitorView: true },
    { id: 'activity_timeline', label: 'Activity Timeline', icon: Clock },
    { id: 'connect_dots', label: 'Connect the Dots', icon: GitBranch },
    { id: 'strategic_patterns', label: 'Strategic Analysis', icon: TrendingUp },
    { id: 'hindsight_memory', label: 'Hindsight Memory', icon: BrainCircuit },
    { id: 'ai_analyst', label: 'AI Agent Workspace', icon: Bot },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: 2 },
    { id: 'competitive_comparison', label: 'Competitive Comparison', icon: BarChart3 },
    { id: 'executive_report', label: 'Executive Report', icon: FileText }
  ];

  const competitorList = [
    { id: 'Microsoft', name: 'Microsoft (Focal)', isFocal: true },
    { id: 'Google Cloud', name: 'Google Cloud' },
    { id: 'AWS', name: 'AWS' },
    { id: 'Oracle', name: 'Oracle' },
    { id: 'IBM', name: 'IBM' },
    { id: 'Salesforce', name: 'Salesforce' }
  ];

  return (
    <aside className="w-64 bg-[#FAFBFD] border-r border-stone-200/80 flex flex-col shrink-0 min-h-screen text-slate-800 select-none font-sans">
      {/* Brand Header with Custom Logo Symbol & Wordmark */}
      <div className="h-16 px-5 border-b border-stone-100 flex items-center justify-between bg-white">
        <BrandHeader onClick={() => setCurrentView('dashboard')} />
      </div>

      {/* Primary Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            currentView === item.id ||
            (item.isCompetitorView && (currentView === 'competitor_ecosystem' || currentView === 'competitor_profile'));

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-orange-50/90 text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.count && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* COMPETITORS Subsection: Oracle, IBM, AWS, Salesforce */}
        <div className="pt-5 pb-2 px-3">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-2">
            Competitors
          </span>
          <div className="space-y-1">
            {competitorList.map((comp) => {
              const isCompActive = currentView === 'competitor_profile' && selectedCompetitor === comp.id;

              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    if (setSelectedCompetitor) setSelectedCompetitor(comp.id);
                    setCurrentView('competitor_profile');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isCompActive
                      ? 'bg-orange-50/90 text-orange-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/60'
                  }`}
                >
                  <CompetitorLogo name={comp.id} size={16} showContainer />
                  <span className="truncate">{comp.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Hindsight Powered Card & User Profile */}
      <div className="p-3 space-y-2 border-t border-stone-200/80 bg-white">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-orange-100/40 border border-orange-200/60 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-900">Hindsight Powered</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight pl-7">
            Remembers. Connects. Finds Patterns.
          </p>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition border border-transparent hover:border-stone-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.initials || 'S'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Strategic Lead'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'alex@enterprise.com'}</div>
            </div>
          </div>
          <button 
            title="Logout" 
            onClick={handleLogout}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
