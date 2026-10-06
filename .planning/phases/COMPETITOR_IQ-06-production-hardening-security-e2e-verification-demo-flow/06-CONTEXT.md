# Phase 6 Context: Production Hardening, Security, E2E Verification & Demo Flow

## Context Overview
Phase 6 delivers final production readiness for CompetitorIQ across multi-tenant security auditing (`PROD-02`), comprehensive end-to-end test verification (`PROD-03`), and a scripted 60-second live hackathon demo flow (`PROD-04`).

## Locked Decisions

### D-24: Global Multi-Tenant Security & Organization Isolation
- `authMiddleware.js` validates `x-organization-id` headers on all `/api/*` routes.
- Requests without a valid tenant header receive `401 Unauthorized` or `403 Forbidden` responses.
- Database queries across all repositories enforce strict `organizationId` scoping to prevent cross-tenant data leakage.

### D-25: Rate Limiting & Security Controls
- Standard rate-limiting middleware configured on high-traffic endpoints (`POST /api/agent/query`, `POST /api/ingestion/refresh`).
- CORS origin validation and security headers active on Express server.

### D-26: Complete Test Suite & Regression Pipeline (`npm test`)
- Unified test suite executing all test files (`tests/*.test.js`) under Node test runner.
- Guaranteed 100% test pass rate across multi-tenant security, pre-retrieval evidence grounding, agent loop reasoning, memory persistence, and hyperscaler ingestion.
- `oxlint` linter verified at 0 warnings and 0 errors.

### D-27: Automated 60-Second Hackathon Live Demo Script (`npm run demo`)
- `server/scripts/demoFlow.js` provides an automated command-line and programmatic runner executing the 4 core demo beats:
  1. **Beat 1: Multi-Hyperscaler Signal Ingestion** — Polling Microsoft, AWS, GCP, Oracle, Salesforce, IBM with hybrid fallback.
  2. **Beat 2: Factual Grounding & Epistemological Briefing** — Generating executive report with mandatory 5-part classification (`FACT`, `OBSERVATION`, `INFERENCE`, `IMPLICATION`, `UNKNOWN`).
  3. **Beat 3: Autonomous Agent Execution** — Multi-step tool execution with Ollama reasoning and deterministic brief fallback.
  4. **Beat 4: Provenance & Memory Verification** — Displaying verifiable source URLs, excerpts, capture timestamps, and Hindsight status.

## Plans Structure
- **06-01-PLAN.md:** Security Hardening, Multi-Tenant Auth Middleware, Rate Limiting & E2E Security Tests (`PROD-02`, `PROD-03`).
- **06-02-PLAN.md:** 60-Second Hackathon Live Demo Script & End-to-End Regression Verification (`PROD-03`, `PROD-04`).
