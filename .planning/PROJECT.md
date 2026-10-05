# CompetitorIQ — Enterprise Competitive Intelligence Platform

## What This Is

CompetitorIQ is a production-ready, evidence-grounded Competitive Intelligence Agent focused on Microsoft's competitive landscape against hyperscaler and enterprise software competitors (AWS, Google Cloud, Oracle, Salesforce, and IBM). The platform ingests verified public signals, evaluates threat patterns, and synthesizes executive intelligence through local Ollama (`qwen2.5:3b`) grounded reasoning and Hindsight vector memory.

## Core Value

Evidence-grounded competitive intelligence where every claim is backed by verifiable primary source citations, strictly separating empirical facts from analytical inferences, and operating reliably with deterministic fallbacks even when external services degrade.

## Business Context

- **Customer**: Enterprise strategy teams, competitive intelligence analysts, product leaders, and executive decision-makers tracking hyperscaler cloud/AI competition.
- **Revenue model**: B2B enterprise tiering (Free, Pro, Enterprise multi-tenant organizations).
- **Success metric**: 100% citation grounding rate for AI claims, zero unhandled service crashes, and sub-second deterministic fallback responses.
- **Strategy notes**: Focus on Microsoft vs AWS, GCP, Oracle, Salesforce, and IBM across cloud infrastructure, AI models, developer tooling, pricing shifts, and strategic partnerships.

## Requirements

### Validated

- ✓ Automated public source ingestion with SSRF protection and HTML normalization (`server/adapters/`, `server/ingestion/`) — existing
- ✓ Content deduplication via SHA-256 cryptographic hashing and database URL matching (`server/ingestion/deduplicator.js`) — existing
- ✓ PostgreSQL ground-truth schema managed with Prisma 6 ORM (`prisma/schema.prisma`) — existing
- ✓ Deterministic alert rule matching and severity classification (`server/services/alertService.js`) — existing
- ✓ Local Ollama LLM integration (`qwen2.5:3b`) with deterministic synthesis fallback (`server/services/ollamaService.js`) — existing
- ✓ Hindsight Cloud vector memory integration with graceful DEGRADED state handling (`server/services/agentService.js`) — existing
- ✓ Cross-event multi-node pattern correlation ("Connect the Dots") (`server/services/connectDotsService.js`) — existing
- ✓ 5-part strategic inference breakdown: Fact, Observation, Inference, Implication, Unknown (`server/services/strategicAnalysisService.js`) — existing
- ✓ React 19 single-page workspace with Three.js 3D sphere, Tailwind v4 styling, and Framer Motion interactions (`src/`) — existing
- ✓ Native Node.js test runner suite (`16 test suites in tests/`) — existing

### Active

- [ ] **Autonomous AI Agent Execution Loop**: Implement multi-step reasoning, planning, action/tool execution, iterative evaluation, and self-correction within `AgentService`.
- [ ] **Full Frontend-to-Backend Binding**: Connect all frontend views, dropdowns, filters, and modals completely to backend Express routes and PostgreSQL ground truth.
- [ ] **Enhanced Local Ollama Grounding**: Refine prompt engineering and context assembly for `qwen2.5:3b` to maximize grounded citation precision and prevent hallucinations.
- [ ] **Hindsight Memory Orchestration**: Wire RETAIN (event ingestion), RECALL (query similarity search), and REFLECT (macro-trend synthesis) into agent workflows with truthful fallback indicators.
- [ ] **Pre-Retrieval Evidence Pipeline**: Ensure every intelligence response mandatorily queries and retrieves PostgreSQL verified evidence prior to insight generation.
- [ ] **Microsoft & Competitor Ecosystem Tracking**: Track Microsoft and target competitors (AWS, Google Cloud, Oracle, Salesforce, IBM) across product launches, pricing changes, partnerships, hiring signals, and leadership moves.
- [ ] **Context-Aware Conversational Continuity**: Maintain multi-turn conversation memory, follow-up query awareness, and session persistence in `AgentConversation` and `AgentMessage`.
- [ ] **Comprehensive Defect Remediation**: Fix existing frontend, backend, API, database, and integration defects without replacing working functionality.
- [ ] **UI/UX Preservation**: Preserve existing CompetitorIQ visual identity, navigation, and components, modifying only where required for functional correctness.
- [ ] **Production Quality & Safeguards**: Add robust error handling, schema validations, structured Pino logging, and security safeguards (rate limiting, tenant isolation, SSRF prevention).
- [ ] **Epistemological Claim Distinction**: Strictly distinguish verifiable facts from analytical inferences across all UI displays and agent outputs.
- [ ] **Demo & Production Reliability**: Ensure end-to-end operational stability for live hackathon demonstration and cloud deployment.

### Out of Scope

- Rewriting existing architecture from scratch (working components must be preserved).
- Removing the dark glassmorphic UI design or altering styling unnecessarily.
- Direct client-side calls to Ollama or Hindsight APIs (all third-party calls remain server-proxied for security).
- Cloud-only LLM vendor lock-in (must run locally on Ollama `qwen2.5:3b` with deterministic fallbacks).

## Context

- **Runtime & Stack**: Node.js 22+, Express 5, React 19, Tailwind CSS v4, Prisma 6, PostgreSQL, Ollama (`qwen2.5:3b`), Hindsight Cloud vector client.
- **Architectural Reference**: Documented in `.planning/codebase/` (`STACK.md`, `INTEGRATIONS.md`, `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`).
- **Codebase State**: Brownfield enterprise application with 16 automated test suites passing.

## Constraints

- **Local LLM**: Local Ollama with `qwen2.5:3b` is the primary reasoning engine; must never crash if Ollama is offline.
- **Memory Service**: Hindsight Cloud memory must gracefully degrade to `DEGRADED` status when offline or credit-exhausted without interrupting queries.
- **Security**: Strict SSRF protection on public adapters; multi-tenant organization isolation on all database queries.
- **Preservation**: Do not rewrite working modules; refine and repair in place.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Retain existing layered architecture | Working components are battle-tested with 16 passing test suites | ✓ Good |
| Server-side agent orchestration | Protects API credentials, prevents client-side leaks, allows multi-tenant auditing | ✓ Good |
| Local Ollama `qwen2.5:3b` with deterministic fallback | Zero-cost private local inference with 100% offline resilience | ✓ Good |
| Strict epistemological claim labeling | Prevents AI hallucinations from contaminating strategic business decisions | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-10-05 after initialization*
