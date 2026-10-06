import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  {
    id: 'RETRIEVE',
    label: 'RETRIEVE',
    desc: 'Fetching verified signals from 17 official sources',
    icon: '⬇',
  },
  {
    id: 'REASON',
    label: 'REASON',
    desc: 'Synthesizing competitor patterns across domains',
    icon: '🧠',
  },
  {
    id: 'ACT',
    label: 'ACT',
    desc: 'Generating evidence-backed strategic insights',
    icon: '⚡',
  },
  {
    id: 'VERIFY',
    label: 'VERIFY',
    desc: 'Cross-referencing claims against source data',
    icon: '✓',
  },
  {
    id: 'REFLECT',
    label: 'REFLECT',
    desc: 'Evaluating confidence and identifying unknowns',
    icon: '◎',
  },
  {
    id: 'ITERATE',
    label: 'ITERATE',
    desc: 'Persisting new intelligence into memory',
    icon: '↺',
  },
];

export default function ReasoningPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState([]);

  // Reveal cards one by one on mount
  useEffect(() => {
    STAGES.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), i * 280 + 400);
    });
  }, []);

  // Cycle active stage
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % STAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="reasoning-pipeline">
      {/* Vertical connector line */}
      <div className="pipeline-track" />

      {STAGES.map((stage, i) => {
        const isActive = i === activeIndex;
        const isRevealed = visible.includes(i);

        return (
          <AnimatePresence key={stage.id}>
            {isRevealed && (
              <motion.div
                className={`pipeline-card ${isActive ? 'pipeline-card--active' : ''}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {/* Connector dot */}
                <motion.div
                  className={`pipeline-dot ${isActive ? 'pipeline-dot--active' : ''}`}
                  animate={
                    isActive
                      ? { scale: [1, 1.4, 1], boxShadow: ['0 0 0px #FF6A00', '0 0 12px #FF6A00', '0 0 0px #FF6A00'] }
                      : { scale: 1 }
                  }
                  transition={{ repeat: Infinity, duration: 1 }}
                />

                <div className="pipeline-card-inner">
                  <div className="pipeline-card-header">
                    <span className="pipeline-icon">{stage.icon}</span>
                    <span className="pipeline-label">{stage.label}</span>
                    {isActive && (
                      <motion.span
                        className="pipeline-active-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        ACTIVE
                      </motion.span>
                    )}
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        className="pipeline-desc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {stage.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Orange connector to next */}
                {i < STAGES.length - 1 && (
                  <motion.div
                    className={`pipeline-connector ${isActive ? 'pipeline-connector--active' : ''}`}
                    animate={isActive ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.2 }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
