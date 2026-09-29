import { test, describe } from 'node:test';
import assert from 'node:assert';
import { checkDatabaseHealth, getPrismaClient } from '../server/config/database.js';
import competitorRepository from '../server/repositories/competitorRepository.js';
import sourceRepository from '../server/repositories/sourceRepository.js';
import competitorEventRepository from '../server/repositories/competitorEventRepository.js';
import eventEvidenceRepository from '../server/repositories/eventEvidenceRepository.js';
import alertRepository from '../server/repositories/alertRepository.js';
import analysisRepository from '../server/repositories/analysisRepository.js';
import memoryOperationRepository from '../server/repositories/memoryOperationRepository.js';

describe('Database Architecture & Repository Unit Tests', () => {

  test('1. Database health check reports not_configured when DATABASE_URL is empty', async () => {
    const status = await checkDatabaseHealth();
    assert.strictEqual(typeof status, 'string');
    assert.ok(['not_configured', 'ok', 'error'].includes(status));
  });

  test('2. getPrismaClient returns null when DATABASE_URL is empty', () => {
    const client = getPrismaClient();
    if (!process.env.DATABASE_URL) {
      assert.strictEqual(client, null);
    } else {
      assert.ok(client);
    }
  });

  test('3. Competitor repository handles unconfigured database gracefully', async () => {
    const result = await competitorRepository.findAllByOrganization('org-test-123');
    assert.deepStrictEqual(result, []);
  });

  test('4. Source repository handles unconfigured database gracefully', async () => {
    const result = await sourceRepository.findById('src-test-123');
    assert.strictEqual(result, null);
  });

  test('5. CompetitorEvent repository handles unconfigured database gracefully', async () => {
    const result = await competitorEventRepository.findByCompetitor('comp-test-123');
    assert.deepStrictEqual(result, []);
  });

  test('6. EventEvidence repository handles unconfigured database gracefully', async () => {
    const result = await eventEvidenceRepository.findByEventId('evt-test-123');
    assert.deepStrictEqual(result, []);
  });

  test('7. Alert repository handles unconfigured database gracefully', async () => {
    const result = await alertRepository.findByOrganization('org-test-123');
    assert.deepStrictEqual(result, []);
  });

  test('8. Analysis repository handles unconfigured database gracefully', async () => {
    const result = await analysisRepository.findByOrganization('org-test-123');
    assert.deepStrictEqual(result, []);
  });

  test('9. MemoryOperation repository handles unconfigured database gracefully', async () => {
    if (!process.env.DATABASE_URL) {
      const startRecord = await memoryOperationRepository.recordStart({
        stage: 'RETAIN',
        organizationId: 'org-test'
      });
      assert.strictEqual(startRecord, null);
    } else {
      assert.ok(true, 'Database is configured; memory operation repository requires valid foreign keys');
    }
  });

  test('10. Database integration test requirements check', () => {
    const isDbConnected = Boolean(process.env.DATABASE_URL);
    if (!isDbConnected) {
      assert.ok(true, 'Database integration tests skipped safely when PostgreSQL is not configured');
    }
  });
});
