---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# Coding Conventions

**Analysis Date:** 2026-10-05

## Naming Patterns

**Files:**
- React components and views: PascalCase with `.jsx` extension (`AgentWorkspace.jsx`, `AlertsView.jsx`, `Input.jsx`)
- Backend services, controllers, routes, repositories: camelCase with `.js` extension (`agentService.js`, `alertController.js`, `competitorEventRepository.js`)
- Test files: kebab-case or camelCase ending in `.test.js` (`adapters.test.js`, `agentPerformanceAndLifecycle.test.js`)

**Functions:**
- camelCase for standard functions, asynchronous operations, and React hooks (`executeQuery`, `isDuplicate`, `useAuth`, `formatCurrency`)
- PascalCase for React functional components (`AgentWorkspace`, `TopNavbar`)

**Variables:**
- camelCase for local variables, object properties, and state hooks (`events`, `selectedCompetitor`, `isLoading`)
- UPPER_SNAKE_CASE for module constants, fixed configuration dictionaries, and enums (`DEFAULT_LIMIT`, `SOURCE_TYPES`, `SEVERITY_LEVELS`)

**Types & Schemas:**
- PascalCase for Prisma models and Zod schemas (`Organization`, `CompetitorEvent`, `envSchema`)

## Code Style

**Formatting:**
- Standard 2-space indentation
- Semicolons used consistently
- ES Modules (`import` / `export`) throughout entire codebase (configured via `"type": "module"` in `package.json`)

**Linting:**
- Linter: Oxlint (`oxlint` `^1.81.0`)
- Config: `.oxlintrc.json`
- Run command: `npm run lint`
- Unused variables: Variables intentionally ignored should be prefixed with an underscore (`_`)

## Import Organization

**Order:**
1. Built-in Node.js modules (`node:assert/strict`, `node:crypto`, `node:path`)
2. External packages (`express`, `react`, `@prisma/client`, `zod`, `pino`)
3. Internal configurations and utilities (`../config/env.js`, `../middlewares/loggerMiddleware.js`)
4. Internal domain services and repositories (`../services/agentService.js`, `../repositories/alertRepository.js`)
5. Component imports and styles in frontend (`./components/Sidebar.jsx`, `./App.css`)

**Path Aliases:**
- Standard relative imports (`./` and `../`) are used across both backend and frontend

## Error Handling

**API Response Envelope:**
All REST endpoints standardize on the envelope format:

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}

// Error Response
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable explanation of error"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

**Patterns:**
- Express async routes wrap business operations in try/catch or propagate errors to `next(err)`.
- Backend utilizes `server/middlewares/errorHandler.js` to catch unhandled errors and format standardized 500 responses without leaking internal stack traces.
- External dependencies (Ollama LLM, Hindsight memory) catch connection failures and gracefully fallback to deterministic synthesis.

## Logging

**Framework:** Pino (`pino` and `pino-http`) via `server/middlewares/loggerMiddleware.js`

**Patterns:**
- Always pass context object as first argument, followed by message:
  ```javascript
  logger.info({ organizationId, eventCount: events.length }, 'Processed competitive events batch');
  logger.warn({ competitor, error: err.message }, 'Failed to fetch public source; applying backoff');
  ```
- Avoid unformatted `console.log` in production backend code.

## Comments

**When to Comment:**
- Explain complex regex or heuristics in adapters (`server/adapters/htmlParser.js`)
- Document domain-specific multi-tenant isolation rules (`server/middlewares/authMiddleware.js`)
- Clarify graceful degradation workflows for offline LLM or memory exhaustion

**JSDoc:**
- Used on public service methods to document parameter shapes, return types, and exceptions.

## Function Design

**Size:**
- Single responsibility: Handlers in controllers parse input and delegate immediately to domain services.
- Data fetching logic isolated in repositories.

**Parameters:**
- Options objects preferred for methods with more than 2 parameters:
  ```javascript
  async function executeQuery(query, { organizationId, competitorId, limit } = {}) { ... }
  ```

**Return Values:**
- Services return plain JavaScript objects or arrays, never raw Express response objects.

## Module Design

**Exports:**
- Named exports preferred for domain utilities, repositories, and helper functions (`export function deduplicateEvents(...)`)
- Default exports used for Express applications, routers, and React components (`export default app`, `export default DashboardView`)

---

*Convention analysis: 2026-10-05*
