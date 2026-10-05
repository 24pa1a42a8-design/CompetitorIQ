---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# External Integrations

**Analysis Date:** 2026-10-05

## APIs & External Services

**Local LLM (Ollama):**
- Purpose: Grounded AI reasoning, strategic query response synthesis, multi-event evidence summarization (`server/services/ollamaService.js`)
- Endpoint: Configured via `OLLAMA_BASE_URL` (default `http://localhost:11434/api/chat`)
- Model: `qwen2.5:3b`
- Auth: None (local loopback daemon)
- Fallback: Graceful fallback to deterministic rule-based synthesis if Ollama is unreachable or model missing

**Hindsight Cloud Vector Memory:**
- Purpose: Long-term competitive memory retention, semantic recall, and strategic trajectory reflection (`server/services/agentService.js`, `server/routes/hindsightRoutes.js`)
- SDK/Client: `@vectorize-io/hindsight-client`
- Connection: `HINDSIGHT_API_URL` (default `https://api.hindsight.vectorize.io`)
- Auth: `HINDSIGHT_API_KEY` env var
- Bank: `HINDSIGHT_BANK_ID` (default `competitorIQ`)
- Fallback: Automatic degradation status reporting (`DEGRADED`) when API key is missing or credits are exhausted, continuing on PostgreSQL ground truth

**Public Source Intelligence Harvesters:**
- Purpose: Automated scraping and parsing of public competitor press releases, product updates, pricing tables, and career portals (`server/adapters/`)
- Protocols: HTTPS client with SSRF domain allowlisting (`server/adapters/ssrfValidator.js`) and payload extraction (`server/adapters/htmlParser.js`)

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` environment variable
  - Client / ORM: Prisma Client (`@prisma/client`) with schema defined at `prisma/schema.prisma`
  - Core entities: `Organization`, `User`, `Competitor`, `Source`, `CompetitorEvent`, `EventEvidence`, `PricingSignal`, `ProductSignal`, `MessagingSignal`, `HiringSignal`, `FundingSignal`, `Alert`, `Analysis`, `AgentConversation`, `MemoryOperation`, `AuditLog`

**File Storage:**
- Local filesystem only (`dist/`, `public/`, `src/assets/`)
- No external object storage (S3/GCS) currently required

**Caching:**
- In-memory event deduplication cache (`server/ingestion/deduplicator.js`) based on SHA-256 hashes and title/source lookups
- Prisma database connection pooling

## Authentication & Identity

**Auth Provider:**
- Custom JWT / Organization Context Header middleware (`server/middlewares/authMiddleware.js`)
- Multi-tenant tenant isolation via `x-organization-id` header and database foreign keys
- User authentication and role-based checks (`UserRole`: `ADMIN`, `ANALYST`, `VIEWER`)

## Monitoring & Observability

**Error Tracking:**
- Structured error response handling middleware (`server/middlewares/errorHandler.js`)
- Centralized Pino HTTP logger capturing request IDs, status codes, and latencies (`server/middlewares/loggerMiddleware.js`)

**Logs:**
- Pino JSON logging to stdout in production, pretty-formatted in development
- Audit logging entity in database (`AuditLog` model in `prisma/schema.prisma`)

**Health & Readiness Checks:**
- `GET /api/health` - Basic server liveness check (`server/routes/healthRoutes.js`)
- `GET /api/health/ready` - Readiness check evaluating PostgreSQL, Hindsight, and Ollama connections
- `GET /api/health/ollama` - Dedicated status check for local Ollama reachability and `qwen2.5:3b` model readiness

## CI/CD & Deployment

**Hosting:**
- Containerized or standard Node.js server environment
- Frontend builds to static assets via `npm run build` (`dist/`)

**CI Pipeline:**
- Test execution: `npm test` (`node --test tests/*.test.js`)
- Linter: `npm run lint` (`oxlint`)

## Environment Configuration

**Required env vars:**
- `PORT` - Port number (default 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `OLLAMA_BASE_URL` - Ollama HTTP endpoint
- `OLLAMA_MODEL` - Target LLM model name
- `FRONTEND_URL` - Frontend origin for CORS

**Optional / Fallback env vars:**
- `HINDSIGHT_API_KEY` - Hindsight Cloud API key
- `HINDSIGHT_API_URL` - Hindsight endpoint
- `HINDSIGHT_BANK_ID` - Hindsight bank identifier
- `MONITORING_ENABLED` - Toggle background scheduler (`true`/`false`)

**Secrets location:**
- `.env` file in project root (gitignored via `.gitignore`)
- Template defined in `.env.example`

## Webhooks & Callbacks

**Incoming:**
- Ingestion endpoint: `POST /api/ingestion/events` (`server/routes/ingestionRoutes.js`)
- Batch ingestion: `POST /api/ingestion/batch`
- Source manual trigger: `POST /api/monitoring/run/:sourceId` (`server/routes/monitoringRoutes.js`)

**Outgoing:**
- External webhook dispatchers: Not configured (internal alert bus dispatches to `Alert` repository)

---

*Integration audit: 2026-10-05*
