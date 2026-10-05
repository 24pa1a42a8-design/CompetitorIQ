# Requirements: CompetitorIQ

**Defined:** 2026-10-05
**Core Value:** Evidence-grounded competitive intelligence where every claim is backed by verifiable primary source citations, strictly separating empirical facts from analytical inferences, and operating reliably with deterministic fallbacks even when external services degrade.

## v1 Requirements

### Integration & Data Binding (`INTG`)

- [ ] **INTG-01**: All frontend views (Dashboard, Alerts, Competitor Profile, Connect-the-Dots, Strategic Patterns, Comparison, Executive Reports, Agent Workspace) query real backend Express API endpoints rather than mock state.
- [ ] **INTG-02**: Dropdowns, filters (competitor, severity, date range, source type), and interactive modals receive and mutate PostgreSQL ground truth state.
- [ ] **INTG-03**: Existing frontend, backend, routing, and controller defects are resolved while preserving the existing UI visual design and component hierarchy.

### Evidence Grounding & Claim Epistemology (`EVID`)

- [ ] **EVID-01**: Agent and analysis pipelines execute pre-retrieval against PostgreSQL ground truth before generating any competitive narrative or answer.
- [ ] **EVID-02**: All outputs strictly categorize statements into the 5 epistemological buckets: `FACT` (verifiable primary text), `OBSERVATION` (empirically detected pattern), `INFERENCE` (logical deduction), `IMPLICATION` (business impact), and `UNKNOWN` (unverified or missing information).
- [ ] **EVID-03**: Every synthesized claim includes explicit evidence citations linking to source URL, publisher, excerpt, and capture timestamp.

### Autonomous AI Agent Execution (`AGENT`)

- [ ] **AGENT-01**: AI Agent implements an autonomous execution loop comprising: Goal Interpretation → Plan Generation → Tool/Action Execution → Iterative Evaluation → Self-Correction.
- [ ] **AGENT-02**: Local Ollama LLM integration (`qwen2.5:3b`) generates structured, grounded responses within configurable timeout (default 15-60s).
- [ ] **AGENT-03**: System provides deterministic rule-based fallback when Ollama is offline or uninstalled, guaranteeing zero 500 crashes and badge transparency (`Ollama Grounded` vs `Deterministic Synthesis Fallback`).

### Memory & Conversational Continuity (`MEM` & `CONV`)

- [ ] **MEM-01**: Hindsight vector memory executes RETAIN during signal ingestion to index high-value competitive signals.
- [ ] **MEM-02**: Hindsight vector memory executes RECALL during query answering and REFLECT during executive macro-trend analysis, with transparent `DEGRADED` fallback on credit exhaustion.
- [ ] **CONV-01**: Multi-turn conversation sessions persist in `AgentConversation` and `AgentMessage` tables with context-aware follow-up reasoning.
- [ ] **CONV-02**: Follow-up questions reference prior conversation turns, active competitor context, and previously retrieved evidence.

### Public Ingestion & Hyperscaler Tracking (`INGEST`)

- [ ] **INGEST-01**: Ingestion adapters track Microsoft and primary competitors: AWS, Google Cloud, Oracle, Salesforce, and IBM.
- [ ] **INGEST-02**: Tracked event taxonomy covers product launches, pricing updates, strategic partnerships, hiring spikes, and leadership changes.
- [ ] **INGEST-03**: All adapter fetching enforces SSRF validation, content-hash deduplication (SHA-256), and rate-limited scheduling.

### Production Reliability, Security & Testing (`PROD`)

- [ ] **PROD-01**: Oxlint linter issues and React compiler warnings are resolved across codebase.
- [ ] **PROD-02**: Multi-tenant organization isolation (`OrganizationId`) is enforced across all repository queries and API endpoints.
- [ ] **PROD-03**: Automated test suites cover unit, integration, and E2E user journeys with high reliability under Node test runner.
- [ ] **PROD-04**: End-to-end hackathon demo flow (Dashboard → Ingest → Alert → Memory/Ollama → Connect-the-Dots → Executive Report → Agent Query) runs smoothly without manual intervention.

## v2 Requirements

- **NOTF-01**: Real-time outbound webhook notifications (Slack/Teams/Discord) on critical severity alerts.
- **HEADLESS-01**: Headless Chromium (Puppeteer/Playwright) adapter for JavaScript-rendered competitor careers and product pages.
- **VECTOR-01**: Local Milvus/pgvector option for self-hosted vector memory fallback when cloud vector service is unreachable.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting working backend or UI modules from scratch | Preserving existing architecture and investment is a core project directive |
| Redesigning the visual look and feel | Existing dark glassmorphic design system is already validated and preferred |
| Client-side unauthenticated LLM calls | Bypasses multi-tenant auditing and risks secret exposure; all AI calls stay server-side |
| Proprietary cloud-only LLM lock-in | System must run locally on private Ollama `qwen2.5:3b` with offline resilience |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTG-01 | Phase 1 | Pending |
| INTG-02 | Phase 1 | Pending |
| INTG-03 | Phase 1 | Pending |
| PROD-01 | Phase 1 | Pending |
| EVID-01 | Phase 2 | Pending |
| EVID-02 | Phase 2 | Pending |
| EVID-03 | Phase 2 | Pending |
| AGENT-01 | Phase 3 | Pending |
| AGENT-02 | Phase 3 | Pending |
| AGENT-03 | Phase 3 | Pending |
| MEM-01 | Phase 4 | Pending |
| MEM-02 | Phase 4 | Pending |
| CONV-01 | Phase 4 | Pending |
| CONV-02 | Phase 4 | Pending |
| INGEST-01 | Phase 5 | Pending |
| INGEST-02 | Phase 5 | Pending |
| INGEST-03 | Phase 5 | Pending |
| PROD-02 | Phase 6 | Pending |
| PROD-03 | Phase 6 | Pending |
| PROD-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-05*
*Last updated: 2026-10-05 after initialization*
