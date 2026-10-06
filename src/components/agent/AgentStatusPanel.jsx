import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const STATUS_LINES = [
  { label: 'REASONING', value: 'Analyzing competitor signals…' },
  { label: 'ACTION', value: 'Connecting verified sources…' },
  { label: 'ITERATION', value: 'Learning from new evidence…' },
];

export default function AgentStatusPanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="status-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.6 }}
    >
      {/* Header */}
      <div className="status-panel-header">
        <div className="status-panel-logo">
          <span className="status-logo-icon">◈</span>
        </div>
        <div>
          <div className="status-panel-title">COMPETITORIQ AI AGENT</div>
          <div className="status-panel-sub">AUTONOMOUS INTELLIGENCE</div>
        </div>
        {/* Pulsing active dot */}
        <motion.div
          className="status-live-dot"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      </div>

      <div className="status-divider" />

      {/* Status row */}
      <div className="status-row">
        <span className="status-key">STATUS</span>
        <span className="status-value status-value--active">ACTIVE</span>
      </div>

      <div className="status-divider" />

      {/* Cycling lines */}
      {STATUS_LINES.map((line, i) => (
        <div key={line.label} className="status-row status-row--sm">
          <span className="status-key">{line.label}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={tick + i}
              className="status-value status-value--dim"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {line.value}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}
