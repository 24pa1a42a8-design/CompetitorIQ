---
last_mapped_commit: a7c21f9eed23357377036a4489cb26d1b70aa1ab
last_mapped_at: 2026-10-05
---
# Testing Patterns

**Analysis Date:** 2026-10-05

## Test Framework

**Runner:**
- Node.js built-in Test Runner (`node --test`, native to Node 22+)
- Configuration: Defined in `package.json` scripts: `"test": "node --test --test-concurrency=1 tests/*.test.js"`

**Assertion Library:**
- Node.js strict assertion library (`node:assert/strict`)

**Run Commands:**

```bash
npm test                                  # Run all test suites sequentially
node --test tests/adapters.test.js        # Run a specific test suite
node --test tests/ollama.test.js          # Run Ollama LLM integration tests
npm run lint                              # Run Oxlint validation across codebase
```

## Test File Organization

**Location:**
- Dedicated `tests/` root directory containing all test suites
- Test files segregated by domain/service (`adapters.test.js`, `alerts.test.js`, `securityAuth.test.js`)

**Naming:**
- `tests/<feature>.test.js` or `tests/<featureAndScope>.test.js`

**Structure:**

```
tests/
├── adapters.test.js                     # SSRF guard, HTML parser, source adapters
├── agent.test.js                        # Agent query execution & evidence grounding
├── agentPerformanceAndLifecycle.test.js # Latency & lifecycle regression tests
├── alerts.test.js                       # Threat rule evaluation & alert repository
├── competitiveComparison.test.js        # Multi-competitor comparison matrix
├── connectDots.test.js                  # Multi-node pattern correlation
├── database.test.js                     # Prisma connection & model queries
├── e2e-user-journeys.test.js            # User authentication & navigation flows
├── e2e.test.js                          # Full signal-to-report pipeline
├── executiveReport.test.js              # Executive strategy report synthesis
├── hindsight.test.js                    # Vector memory fallback handling
├── ingestion.test.js                    # Ingestion normalization & SHA-256 dedup
├── monitoringScheduler.test.js          # Polling scheduler & concurrency lock
├── ollama.test.js                       # Local Ollama reachability & fallback
├── securityAuth.test.js                 # JWT & multi-tenant isolation tests
└── strategicAnalysis.test.js            # 5-part strategic inference engine
```

## Test Structure

**Suite Organization:**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateUrl } from '../server/adapters/ssrfValidator.js';

describe('SSRF Validator Security Tests', () => {
  it('should allow valid public HTTPS domain', () => {
    const result = validateUrl('https://oracle.com/news');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, null);
  });

  it('should reject private internal IPv4 loopback', () => {
    const result = validateUrl('http://127.0.0.1:8080');
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /private or loopback/i);
  });
});
```

**Patterns:**
- `before()` / `after()` hooks used for setting up test organization fixtures in PostgreSQL and closing Prisma connections.
- Clean isolation using unique `organizationId` strings per test run (`test-org-${Date.now()}`).

## Mocking

**Framework:**
- Native Node.js function overriding / dependency injection options

**Patterns:**

```javascript
// Example mocking Ollama endpoint or external network call
const originalFetch = globalThis.fetch;
before(() => {
  globalThis.fetch = async (url) => {
    if (url.includes('/api/chat')) {
      return {
        ok: true,
        json: async () => ({
          message: { content: 'Mocked strategic insight response' }
        })
      };
    }
    return originalFetch(url);
  };
});

after(() => {
  globalThis.fetch = originalFetch;
});
```

**What to Mock:**
- Outbound network requests to external competitor websites during adapter tests (use HTML fixtures)
- Remote Hindsight Cloud API responses when testing offline degraded mode
- Long-running timer intervals in `monitoringScheduler.test.js`

**What NOT to Mock:**
- Local PostgreSQL ground truth queries where possible (ensures Prisma schema integrity)
- Content deduplication hashing algorithms (`server/ingestion/deduplicator.js`)
- SSRF IP validation and regex parsers

## Coverage

**Requirements:**
- High test coverage on safety boundaries: SSRF validator, auth middleware, and deduplication logic
- Graceful degradation tests required for all external AI integrations (Ollama, Hindsight)

**View Coverage:**

```bash
node --test --experimental-test-coverage tests/*.test.js
```

## Test Types

**Unit Tests:**
- Test individual functions in isolation: `htmlParser.js`, `ssrfValidator.js`, `deduplicator.js`, `normalizer.js`.

**Integration Tests:**
- Test service interaction with PostgreSQL database and repository layers (`alerts.test.js`, `ingestion.test.js`).

**E2E Tests:**
- Test full lifecycle from source ingestion, alert evaluation, pattern discovery, to executive report generation (`tests/e2e.test.js`, `tests/e2e-user-journeys.test.js`).

## Common Patterns

**Async Testing:**

```javascript
it('should execute agent query asynchronously within timeout', async () => {
  const result = await agentService.executeQuery('What are Oracle pricing updates?', {
    organizationId: 'test-org-1'
  });
  assert.ok(result.answer);
  assert.ok(Array.isArray(result.citations));
});
```

**Error Testing:**

```javascript
it('should reject unauthorized request without tenant organization ID', async () => {
  await assert.rejects(
    async () => {
      await competitorEventRepository.findEventsByOrg(null);
    },
    { message: /organizationId is required/ }
  );
});
```

---

*Testing analysis: 2026-10-05*
