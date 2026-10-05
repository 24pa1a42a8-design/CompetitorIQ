import React from 'react';
import AgentWorkspace from '../components/agent/AgentWorkspace';

export default function AIAnalystView({ onNavigate, onOpenEvidence, initialQuery, initialCompetitor }) {
  return (
    <AgentWorkspace
      onNavigate={onNavigate}
      onOpenEvidence={onOpenEvidence}
      initialQuery={initialQuery}
      initialCompetitor={initialCompetitor}
    />
  );
}
