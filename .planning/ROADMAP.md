# Roadmap: CompetitorIQ — Enterprise Competitive Intelligence Platform

## Overview

CompetitorIQ transforms into a battle-tested, production-ready AI-powered Competitive Intelligence Agent tracking Microsoft's competitive landscape against AWS, Google Cloud, Oracle, Salesforce, and IBM. The roadmap focuses on defect remediation, full frontend-backend integration, mandatory pre-retrieval ground truth evidence pipelines, an autonomous agent execution loop with local Ollama (`qwen2.5:3b`) and Hindsight memory, multi-competitor source adapters, and production hardening for both live hackathon demos and cloud deployment.

## Phases

- [ ] **Phase 1: Defect Remediation & Full Frontend-Backend Binding** - Resolve existing codebase warnings/bugs and wire all views, dropdowns, and modals to real Express API endpoints and PostgreSQL.
- [ ] **Phase 2: Pre-Retrieval Evidence & Grounding Pipeline** - Enforce mandatory factual evidence retrieval prior to insight generation, strict 5-part epistemological claim labeling, and verifiable citations.
- [ ] **Phase 3: Autonomous AI Agent Execution Loop & Local Ollama Reasoning** - Implement autonomous planning, action/tool execution, iterative evaluation, and self-correction in `AgentService` using local Ollama (`qwen2.5:3b`) with deterministic fallback.
- [ ] **Phase 4: Hindsight Memory Orchestration & Conversational Continuity** - Complete RETAIN, RECALL, and REFLECT workflows with persistent multi-turn conversational context and session continuity.
- [ ] **Phase 5: Microsoft & Hyperscaler Ecosystem Tracking Expansion** - Implement verified public source tracking for Microsoft, AWS, Google Cloud, Oracle, Salesforce, and IBM across products, pricing, partnerships, and hiring.
- [ ] **Phase 6: Production Hardening, Security, E2E Verification & Demo Flow** - Finalize multi-tenant security, rate limiting, comprehensive automated test suites, and 60-second hackathon live demo flow validation.

## Phase Details

### Phase 1: Defect Remediation & Full Frontend-Backend Binding
**Goal**: Resolve open linter/runtime bugs, clean up uncommitted deletions, and fully bind all frontend views, dropdowns, and interactive modals to real backend Express endpoints and PostgreSQL data without altering existing visual styling.
**Depends on**: Nothing (first phase)
**Requirements**: INTG-01, INTG-02, INTG-03, PROD-01
**Success Criteria**:
  1. Frontend views (Dashboard, Alerts, Competitors, Connect-the-Dots, Strategic Patterns, Comparison, Reports) render live data from backend APIs with zero mock placeholders.
  2. Dropdown filters (competitor selection, severity levels, time windows) trigger real database queries and update UI state smoothly.
  3. Oxlint linter runs with zero errors and unneeded compiler warnings on state in effects are cleanly resolved.
  4. Node.js backend server and Vite frontend communicate without CORS or payload errors.
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] 01-01: Clean up working tree, resolve Oxlint warnings, fix React compiler state-in-effect issues, and standardize API response handling.
- [ ] 01-02: Connect frontend views (DashboardView, AlertsView, CompetitorProfileView, ConnectTheDotsView) to live Express routes with PostgreSQL data.
- [ ] 01-03: Connect remaining views (StrategicPatternsView, CompetitiveComparisonView, ExecutiveReportView, Modals) and verify interactive filtering.

### Phase 2: Pre-Retrieval Evidence & Grounding Pipeline
**Goal**: Establish an unshakeable ground truth foundation where all AI generation and analytical services mandatorily query PostgreSQL factual evidence before synthesizing text, strictly separating facts from inferences.
**Depends on**: Phase 1
**Requirements**: EVID-01, EVID-02, EVID-03
**Success Criteria**:
  1. No intelligence claim is synthesized without first retrieving matching `CompetitorEvent` and `EventEvidence` records from the database.
  2. Every response explicitly separates content into 5 epistemological sections: `FACT`, `OBSERVATION`, `INFERENCE`, `IMPLICATION`, and `UNKNOWN`.
  3. All claims display verifiable evidence cards showing source URL, publisher, excerpt, and capture timestamp.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Build evidence retrieval pipeline in `agentService.js` and repositories that enforces mandatory pre-retrieval.
- [ ] 02-02: Implement epistemological claim classifier and update UI components to prominently render the 5 epistemological categories and evidence links.

### Phase 3: Autonomous AI Agent Execution Loop & Local Ollama Reasoning
**Goal**: Upgrade the AI Agent from simple single-turn prompt execution into an autonomous multi-step reasoning agent with planning, tool invocation, iteration, and self-correction powered by local Ollama (`qwen2.5:3b`).
**Depends on**: Phase 2
**Requirements**: AGENT-01, AGENT-02, AGENT-03
**Success Criteria**:
  1. Agent dynamically decomposes user queries into execution plans, invokes internal tools (database search, pattern correlation, comparison matrix), and synthesizes answers.
  2. Local Ollama `qwen2.5:3b` generates grounded reasoning within the configured timeout window.
  3. When Ollama is stopped or unreachable, the system automatically falls back to deterministic synthesis with clear UI indicator badges, never throwing 500 errors.
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 03-01: Implement agent execution loop (plan → act → evaluate → self-correct) and tool registry in `agentService.js`.
- [ ] 03-02: Optimize Ollama `qwen2.5:3b` prompting, context assembly, timeout handling, and deterministic fallback transparency.

### Phase 4: Hindsight Memory Orchestration & Conversational Continuity
**Goal**: Integrate Hindsight Cloud vector memory across RETAIN, RECALL, and REFLECT stages and maintain conversational context across multi-turn sessions.
**Depends on**: Phase 3
**Requirements**: MEM-01, MEM-02, CONV-01, CONV-02
**Success Criteria**:
  1. New competitive signals automatically trigger Hindsight RETAIN indexing on ingestion.
  2. Queries perform semantic RECALL and executive reports perform REFLECT with graceful fallback when credits are exhausted or service is degraded.
  3. Multi-turn conversations persist in `AgentConversation` and `AgentMessage` tables, allowing context-aware follow-up queries.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Orchestrate Hindsight memory operations (RETAIN, RECALL, REFLECT) with graceful degradation logging in `agentService.js` and `hindsightRoutes.js`.
- [ ] 04-02: Wire conversational persistence and multi-turn context resolution into frontend `AgentWorkspace` and backend conversation repositories.

### Phase 5: Microsoft & Hyperscaler Ecosystem Tracking Expansion
**Goal**: Expand and verify source adapters for Microsoft and key enterprise competitors (AWS, Google Cloud, Oracle, Salesforce, IBM) across all event taxonomies.
**Depends on**: Phase 4
**Requirements**: INGEST-01, INGEST-02, INGEST-03
**Success Criteria**:
  1. Verified public sources for Microsoft, AWS, GCP, Oracle, Salesforce, and IBM are registered and actively monitored.
  2. Adapters capture and normalize events for product releases, pricing changes, partnerships, hiring signals, and leadership shifts.
  3. Ingestion pipeline enforces SSRF protection, SHA-256 deduplication, and rate-limited scheduler execution.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Update `sourcesConfig.js` and adapters to comprehensively cover Microsoft and the 5 competitor ecosystems.
- [ ] 05-02: Implement seed fixtures and test automated polling, deduplication, and alert dispatch across all source types.

### Phase 6: Production Hardening, Security, E2E Verification & Demo Flow
**Goal**: Complete production readiness with security auditing, multi-tenant isolation, comprehensive test coverage, and seamless 60-second hackathon live demo flow.
**Depends on**: Phase 5
**Requirements**: PROD-02, PROD-03, PROD-04
**Success Criteria**:
  1. Multi-tenant isolation is verified across all endpoints, preventing cross-organization data leakage.
  2. All test suites in `tests/` pass with zero failures under `npm test`.
  3. The end-to-end 60-second hackathon demo script executes flawlessly from ingestion to executive report and agent query.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Enforce multi-tenant organization checks, rate limiting, and security headers across all routes and repositories.
- [ ] 06-02: Execute full regression testing, add missing E2E test coverage, and validate the 60-second hackathon live demo flow.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Defect Remediation & Full Frontend-Backend Binding | 0/3 | Not started | - |
| 2. Pre-Retrieval Evidence & Grounding Pipeline | 0/2 | Not started | - |
| 3. Autonomous AI Agent Execution Loop & Local Ollama Reasoning | 0/2 | Not started | - |
| 4. Hindsight Memory Orchestration & Conversational Continuity | 0/2 | Not started | - |
| 5. Microsoft & Hyperscaler Ecosystem Tracking Expansion | 0/2 | Not started | - |
| 6. Production Hardening, Security, E2E Verification & Demo Flow | 0/2 | Not started | - |
