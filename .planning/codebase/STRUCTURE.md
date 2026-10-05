---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# Codebase Structure

**Analysis Date:** 2026-10-05

## Directory Layout

```
competitor-iq/
├── .planning/                  # GSD planning directory & codebase maps
│   └── codebase/               # 7 structured codebase architecture maps
├── prisma/                     # Database schema and migrations
│   └── schema.prisma           # Prisma 6 schema defining PostgreSQL models
├── public/                     # Static public assets served by Vite
├── server/                     # Backend Express 5 application
│   ├── adapters/               # Source scrapers & parsers with SSRF guard
│   ├── config/                 # Environment validation (env.js) & source configs
│   ├── controllers/            # Express request handlers & validation
│   ├── ingestion/              # Ingestion pipeline, deduplication, normalizer
│   ├── middlewares/            # Auth, rate limiting, logging, error handling
│   ├── repositories/           # Prisma data access layer
│   ├── routes/                 # Express route definitions
│   ├── scripts/                # E2E test and official source ingestion CLI scripts
│   ├── services/               # Business logic, Ollama & Hindsight services
│   ├── app.js                  # Express app setup and middleware chain
│   └── server.js               # Server bootstrapping entry point
├── src/                        # Frontend React 19 SPA
│   ├── assets/                 # Images and design assets
│   ├── components/             # Reusable UI components
│   │   ├── agent/              # AI Agent workspace, pipeline, 3D sphere
│   │   └── common/             # Buttons, inputs, modals, cards
│   ├── context/                # React context providers (AuthContext)
│   ├── layouts/                # MainLayout, Sidebar, TopNavbar
│   ├── pages/                  # Page routes (Login, Signup, AgentHeroPage)
│   ├── services/               # Frontend API service (apiService.js)
│   ├── views/                  # Feature views (Dashboard, Alerts, Patterns, etc.)
│   ├── App.css                 # Component styling
│   ├── App.jsx                 # Routing tree and layout configuration
│   ├── index.css               # Tailwind CSS imports and root styles
│   └── main.jsx                # React DOM entry point
├── tests/                      # Test suites (unit, integration, E2E)
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git ignore rules
├── .oxlintrc.json              # Oxlint rules configuration
├── package.json                # Project dependencies, scripts, metadata
├── README.md                   # System documentation and architecture guide
└── vite.config.js              # Vite bundler configuration
```

## Directory Purposes

**`server/adapters/`:**
- Purpose: Harvesters for public competitor announcements, pricing, releases, and job posts
- Contains: Scrapers, SSRF validator (`ssrfValidator.js`), HTML parser (`htmlParser.js`), HTTP fetcher (`httpFetcher.js`)
- Key files: `server/adapters/baseAdapter.js`, `server/adapters/adapterRegistry.js`

**`server/ingestion/`:**
- Purpose: Deduplication, normalization, and classification of harvested signals
- Contains: SHA-256 content deduplicator, category classifier, payload normalizer
- Key files: `server/ingestion/deduplicator.js`, `server/ingestion/normalizer.js`

**`server/services/`:**
- Purpose: Core intelligence processing, LLM integration, memory reflection, and scheduling
- Contains: Domain services and AI inference handlers
- Key files: `server/services/agentService.js`, `server/services/ollamaService.js`, `server/services/alertService.js`

**`server/repositories/`:**
- Purpose: Database abstraction layer over Prisma Client
- Contains: Database query functions with multi-tenant filtering
- Key files: `server/repositories/competitorRepository.js`, `server/repositories/competitorEventRepository.js`

**`src/views/`:**
- Purpose: Feature pages rendered inside the main application shell
- Contains: DashboardView, AlertsView, ConnectTheDotsView, StrategicPatternsView, CompetitiveComparisonView, ExecutiveReportView
- Key files: `src/views/DashboardView.jsx`, `src/views/ConnectTheDotsView.jsx`, `src/views/AlertsView.jsx`

**`src/components/agent/`:**
- Purpose: AI competitive intelligence workspace, chat history, and visualization
- Contains: AgentWorkspace, IntelligenceSphere (Three.js), ReasoningPipeline, AgentStatusPanel
- Key files: `src/components/agent/AgentWorkspace.jsx`, `src/components/agent/AgentStatusPanel.jsx`

**`tests/`:**
- Purpose: Automated test verification across all system components
- Contains: Unit tests, adapter tests, LLM tests, security auth tests, and E2E journey tests
- Key files: `tests/adapters.test.js`, `tests/agent.test.js`, `tests/ollama.test.js`, `tests/e2e-user-journeys.test.js`

## Key File Locations

**Entry Points:**
- `server/server.js`: Node.js backend listener
- `src/main.jsx`: Browser React mount point

**Configuration:**
- `server/config/env.js`: Environment variable schema and validation
- `vite.config.js`: Frontend build and dev server proxy config
- `.oxlintrc.json`: Linter configuration

**Core Logic:**
- `server/services/agentService.js`: Agent queries, evidence ground truth retrieval, response synthesis
- `server/services/ollamaService.js`: Local Ollama chat completions
- `server/ingestion/ingestionService.js`: Batch and single event ingestion workflow

**Testing:**
- `tests/*.test.js`: All automated test suites executed via `npm test`

## Naming Conventions

**Files:**
- Backend modules and services: camelCase (`agentService.js`, `competitorEventRepository.js`)
- React components and views: PascalCase (`AgentWorkspace.jsx`, `DashboardView.jsx`)
- Test files: `*.test.js` in `tests/` directory

**Directories:**
- Plural lowercase for backend modules: `adapters/`, `controllers/`, `middlewares/`, `repositories/`, `routes/`, `services/`
- Categorical lowercase for frontend: `components/`, `context/`, `layouts/`, `pages/`, `views/`

## Where to Add New Code

**New Source Adapter:**
- Implementation: `server/adapters/<name>Adapter.js` extending `BaseAdapter`
- Registration: Register in `server/adapters/adapterRegistry.js`
- Test: Add test case in `tests/adapters.test.js`

**New Intelligence Analysis Engine:**
- Service: `server/services/<engine>Service.js`
- Controller: `server/controllers/<engine>Controller.js`
- Route: `server/routes/<engine>Routes.js` and mount in `server/app.js`
- Frontend View: `src/views/<Engine>View.jsx` and add route in `src/App.jsx`

**New Database Entity:**
- Schema: Add model in `prisma/schema.prisma`
- Migration: Run `npx prisma migrate dev`
- Repository: `server/repositories/<entity>Repository.js`

**Shared Helpers & Utilities:**
- Backend utilities: `server/ingestion/` or appropriate helper folder
- Frontend utilities: `src/services/` or `src/components/common/`

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow planning, project roadmap, and codebase intelligence documentation
- Generated: Maintained by GSD commands
- Committed: Yes

**`node_modules/` & `dist/`:**
- Purpose: Third-party dependencies and compiled build outputs
- Generated: Yes
- Committed: No (gitignored)

---

*Structure analysis: 2026-10-05*
