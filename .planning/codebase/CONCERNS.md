---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# Codebase Concerns

**Analysis Date:** 2026-10-05

## Tech Debt

**Client-Side Agent Legacy Deletions:**
- Issue: Previous iterations had agent reasoning and memory orchestration on the frontend (`src/agent/*`, `src/services/hindsightMemoryService.js`). These have been migrated to the server (`server/services/agentService.js`), but uncommitted deleted file references exist in git working directory.
- Files: `src/agent/agentOrchestrator.js`, `src/agent/changeDetector.js`, `src/agent/comparator.js`, `src/services/hindsightMemoryService.js`
- Impact: Uncommitted git state; potential dangling imports in legacy components if not fully cleaned up.
- Fix approach: Stage and commit the architectural consolidation of server-side agent logic.

**Linter Warnings (Oxlint):**
- Issue: 180 Oxlint warnings across test files and React components, primarily unused variables (`no-unused-vars`), catch variables, and React compiler optimization notices.
- Files: `tests/agentPerformanceAndLifecycle.test.js`, `src/context/AuthContext.jsx`, `src/pages/Login.jsx`
- Impact: Minor noise during lint runs; React compiler skips optimization on `Login.jsx` due to `setState` in effect.
- Fix approach: Prefix unused variables with `_`, remove constant binary expression in test, and initialize state directly from `localStorage` in `Login.jsx`.

## Known Bugs

**Synchronous State Setting in Effects:**
- Symptoms: React Compiler skips optimization on `src/pages/Login.jsx` with warning `react(set-state-in-effect)`.
- Files: `src/pages/Login.jsx:27`
- Trigger: Component mounting with saved email in `localStorage`.
- Workaround: Use lazy state initializer `useState(() => localStorage.getItem('competitor_iq_remember') || '')`.

## Security Considerations

**SSRF Protection on Public Scrapers:**
- Risk: Scraper adapters fetching user-defined or unverified competitor URLs could be coerced into querying internal metadata services (`169.254.169.254`) or loopback APIs (`127.0.0.1`).
- Files: `server/adapters/ssrfValidator.js`, `server/adapters/httpFetcher.js`
- Current mitigation: Robust IP blocklist and protocol allowlist in `ssrfValidator.js` rejecting private, loopback, and cloud metadata subnets.
- Recommendations: Maintain DNS re-resolution check before socket connection to prevent DNS rebinding attacks.

**Multi-Tenant Organization Isolation:**
- Risk: Data leakage across competing intelligence organizations if tenant query scope is omitted.
- Files: `server/middlewares/authMiddleware.js`, `server/repositories/`
- Current mitigation: Repositories enforce `organizationId` filter on all queries.
- Recommendations: Add automated regression tests validating cross-organization access rejection for every repository method.

## Performance Bottlenecks

**Sequential Test Execution:**
- Problem: Tests run with `--test-concurrency=1`, resulting in multi-second runs for database and network suites.
- Files: `package.json:10`, `tests/`
- Cause: Shared PostgreSQL database tables require sequential test execution to avoid fixture collisions.
- Improvement path: Leverage isolated tenant organizations (`orgId: test-${uuid()}`) per test suite to enable concurrent test runs.

**Public HTML Scraping Latency:**
- Problem: Scraping external competitor websites is dependent on third-party network latency and HTTP timeouts.
- Files: `server/adapters/httpFetcher.js`
- Cause: Dynamic network conditions, bot protection, and rate limits.
- Improvement path: Enforce aggressive timeouts (e.g. 5000ms), concurrency limits, and exponential backoff retry queues.

## Fragile Areas

**External AI Service Reachability (Ollama & Hindsight):**
- Files: `server/services/ollamaService.js`, `server/services/agentService.js`
- Why fragile: Ollama runs as a separate local OS daemon; Hindsight relies on cloud credits. If either is stopped or depleted, queries could fail if fallback paths break.
- Safe modification: Ensure all service calls wrap external API requests in try/catch and rigorously exercise deterministic fallback pathways.
- Test coverage: Covered in `tests/ollama.test.js` and `tests/hindsight.test.js`.

**Three.js Canvas in React:**
- Files: `src/components/agent/IntelligenceSphere.jsx`
- Why fragile: WebGL context loss can occur if browser tab is suspended or GPU memory spikes.
- Safe modification: Ensure component cleans up animation loops and geometries on unmount.

## Scaling Limits

**PostgreSQL Event Storage:**
- Current capacity: Efficient up to hundreds of thousands of events with current index structure on `CompetitorEvent` (`[organizationId, eventDate]`, `[competitorId]`).
- Limit: Complex multi-node pattern queries in `connectDotsService.js` perform in-memory graph joins.
- Scaling path: Introduce database-level graph queries or materialized views for high-volume pattern discovery.

## Dependencies at Risk

**Ollama Local Daemon Dependency:**
- Risk: Developer machines without Ollama installed or without `qwen2.5:3b` model downloaded cannot run local LLM generation.
- Impact: System falls back to deterministic synthesis, which is functional but lacks freeform conversational flexibility.
- Migration plan: Document setup commands (`ollama pull qwen2.5:3b`) clearly in README and health checks.

## Missing Critical Features

**Automated Headless Browser Rendering for JS-Heavy Pages:**
- Problem: Public source scrapers use `fetch` and cheerio-style HTML regex/parsing; pages rendered entirely via client-side SPAs (e.g. heavy React/Vue career pages) may yield minimal text.
- Blocks: Rich signal extraction from client-rendered JavaScript competitor websites.
- Solution: Add optional Puppeteer / Playwright microservice adapter for JS-rendered targets.

## Test Coverage Gaps

**Frontend Component Unit Tests:**
- What's not tested: React components in `src/views/` and `src/components/` do not have dedicated Jest/Vitest unit test suites (testing is currently backend/integration focused in `tests/`).
- Files: `src/views/*.jsx`, `src/components/**/*.jsx`
- Risk: Regressions in UI interactions or state transitions may only be caught via manual testing.
- Priority: Medium

---

*Concerns audit: 2026-10-05*
