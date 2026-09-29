import React from 'react';
import AgentWorkspace from '../components/agent/AgentWorkspace';

export default function AIAnalystView({ onNavigate, onOpenEvidence }) {
  return (
    <AgentWorkspace
      onNavigate={onNavigate}
      onOpenEvidence={onOpenEvidence}
    />
  );
}
