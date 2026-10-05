---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
<!-- refreshed: 2026-10-05 -->

# Architecture

**Analysis Date:** 2026-10-05

## System Overview

```text
+----------------------------------------------------------------------------------------------------+
|                                    React 19 SPA (Client UI)                                        |
|  Views: Dashboard, ConnectDots, StrategicPatterns, Alerts, Competitors, ExecutiveReports, Agent   |
|  Components: AgentWorkspace, IntelligenceSphere (Three.js), ReasoningPipeline, Modals             |
|  Services: `src/services/apiService.js`                                                            |
+-------------------------------------------------+--------------------------------------------------+
                                                  | HTTP / JSON (REST)
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                             Express 5 API Server (`server/app.js`)                                 |
|  Middlewares: Helmet, CORS, RateLimiter, Pino Logger, Auth / Multi-Tenant Isolation                 |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
         +----------------------------------------+----------------------------------------+
         |                                                                                 |
         v                                                                                 v
+----------------------------------+                             +-----------------------------------+
|     Ingestion & Adapters         |                             |     Intelligence & Reasoning      |
|  - IngestionService              |                             |  - AgentService                   |
|  - Adapters (News, Pricing, etc) |                             |  - OllamaService (qwen2.5:3b)     |
|  - Deduplicator (SHA-256)        |                             |  - ConnectDotsService             |
|  - Normalizer & Classifier       |                             |  - StrategicAnalysisService       |
|  - SSRF Validator & HTML Parser  |                             |  - ExecutiveReportService         |
+-----------------+----------------+                             |  - AlertService                   |
                  |                                              +-----------------+-----------------+
                  |                                                                |
                  +-------------------------------+--------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                            Repository Layer (`server/repositories/`)                               |
|  Competitor, CompetitorEvent, Alert, Analysis, Signal, Source, Conversation, MemoryOperation       |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                  +-------------------------------+-------------------------------+
                  |                                                               |
                  v                                                               v
+-----------------------------------+                           +------------------------------------+
| PostgreSQL + Prisma 6 ORM Schema  |                           |  Hindsight Cloud Vector Memory     |
| Ground Truth Evidence & Signals   |                           |  RETAIN -> RECALL -> REFLECT       |
| `prisma/schema.prisma`            |                           |  (Graceful fallback if degraded)   |
+-----------------------------------+                           +------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Server Entry Point | Bootstraps HTTP listener and process signal handlers | `server/server.js` |
| Express App | Configures middleware pipeline, security headers, routing table | `server/app.js` |
| Ingestion Pipeline | Normalizes raw scraped items, checks deduplication hash, writes events | `server/services/ingestionService.js` |
| Source Adapters | Fetches public competitor URLs with SSRF protection, extracts evidence | `server/adapters/baseAdapter.js` |
| Ollama LLM Service | Handles prompt formatting, streaming chat requests to `qwen2.5:3b` | `server/services/ollamaService.js` |
| Agent Orchestrator | Coordinates query execution, evidence assembly, and LLM reasoning | `server/services/agentService.js` |
| Pattern Analysis | Discovers multi-event clusters and correlations across competitors | `server/services/connectDotsService.js` |
| Strategic Analysis | Produces 5-part structured breakdown (Fact, Observation, Inference, etc.) | `server/services/strategicAnalysisService.js` |
| Alert Engine | Evaluates deterministic threat rules and manages alert state | `server/services/alertService.js` |
| Background Scheduler | Executes cron-like periodic polling for registered public sources | `server/services/monitoringScheduler.js` |
| Prisma Repositories | Encapsulates database queries and data transforms | `server/repositories/` |
| Frontend API Client | Centralizes backend HTTP communication and token handling | `src/services/apiService.js` |
| Frontend Workspace | Interactive UI with real-time agent responses and grounded citations | `src/components/agent/AgentWorkspace.jsx` |

## Pattern Overview

**Overall:** Layered Architecture with Pipeline Ingestion and Repository Pattern

**Key Characteristics:**
- **Layer Separation:** Strict decoupling between Controllers (`server/controllers/`), Domain Services (`server/services/`), and Database Repositories (`server/repositories/`).
- **Grounded Verification:** AI agent queries retrieve PostgreSQL factual records first before synthesizing responses through local Ollama or deterministic fallbacks.
- **Fail-Safe Degradation:** If external dependencies (Ollama LLM or Hindsight vector service) are stopped or unreachable, the system automatically falls back to deterministic rule-based output without throwing unhandled exceptions.

## Layers

**Presentation Layer (Frontend):**
- Purpose: Responsive single-page application for intelligence visualization, queries, and monitoring
- Location: `src/`
- Contains: React components, views, context providers, CSS styling
- Depends on: `src/services/apiService.js`
- Used by: End users in modern web browsers

**API & Routing Layer:**
- Purpose: HTTP request routing, input validation, and auth header propagation
- Location: `server/routes/` and `server/controllers/`
- Contains: Express routers, request handlers, rate limiting
- Depends on: Domain services
- Used by: Client application and external webhooks

**Domain Services Layer:**
- Purpose: Core intelligence logic, pattern detection, LLM prompt generation, source scraping
- Location: `server/services/`, `server/adapters/`, `server/ingestion/`
- Contains: Business logic and orchestration workflows
- Depends on: Repositories, Ollama HTTP endpoint, Hindsight client
- Used by: Controllers and background scheduler

**Data Access Layer (Repositories):**
- Purpose: Type-safe database queries via Prisma ORM
- Location: `server/repositories/`
- Contains: Repository functions querying Prisma models
- Depends on: `@prisma/client`
- Used by: Domain services

## Data Flow

### Primary Request Path (Ingestion Pipeline)

1. **Trigger:** Scheduler or manual trigger invokes adapter collection (`server/services/adapterIngestionService.js:15`)
2. **Fetch & Parse:** Adapter validates URL with SSRF protection and extracts structured intelligence (`server/adapters/httpFetcher.js:20`, `server/adapters/htmlParser.js:15`)
3. **Deduplication:** Content hash is computed and checked against database and memory cache (`server/ingestion/deduplicator.js:30`)
4. **Classification & Normalization:** Signal classification and event entity creation (`server/ingestion/normalizer.js:25`, `server/ingestion/classifier.js:12`)
5. **Persistence:** Event, source, and signals saved to PostgreSQL (`server/repositories/competitorEventRepository.js:35`)
6. **Alert Evaluation:** Rule matcher triggers alerts for high-importance events (`server/services/alertService.js:40`)

### Intelligence Query Flow

1. User submits natural language query via `src/components/agent/AgentWorkspace.jsx`
2. Frontend dispatches `POST /api/agent/query` (`src/services/apiService.js`)
3. Controller delegates to `agentService.executeQuery` (`server/controllers/agentController.js`)
4. Service loads factual events, competitors, and signals from repository layer (`server/repositories/`)
5. If Ollama is available, prompts `qwen2.5:3b` with assembled factual ground truth context (`server/services/ollamaService.js`)
6. If Ollama is unavailable, deterministic synthesis generates structured markdown response
7. Response returned with metadata, grounding badges, and evidence citations

## Key Abstractions

**Source Adapter (`server/adapters/baseAdapter.js`):**
- Defines lifecycle: `fetch()` -> `parse()` -> `normalize()`
- Implementations: `NewsPressAdapter`, `ProductReleaseAdapter`, `PricingPageAdapter`, `CareersHiringAdapter`

**Deduplicator (`server/ingestion/deduplicator.js`):**
- Generates SHA-256 hash from competitor, title, date, and canonical content to guarantee idempotency

**Repository Pattern (`server/repositories/`):**
- Isolates Prisma queries from business services, allowing uniform testing and mocking

## Entry Points

**Backend Server:**
- Location: `server/server.js`
- Triggers: `node server/server.js` or `npm run dev:server`
- Responsibilities: Loads environment, initializes Prisma, starts Express listener, handles SIGINT/SIGTERM

**Frontend Application:**
- Location: `src/main.jsx`
- Triggers: Vite browser entry from `index.html`
- Responsibilities: Mounts React DOM, renders `App.jsx` with Router and Context providers

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with asynchronous non-blocking I/O
- **Global State:** In-memory deduplication set and scheduler timers; database persistence handles all application state
- **Network Boundaries:** Local Ollama bound to `http://localhost:11434`; external scraper requests strictly bound to allowlisted public hostnames via `server/adapters/ssrfValidator.js`

## Anti-Patterns

### Bypassing Ingestion Deduplication

**What happens:** Directly writing to `CompetitorEvent` repository without computing content hash.
**Why it's wrong:** Creates duplicate records and redundant alerts for identical web pages.
**Do this instead:** Always route incoming events through `ingestionService.processBatch()` or `deduplicator.isDuplicate()`.

### Client-Side Direct LLM or Secret Calls

**What happens:** Invoking Ollama or third-party AI APIs directly from React frontend.
**Why it's wrong:** Breaks security boundaries, leaks local network topology, and loses multi-tenant auditing.
**Do this instead:** Use server-side proxy route `/api/agent/query` with backend authentication.

## Error Handling

**Strategy:** Express middleware with centralized error responses adhering to `{ success: false, data: null, error: { code, message } }` format.

**Patterns:**
- Try/catch blocks in controllers delegating unhandled exceptions to `next(err)`.
- Graceful degradation for Ollama and Hindsight memory failures.

## Cross-Cutting Concerns

**Logging:** Structured Pino HTTP request logging (`server/middlewares/loggerMiddleware.js`)
**Validation:** Zod schemas for environment (`server/config/env.js`) and payload validators
**Authentication & Multi-Tenancy:** `authMiddleware.js` extracting tenant context from `x-organization-id` header

---

*Architecture analysis: 2026-10-05*
