import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import EvidenceModal from '../components/EvidenceModal';
import IntelligenceDetailModal from '../components/IntelligenceDetailModal';
import AccountModals from '../components/AccountModals';
import { useAuth } from '../context/AuthContext';

// Views
import DashboardView from '../views/DashboardView';
import ExecutiveReportView from '../views/ExecutiveReportView';
import CompetitorEcosystemView from '../views/CompetitorEcosystemView';
import CompetitorProfileView from '../views/CompetitorProfileView';
import ActivityTimelineView from '../views/ActivityTimelineView';
import ConnectTheDotsView from '../views/ConnectTheDotsView';
import StrategicPatternsView from '../views/StrategicPatternsView';
import HindsightMemoryView from '../views/HindsightMemoryView';
import AIAnalystView from '../views/AIAnalystView';
import BeforeAfterView from '../views/BeforeAfterView';
import AlertsView from '../views/AlertsView';
import CompetitiveComparisonView from '../views/CompetitiveComparisonView';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCompetitor, setSelectedCompetitor] = useState('Microsoft');
  const [initialAgentQuery, setInitialAgentQuery] = useState('');
  const [initialAgentCompetitor, setInitialAgentCompetitor] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState(null);

  // Date Filter State persisted across views
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return {
      label: 'Last 6 months',
      startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: now.toISOString()
    };
  });

  // Intelligence Detail Modal State
  const [intelDetail, setIntelDetail] = useState(null);
  const [isIntelDetailOpen, setIsIntelDetailOpen] = useState(false);

  // Account Modals State
  const [activeAccountModal, setActiveAccountModal] = useState(null);
  const { user } = useAuth();

  const handleOpenEvidence = (data) => {
    setEvidenceData(data);
    setIsEvidenceOpen(true);
  };

  const handleOpenNotificationDetail = (item) => {
    setIntelDetail(item);
    setIsIntelDetailOpen(true);
  };

  const handleNavigateToAgent = (query = '', competitor = null) => {
    setInitialAgentQuery(query);
    setInitialAgentCompetitor(competitor || null);
    setCurrentView('ai_analyst');
  };

  const handleNavigate = (view, state = null) => {
    if (view === 'ai_analyst') {
      setInitialAgentQuery(state?.query || '');
      setInitialAgentCompetitor(state?.competitor || null);
    }
    if (view === 'competitor_profile' && state?.competitor) {
      setSelectedCompetitor(state.competitor);
    }
    setCurrentView(view);
  };

  const breadcrumbsMap = {
    dashboard: [
      { label: 'Intelligence', view: 'dashboard' },
      { label: 'Dashboard' }
    ],
    executive_report: [
      { label: 'Intelligence', view: 'dashboard' },
      { label: 'Reporting' },
      { label: 'Q2 Strategic Outlook' },
      { label: 'Executive Strategy Report' }
    ],
    competitor_ecosystem: [
      { label: 'Home', view: 'dashboard' },
      { label: 'Strategic Intelligence' },
      { label: 'Competitors', view: 'competitor_ecosystem' },
      { label: 'Competitors' }
    ],
    competitor_profile: [
      { label: 'Competitors', view: 'competitor_ecosystem' },
      { label: selectedCompetitor },
      { label: `Competitor Profile: ${selectedCompetitor}` }
    ],
    activity_timeline: [
      { label: 'Home', view: 'dashboard' },
      { label: 'Intelligence' },
      { label: 'Activity Timeline', view: 'activity_timeline' },
      { label: 'Activity Timeline' }
    ],
    connect_dots: [
      { label: 'Intelligence' },
      { label: 'Chain Visualizer' },
      { label: 'Connect the Dots', view: 'connect_dots' },
      { label: 'Connect the Dots' }
    ],
    strategic_patterns: [
      { label: 'Intelligence' },
      { label: 'Strategic Patterns', view: 'strategic_patterns' },
      { label: 'Strategic Patterns' }
    ],
    hindsight_memory: [
      { label: 'Intelligence' },
      { label: 'Persistent Storage' },
      { label: 'Hindsight Memory', view: 'hindsight_memory' },
      { label: 'Hindsight Memory' }
    ],
    ai_analyst: [
      { label: 'Intelligence' },
      { label: 'AI Analyst', view: 'ai_analyst' },
      { label: 'AI Strategic Analyst' }
    ],
    before_after: [
      { label: 'Intelligence' },
      { label: 'Strategic Comparisons' },
      { label: 'The Hindsight Advantage' }
    ],
    alerts: [
      { label: 'Home', view: 'dashboard' },
      { label: 'Intelligence' },
      { label: 'Alerts', view: 'alerts' },
      { label: 'Critical Alerts' }
    ],
    competitive_comparison: [
      { label: 'Intelligence' },
      { label: 'Comparison Matrix' },
      { label: 'Competitive Comparison' }
    ]
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            onNavigate={handleNavigate} 
            onNavigateToAgent={handleNavigateToAgent}
            onSelectCompetitor={(id) => {
              setSelectedCompetitor(id);
              setCurrentView('competitor_profile');
            }} 
            onOpenEvidence={handleOpenEvidence}
            dateFilter={dateFilter}
          />
        );
      case 'executive_report':
        return <ExecutiveReportView onOpenEvidence={handleOpenEvidence} onNavigate={handleNavigate} dateFilter={dateFilter} />;
      case 'competitor_ecosystem':
        return (
          <CompetitorEcosystemView 
            onNavigate={handleNavigate} 
            onSelectCompetitor={(id) => {
              setSelectedCompetitor(id);
              setCurrentView('competitor_profile');
            }} 
          />
        );
      case 'competitor_profile':
        return (
          <CompetitorProfileView 
            selectedCompetitor={selectedCompetitor} 
            onNavigate={handleNavigate} 
            onOpenEvidence={handleOpenEvidence} 
            dateFilter={dateFilter}
          />
        );
      case 'activity_timeline':
        return <ActivityTimelineView onOpenEvidence={handleOpenEvidence} onNavigate={handleNavigate} dateFilter={dateFilter} />;
      case 'connect_dots':
        return <ConnectTheDotsView onNavigate={handleNavigate} onOpenEvidence={handleOpenEvidence} dateFilter={dateFilter} />;
      case 'strategic_patterns':
        return <StrategicPatternsView onNavigate={handleNavigate} onOpenEvidence={handleOpenEvidence} dateFilter={dateFilter} />;
      case 'hindsight_memory':
        return <HindsightMemoryView onNavigate={handleNavigate} onOpenEvidence={handleOpenEvidence} />;
      case 'ai_analyst':
        return (
          <AIAnalystView 
            onNavigate={handleNavigate} 
            onOpenEvidence={handleOpenEvidence}
            initialQuery={initialAgentQuery}
            initialCompetitor={initialAgentCompetitor}
          />
        );
      case 'before_after':
        return <BeforeAfterView onNavigate={handleNavigate} />;
      case 'alerts':
        return <AlertsView onNavigate={handleNavigate} onOpenEvidence={handleOpenEvidence} />;
      case 'competitive_comparison':
        return <CompetitiveComparisonView onNavigate={handleNavigate} onOpenEvidence={handleOpenEvidence} dateFilter={dateFilter} />;
      default:
        return (
          <DashboardView 
            onNavigate={handleNavigate} 
            onNavigateToAgent={handleNavigateToAgent}
            onSelectCompetitor={(id) => {
              setSelectedCompetitor(id);
              setCurrentView('competitor_profile');
            }} 
            onOpenEvidence={handleOpenEvidence}
            dateFilter={dateFilter}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {/* Left Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        selectedCompetitor={selectedCompetitor}
        setSelectedCompetitor={setSelectedCompetitor}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopNavbar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          selectedCompetitor={selectedCompetitor}
          onSelectCompetitor={(id) => {
            setSelectedCompetitor(id);
            setCurrentView('competitor_profile');
          }}
          onOpenEvidence={handleOpenEvidence}
          onNavigate={handleNavigate}
          breadcrumbs={breadcrumbsMap[currentView] || []}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          onOpenNotificationDetail={handleOpenNotificationDetail}
          onOpenAccountModal={setActiveAccountModal}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-16">
          {renderActiveView()}
        </main>
      </div>

      {/* Ground Truth Evidence Modal */}
      <EvidenceModal 
        isOpen={isEvidenceOpen} 
        onClose={() => setIsEvidenceOpen(false)} 
        evidenceData={evidenceData} 
      />

      {/* Detailed Intelligence Signal Modal */}
      <IntelligenceDetailModal
        isOpen={isIntelDetailOpen}
        onClose={() => setIsIntelDetailOpen(false)}
        detail={intelDetail}
      />

      {/* Account Settings, Notifications, Security, Help & Delete Account Modals */}
      <AccountModals
        activeModal={activeAccountModal}
        onClose={() => setActiveAccountModal(null)}
        user={user}
      />
    </div>
  );
}
