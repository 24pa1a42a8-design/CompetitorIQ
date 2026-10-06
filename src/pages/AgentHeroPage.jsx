import { useRef, useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IntelligenceSphere from '../components/agent/IntelligenceSphere';
import agentImage from '../assets/ai_agent_hero.jpg';
import './AgentHero.css';

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
const REASONING_STAGES = [
  {
    id: 'RETRIEVE',
    icon: '⬇',
    title: 'RETRIEVE',
    desc: 'Official competitor sources...',
    detail: 'Fetching verified signals from Microsoft, AWS, Google Cloud, Oracle, IBM & Salesforce official sources',
  },
  {
    id: 'REASON',
    icon: '🧠',
    title: 'REASON',
    desc: 'Connecting pricing, product and hiring signals...',
    detail: 'Cross-referencing 17 live feeds against historical Hindsight memory for pattern detection',
  },
  {
    id: 'ACT',
    icon: '⚡',
    title: 'ACT',
    desc: 'Updating competitor intelligence...',
    detail: 'Persisting new evidence-backed competitive events into PostgreSQL with source URLs',
  },
  {
    id: 'VERIFY',
    icon: '✓',
    title: 'VERIFY',
    desc: 'Checking evidence...',
    detail: 'Cross-referencing all claims against official source data — no fabrication permitted',
  },
  {
    id: 'REFLECT',
    icon: '◎',
    title: 'REFLECT',
    desc: 'Generating strategic insight...',
    detail: 'Evaluating confidence scores, surfacing unknowns, identifying Microsoft strategic implications',
  },
  {
    id: 'ITERATE',
    icon: '↺',
    title: 'ITERATE',
    desc: 'Refining the intelligence...',
    detail: 'Persisting new signals into Hindsight memory for enriched future analysis cycles',
  },
];

const LIVE_SIGNALS = [
  { label: 'AWS', event: 're:Invent AI Keynote', type: 'PRODUCT' },
  { label: 'GOOGLE', event: 'Cloud NEXT Pricing Update', type: 'PRICING' },
  { label: 'SALESFORCE', event: 'Dreamforce Agentforce Launch', type: 'PRODUCT' },
  { label: 'ORACLE', event: 'CloudWorld Partnership', type: 'PARTNERSHIP' },
  { label: 'IBM', event: 'Watsonx Hiring Signal', type: 'HIRING' },
];

const COMPETITORS = ['AWS', 'GOOGLE CLOUD', 'ORACLE', 'IBM', 'SALESFORCE'];

const TYPE_COLORS = {
  PRODUCT: '#FF6A00',
  PRICING: '#FF8A3D',
  PARTNERSHIP: '#E85D04',
  HIRING: '#F48C06',
};

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/* Cycling reasoning pipeline */
function ReasoningPipeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState([]);

  useEffect(() => {
    REASONING_STAGES.forEach((_, i) => {
      setTimeout(() => setRevealed((r) => (r.includes(i) ? r : [...r, i])), i * 260 + 500);
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % REASONING_STAGES.length), 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pipeline-wrap">
      <div className="pipeline-track-line" />
      {REASONING_STAGES.map((stage, i) => {
        const isActive = i === activeIdx;
        if (!revealed.includes(i)) return null;
        return (
          <motion.div
            key={stage.id}
            className={`pipeline-item ${isActive ? 'pipeline-item--active' : ''}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            <motion.div
              className={`pipeline-node ${isActive ? 'pipeline-node--active' : ''}`}
              animate={isActive ? { scale: [1, 1.45, 1], boxShadow: ['0 0 0 0 rgba(255,106,0,0.4)', '0 0 0 7px rgba(255,106,0,0)', '0 0 0 0 rgba(255,106,0,0)'] } : {}}
              transition={{ repeat: Infinity, duration: 1.1 }}
            />
            <div className="pipeline-card-body">
              <div className="pipeline-card-head">
                <span className="pipeline-card-icon">{stage.icon}</span>
                <span className="pipeline-card-title">{stage.title}</span>
                {isActive && (
                  <motion.span
                    className="pipeline-active-pill"
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ACTIVE
                  </motion.span>
                )}
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="pipeline-card-desc"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {stage.desc}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* Floating signal tag */
function SignalTag({ signal, style, delay }) {
  return (
    <motion.div
      className="signal-tag"
      style={style}
      initial={{ opacity: 0, scale: 0.65, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale:   { delay, duration: 0.5 },
        y:       { delay: delay + 0.6, duration: 3.5 + delay * 0.3, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <span
        className="signal-type-dot"
        style={{ background: TYPE_COLORS[signal.type] || '#FF6A00' }}
      />
      <span className="signal-competitor">{signal.label}</span>
      <span className="signal-event">{signal.event}</span>
    </motion.div>
  );
}

/* Status panel */
function StatusPanel() {
  const [tick, setTick] = useState(0);
  const STATUS_MESSAGES = [
    { label: 'REASONING', value: 'Analyzing competitor signals…' },
    { label: 'ACTION', value: 'Connecting verified sources…' },
    { label: 'ITERATION', value: 'Learning from new evidence…' },
  ];

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="status-panel-wrap"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.7, duration: 0.6, ease: 'easeOut' }}
    >
      <div className="sp-header">
        <div className="sp-logo">◈</div>
        <div className="sp-title-group">
          <div className="sp-title">COMPETITORIQ AI AGENT</div>
          <div className="sp-subtitle">AUTONOMOUS INTELLIGENCE</div>
        </div>
        <motion.div
          className="sp-live-dot"
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.55, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      </div>
      <div className="sp-divider" />
      <div className="sp-row">
        <span className="sp-key">STATUS</span>
        <span className="sp-val sp-val--active">● ACTIVE</span>
      </div>
      <div className="sp-divider" />
      {STATUS_MESSAGES.map((m, i) => (
        <div key={m.label} className="sp-row sp-row--sm">
          <span className="sp-key">{m.label}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={tick + i}
              className="sp-val sp-val--dim"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28 }}
            >
              {m.value}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function AgentHeroPage() {
  const navigate = useNavigate();
  const heroRef  = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = heroRef.current;
    const handler = (e) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width  - 0.5) * 16,
        y: ((e.clientY - rect.top)  / rect.height - 0.5) * -10,
      });
    };
    el?.addEventListener('mousemove', handler);
    return () => el?.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="agent-hero" ref={heroRef}>

      {/* Ambient orbs */}
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />

      {/* Subtle grid */}
      <div className="bg-grid" />

      <div className="hero-grid">

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <motion.div
          className="left-col"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <motion.span
              className="badge-pulse"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.3 }}
            />
            AUTONOMOUS AI AGENT · LIVE
          </motion.div>

          {/* Product name */}
          <motion.div
            className="product-name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            COMPETITORIQ
          </motion.div>

          {/* Headline */}
          <h1 className="hero-h1">
            {['FEARLESS', 'INTELLIGENCE', 'DELIVERED'].map((word, i) => (
              <motion.span
                key={word}
                className={`h1-word ${word === 'INTELLIGENCE' ? 'h1-word--orange' : ''}`}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.14 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Sub */}
          <motion.p
            className="hero-desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78 }}
          >
            Autonomous AI Agent monitoring competitors, connecting signals, and generating strategic
            insights from verified real-world data.
          </motion.p>

          {/* Focal + competitors strip */}
          <motion.div
            className="focal-strip"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.88 }}
          >
            <div className="focal-item focal-item--primary">
              <span className="focal-dot" />
              MICROSOFT — FOCAL
            </div>
            <div className="focal-divider">vs</div>
            <div className="focal-competitors">
              {COMPETITORS.map((c) => (
                <span key={c} className="focal-competitor">{c}</span>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="stats-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            {[
              { n: '17', label: 'Live Sources' },
              { n: '6',  label: 'Competitors' },
              { n: '152', label: 'Tests Passing' },
              { n: '∞',  label: 'Iterations' },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-num">{s.n}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.button
            className="cta-btn"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.12 }}
            whileHover={{ scale: 1.04, boxShadow: '0 16px 56px rgba(255,106,0,0.55)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard')}
          >
            ASK AI AGENT
            <motion.span
              className="cta-arrow"
              animate={{ x: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </motion.button>

          {/* Reasoning pipeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="pipeline-section"
          >
            <div className="pipeline-section-label">AI REASONING LOOP</div>
            <ReasoningPipeline />
          </motion.div>
        </motion.div>

        {/* ════════════════ RIGHT COLUMN ════════════════ */}
        <motion.div
          className="right-col"
          style={{
            transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
            transition: 'transform 0.08s linear',
          }}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Orange glow halo */}
          <div className="agent-halo" />

          {/* Floating agent image */}
          <motion.div
            className="agent-img-wrap"
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={agentImage}
              alt="CompetitorIQ AI Agent — Futuristic 3D female humanoid"
              className="agent-img"
            />
            <div className="agent-rim" />
            <div className="agent-floor-shadow" />
          </motion.div>

          {/* R3F Intelligence sphere */}
          <motion.div
            className="sphere-wrap"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <Suspense fallback={
              <div className="sphere-fallback">
                <div className="sphere-fallback-core" />
              </div>
            }>
              <IntelligenceSphere className="sphere-r3f" />
            </Suspense>
          </motion.div>

          {/* Floating live signals */}
          {LIVE_SIGNALS.map((sig, i) => {
            const positions = [
              { top: '8%',  left: '-14%' },
              { top: '22%', right: '-8%' },
              { top: '45%', left: '-18%' },
              { bottom: '28%', right: '-10%' },
              { bottom: '12%', left: '-10%' },
            ];
            return (
              <SignalTag
                key={sig.label}
                signal={sig}
                style={{ position: 'absolute', ...positions[i] }}
                delay={1.4 + i * 0.2}
              />
            );
          })}

          {/* Status panel */}
          <StatusPanel />
        </motion.div>
      </div>

      {/* Bottom enter hint */}
      <motion.button
        className="enter-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7, y: [0, 7, 0] }}
        transition={{ delay: 2.8, y: { repeat: Infinity, duration: 2 } }}
        onClick={() => navigate('/dashboard')}
      >
        Enter Dashboard ↓
      </motion.button>
    </div>
  );
}
