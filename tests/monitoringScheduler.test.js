import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { monitoringScheduler } from '../server/services/monitoringScheduler.js';
import { monitoringController } from '../server/controllers/monitoringController.js';

describe('Continuous Competitor Monitoring Scheduler Unit & Integration Tests', () => {

  before(() => {
    monitoringScheduler.stop();
  });

  afterEach(() => {
    monitoringScheduler.stop();
  });

  describe('1. Scheduler Initialization & Configuration', () => {
    it('initializes scheduler with configured competitor sources from sourcesConfig', () => {
      const status = monitoringScheduler.getStatus();

      assert.ok(status.sourcesConfigured >= 4);
      assert.ok(status.sourcesEnabled >= 4);
      assert.strictEqual(status.activeLocksCount, 0);

      const oracleSrc = status.sources.find(s => s.sourceId === 'oracle_press');
      assert.ok(oracleSrc);
      assert.strictEqual(oracleSrc.competitorName, 'Oracle');
      assert.strictEqual(oracleSrc.enabled, true);
    });

    it('can toggle scheduler enabled/disabled state dynamically', () => {
      monitoringScheduler.toggle(false);
      assert.strictEqual(monitoringScheduler.enabled, false);

      monitoringScheduler.toggle(true);
      assert.strictEqual(monitoringScheduler.enabled, true);
      monitoringScheduler.stop();
    });
  });

  describe('2. Single & Multi-Source Execution (Mocked Telemetry)', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Oracle Announces Next-Gen Database Feature</h1>
          <p>Oracle released autonomous DB capabilities for enterprise customers on September 28, 2026.</p>
        </body>
      </html>
    `;

    it('processes single source check with mock content without internet requests', async () => {
      const oracleState = monitoringScheduler.sources.get('oracle_press');
      assert.ok(oracleState);

      const res = await monitoringScheduler.processSingleSource(oracleState, {
        organizationId: 'test-sched-org',
        mockContent: mockHtml
      });

      assert.strictEqual(res.success, true);
      assert.ok(oracleState.lastCheckedAt);
      assert.ok(oracleState.lastSuccessfulCheckAt);
      assert.strictEqual(oracleState.failureCount, 0);
    });

    it('detects duplicate unchanged content and skips duplicate event creation', async () => {
      const oracleState = monitoringScheduler.sources.get('oracle_press');
      assert.ok(oracleState);

      // Run 1: Ingests mock content
      const run1 = await monitoringScheduler.processSingleSource(oracleState, {
        organizationId: 'test-sched-org-dup',
        mockContent: mockHtml
      });
      assert.strictEqual(run1.success, true);

      // Run 2: Re-checks identical mock content
      const run2 = await monitoringScheduler.processSingleSource(oracleState, {
        organizationId: 'test-sched-org-dup',
        mockContent: mockHtml
      });
      assert.strictEqual(run2.success, true);

      const status = monitoringScheduler.getStatus();
      assert.ok(status.metrics.duplicatesIgnored >= 1);
    });

    it('isolates source failures safely so 1 failing source does not stop other checks', async () => {
      const badState = {
        sourceId: 'bad_test_source',
        competitorName: 'FailingCorp',
        adapterType: 'news_press',
        url: 'http://127.0.0.1:1/invalid', // Instant local connection refused without DNS lookup/delay
        enabled: true,
        pollingIntervalMs: 3600000,
        lastCheckedAt: null,
        nextScheduledCheckAt: null,
        lastSuccessfulCheckAt: null,
        lastFailureAt: null,
        failureCount: 0,
        lastError: null
      };

      monitoringScheduler.sources.set('bad_test_source', badState);

      const res = await monitoringScheduler.processSingleSource(badState, {
        organizationId: 'test-sched-org',
        allowedDomains: ['oracle.com'] // Will be blocked locally by SSRF/Domain validator immediately
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(badState.failureCount, 1);
      assert.ok(badState.lastFailureAt);
      assert.ok(badState.lastError);

      // Clean up test source
      monitoringScheduler.sources.delete('bad_test_source');
    });

    it('prevents concurrent execution when lock is active', async () => {
      const oracleState = monitoringScheduler.sources.get('oracle_press');
      monitoringScheduler.activeSourceLocks.add(oracleState.sourceId);

      const res = await monitoringScheduler.processSingleSource(oracleState, {
        organizationId: 'test-sched-org',
        mockContent: mockHtml
      });

      assert.strictEqual(res.skipped, true);
      assert.strictEqual(res.reason, 'Source check currently running');

      monitoringScheduler.activeSourceLocks.delete(oracleState.sourceId);
    });

    it('executes manual runAllNow safely with mock content options', async () => {
      const runResult = await monitoringScheduler.runAllNow({
        organizationId: 'test-sched-run-all',
        mockContent: mockHtml
      });

      assert.strictEqual(runResult.success, true);
      assert.ok(runResult.totalExecuted >= 4);
    });
  });

  describe('3. Controller & API Validation', () => {
    it('returns full monitoring status via GET /api/monitoring/status', async () => {
      let jsonBody = null;
      const req = {};
      const res = {
        json(j) { jsonBody = j; return this; }
      };

      await monitoringController.getStatus(req, res);
      assert.strictEqual(jsonBody.success, true);
      assert.ok(jsonBody.data.sourcesConfigured >= 4);
    });

    it('validates single source execution via POST /api/monitoring/run/:sourceId', async () => {
      let jsonBody = null;
      const req = {
        params: { sourceId: 'non_existent_source_xyz' },
        headers: { 'x-organization-id': 'test-org' }
      };
      const res = {
        status(s) { this.statusCode = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await monitoringController.runSingle(req, res);
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(jsonBody.error.code, 'SOURCE_NOT_FOUND');
    });

    it('validates toggle monitoring payload via Zod schema', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        body: {} // missing required boolean field 'enabled'
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await monitoringController.toggle(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });
  });
});
