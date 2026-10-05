<!-- GSD:project-start source:PROJECT.md -->

## Project

**CompetitorIQ — Enterprise Competitive Intelligence Platform**

CompetitorIQ is a production-ready, evidence-grounded Competitive Intelligence Agent focused on Microsoft's competitive landscape against hyperscaler and enterprise software competitors (AWS, Google Cloud, Oracle, Salesforce, and IBM). The platform ingests verified public signals, evaluates threat patterns, and synthesizes executive intelligence through local Ollama (`qwen2.5:3b`) grounded reasoning and Hindsight vector memory.

**Core Value:** Evidence-grounded competitive intelligence where every claim is backed by verifiable primary source citations, strictly separating empirical facts from analytical inferences, and operating reliably with deterministic fallbacks even when external services degrade.

### Constraints

- **Local LLM**: Local Ollama with `qwen2.5:3b` is the primary reasoning engine; must never crash if Ollama is offline.
- **Memory Service**: Hindsight Cloud memory must gracefully degrade to `DEGRADED` status when offline or credit-exhausted without interrupting queries.
- **Security**: Strict SSRF protection on public adapters; multi-tenant organization isolation on all database queries.
- **Preservation**: Do not rewrite working modules; refine and repair in place.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (ES Modules, ECMAScript 2023+) - Used across backend (`server/`) and frontend (`src/`)
- JSX (`.jsx`) - Frontend user interface components in `src/`
- SQL / Prisma Schema (`.prisma`) - Data model definitions in `prisma/schema.prisma`
- CSS / Tailwind (`.css`) - Styling in `src/index.css`, `src/App.css`, `src/pages/AgentHero.css`

## Runtime

- Node.js `v22.20.0` (LTS runtime, tested with Node test runner `--test`)
- npm `10.9.3`
- Lockfile: `package-lock.json` present

## Frameworks

- Express `5.2.1` (`server/app.js`, `server/server.js`) - REST API server, routing, middleware pipeline
- React `19.2.8` (`src/App.jsx`, `src/main.jsx`) - Component-based client SPA
- React Router DOM `7.18.4` (`src/App.jsx`) - Client-side routing with protected routes and layouts
- Node.js built-in Test Runner (`node --test`, Node 22+) - Unit, integration, and E2E testing in `tests/`
- Node Assert (`node:assert/strict`) - Test assertion library
- Vite `8.3.0` (`vite.config.js`) - Client bundler and development server
- `@vitejs/plugin-react` `6.1.1` - Fast Refresh and JSX transformation
- Oxlint `1.81.0` (`.oxlintrc.json`) - High-performance Rust-based JavaScript/React linter

## Key Dependencies

- `@prisma/client` `^6.4.0` / `prisma` `^6.4.0` - ORM client and database schema migrations (`prisma/schema.prisma`)
- `@vectorize-io/hindsight-client` `^0.10.1` - Hindsight Cloud semantic memory client (`server/services/agentService.js`, `server/services/connectDotsService.js`)
- Local Ollama Client (Native HTTP via `fetch` to `http://localhost:11434`) - Local LLM grounded inference (`qwen2.5:3b`) (`server/services/ollamaService.js`)
- `zod` `^4.6.5` - Schema validation for environment and payloads (`server/config/env.js`)
- `framer-motion` `^13.5.0` - UI micro-interactions and transitions
- `three` `^0.186.1`, `@react-three/fiber` `^9.8.1`, `@react-three/drei` `^10.7.9` - 3D visual intelligence sphere and pattern graphs
- `helmet` `^8.3.0` - HTTP security response headers (`server/app.js`)
- `cors` `^2.8.6` - Cross-Origin Resource Sharing configuration (`server/app.js`)
- `express-rate-limit` `^8.7.0` - API request rate limiting (`server/middlewares/rateLimiter.js`)
- `pino` `^10.3.1` & `pino-http` `^11.0.0` - Structured JSON logging (`server/middlewares/loggerMiddleware.js`)
- `dotenv` `^18.0.4` - Environment variable resolution (`server/config/env.js`)
- `tailwindcss` `^4.3.3` & `@tailwindcss/vite` `^4.3.3` - Modern utility-first CSS engine

## Configuration

- Centralized schema validation in `server/config/env.js` using Zod
- Environment file template: `.env.example`
- Critical runtime variables:
- `vite.config.js`: React plugin, Tailwind CSS Vite plugin, development proxy to backend port 5000
- `.oxlintrc.json`: Linter rule configuration for correctness and React hooks

## Platform Requirements

- Node.js >= 22.0.0
- PostgreSQL database instance (local or remote)
- Local Ollama daemon running on `http://localhost:11434` with model `qwen2.5:3b`
- Node.js runtime container or VPS with PostgreSQL access
- Static asset hosting for Vite build output (`dist/`) or served via Express

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React components and views: PascalCase with `.jsx` extension (`AgentWorkspace.jsx`, `AlertsView.jsx`, `Input.jsx`)
- Backend services, controllers, routes, repositories: camelCase with `.js` extension (`agentService.js`, `alertController.js`, `competitorEventRepository.js`)
- Test files: kebab-case or camelCase ending in `.test.js` (`adapters.test.js`, `agentPerformanceAndLifecycle.test.js`)
- camelCase for standard functions, asynchronous operations, and React hooks (`executeQuery`, `isDuplicate`, `useAuth`, `formatCurrency`)
- PascalCase for React functional components (`AgentWorkspace`, `TopNavbar`)
- camelCase for local variables, object properties, and state hooks (`events`, `selectedCompetitor`, `isLoading`)
- UPPER_SNAKE_CASE for module constants, fixed configuration dictionaries, and enums (`DEFAULT_LIMIT`, `SOURCE_TYPES`, `SEVERITY_LEVELS`)
- PascalCase for Prisma models and Zod schemas (`Organization`, `CompetitorEvent`, `envSchema`)

## Code Style

- Standard 2-space indentation
- Semicolons used consistently
- ES Modules (`import` / `export`) throughout entire codebase (configured via `"type": "module"` in `package.json`)
- Linter: Oxlint (`oxlint` `^1.81.0`)
- Config: `.oxlintrc.json`
- Run command: `npm run lint`
- Unused variables: Variables intentionally ignored should be prefixed with an underscore (`_`)

## Import Organization

- Standard relative imports (`./` and `../`) are used across both backend and frontend

## Error Handling

- Express async routes wrap business operations in try/catch or propagate errors to `next(err)`.
- Backend utilizes `server/middlewares/errorHandler.js` to catch unhandled errors and format standardized 500 responses without leaking internal stack traces.
- External dependencies (Ollama LLM, Hindsight memory) catch connection failures and gracefully fallback to deterministic synthesis.

## Logging

- Always pass context object as first argument, followed by message:
- Avoid unformatted `console.log` in production backend code.

## Comments

- Explain complex regex or heuristics in adapters (`server/adapters/htmlParser.js`)
- Document domain-specific multi-tenant isolation rules (`server/middlewares/authMiddleware.js`)
- Clarify graceful degradation workflows for offline LLM or memory exhaustion
- Used on public service methods to document parameter shapes, return types, and exceptions.

## Function Design

- Single responsibility: Handlers in controllers parse input and delegate immediately to domain services.
- Data fetching logic isolated in repositories.
- Options objects preferred for methods with more than 2 parameters:
- Services return plain JavaScript objects or arrays, never raw Express response objects.

## Module Design

- Named exports preferred for domain utilities, repositories, and helper functions (`export function deduplicateEvents(...)`)
- Default exports used for Express applications, routers, and React components (`export default app`, `export default DashboardView`)

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text
|                                    React 19 SPA (Client UI)                                        |
|  Views: Dashboard, ConnectDots, StrategicPatterns, Alerts, Competitors, ExecutiveReports, Agent   |
|  Components: AgentWorkspace, IntelligenceSphere (Three.js), ReasoningPipeline, Modals             |
|  Services: `src/services/apiService.js`                                                            |
|                             Express 5 API Server (`server/app.js`)                                 |
|  Middlewares: Helmet, CORS, RateLimiter, Pino Logger, Auth / Multi-Tenant Isolation                 |
|     Ingestion & Adapters         |                             |     Intelligence & Reasoning      |
|  - IngestionService              |                             |  - AgentService                   |
|  - Adapters (News, Pricing, etc) |                             |  - OllamaService (qwen2.5:3b)     |
|  - Deduplicator (SHA-256)        |                             |  - ConnectDotsService             |
|  - Normalizer & Classifier       |                             |  - StrategicAnalysisService       |
|  - SSRF Validator & HTML Parser  |                             |  - ExecutiveReportService         |
|                            Repository Layer (`server/repositories/`)                               |
|  Competitor, CompetitorEvent, Alert, Analysis, Signal, Source, Conversation, MemoryOperation       |
| PostgreSQL + Prisma 6 ORM Schema  |                           |  Hindsight Cloud Vector Memory     |
| Ground Truth Evidence & Signals   |                           |  RETAIN -> RECALL -> REFLECT       |
| `prisma/schema.prisma`            |                           |  (Graceful fallback if degraded)   |
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

- **Layer Separation:** Strict decoupling between Controllers (`server/controllers/`), Domain Services (`server/services/`), and Database Repositories (`server/repositories/`).
- **Grounded Verification:** AI agent queries retrieve PostgreSQL factual records first before synthesizing responses through local Ollama or deterministic fallbacks.
- **Fail-Safe Degradation:** If external dependencies (Ollama LLM or Hindsight vector service) are stopped or unreachable, the system automatically falls back to deterministic rule-based output without throwing unhandled exceptions.

## Layers

- Purpose: Responsive single-page application for intelligence visualization, queries, and monitoring
- Location: `src/`
- Contains: React components, views, context providers, CSS styling
- Depends on: `src/services/apiService.js`
- Used by: End users in modern web browsers
- Purpose: HTTP request routing, input validation, and auth header propagation
- Location: `server/routes/` and `server/controllers/`
- Contains: Express routers, request handlers, rate limiting
- Depends on: Domain services
- Used by: Client application and external webhooks
- Purpose: Core intelligence logic, pattern detection, LLM prompt generation, source scraping
- Location: `server/services/`, `server/adapters/`, `server/ingestion/`
- Contains: Business logic and orchestration workflows
- Depends on: Repositories, Ollama HTTP endpoint, Hindsight client
- Used by: Controllers and background scheduler
- Purpose: Type-safe database queries via Prisma ORM
- Location: `server/repositories/`
- Contains: Repository functions querying Prisma models
- Depends on: `@prisma/client`
- Used by: Domain services

## Data Flow

### Primary Request Path (Ingestion Pipeline)

### Intelligence Query Flow

## Key Abstractions

- Defines lifecycle: `fetch()` -> `parse()` -> `normalize()`
- Implementations: `NewsPressAdapter`, `ProductReleaseAdapter`, `PricingPageAdapter`, `CareersHiringAdapter`
- Generates SHA-256 hash from competitor, title, date, and canonical content to guarantee idempotency
- Isolates Prisma queries from business services, allowing uniform testing and mocking

## Entry Points

- Location: `server/server.js`
- Triggers: `node server/server.js` or `npm run dev:server`
- Responsibilities: Loads environment, initializes Prisma, starts Express listener, handles SIGINT/SIGTERM
- Location: `src/main.jsx`
- Triggers: Vite browser entry from `index.html`
- Responsibilities: Mounts React DOM, renders `App.jsx` with Router and Context providers

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with asynchronous non-blocking I/O
- **Global State:** In-memory deduplication set and scheduler timers; database persistence handles all application state
- **Network Boundaries:** Local Ollama bound to `http://localhost:11434`; external scraper requests strictly bound to allowlisted public hostnames via `server/adapters/ssrfValidator.js`

## Anti-Patterns

### Bypassing Ingestion Deduplication

### Client-Side Direct LLM or Secret Calls

## Error Handling

- Try/catch blocks in controllers delegating unhandled exceptions to `next(err)`.
- Graceful degradation for Ollama and Hindsight memory failures.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
