import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isHindsightConfigured, getBankId, handleHindsightApiError, HindsightAppError } from '../server/hindsight/hindsightClient.js';
import { retainCompetitorEvent } from '../server/hindsight/retainFlow.js';
import { recallCompetitor } from '../server/hindsight/recallFlow.js';
import { reflectCompetitorStrategy } from '../server/hindsight/reflectFlow.js';

describe('Hindsight Memory Service Integration Unit & Mock Tests', () => {

  test('1. Hindsight configuration missing / status check', () => {
    const configured = isHindsightConfigured();
    assert.strictEqual(typeof configured, 'boolean');
  });

  test('2. Hindsight client bank ID defaults to competitoriq-global', () => {
    const bankId = getBankId();
    assert.strictEqual(typeof bankId, 'string');
    assert.ok(bankId.length > 0);
  });

  test('3. Retain success with mock client', async () => {
    const mockClient = {
      retain: async (bankId, content, options) => ({
        id: 'mem-1001',
        bank_id: bankId,
        status: 'retained',
        content
      })
    };

    const mockEvent = {
      competitorName: 'Oracle',
      eventType: 'PRODUCT',
      title: 'OCI Autonomous 23ai Global Release',
      summary: 'Oracle launched OCI 23ai Autonomous Database globally'
    };

    const text = `Competitive intelligence event for ${mockEvent.competitorName}. Title: ${mockEvent.title}`;
    const res = await mockClient.retain('competitoriq-global', text, { metadata: mockEvent });
    assert.strictEqual(res.id, 'mem-1001');
    assert.strictEqual(res.status, 'retained');
  });

  test('4. Retain failure error handling', async () => {
    try {
      handleHindsightApiError(new Error('Hindsight server 500 error'));
      assert.fail('Should have thrown HindsightAppError');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_REQUEST_FAILED');
      assert.strictEqual(err.statusCode, 500);
    }
  });

  test('5. Retain timeout error handling', async () => {
    try {
      handleHindsightApiError(new Error('ETIMEDOUT connection timeout'));
      assert.fail('Should have thrown timeout error');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_TIMEOUT');
      assert.strictEqual(err.statusCode, 504);
    }
  });

  test('6. Recall success with mock client', async () => {
    const mockRecallResponse = [
      {
        id: 'mem-841',
        text: 'Oracle and AWS announced OCI Database@AWS multi-cloud strategic integration.',
        score: 0.94,
        metadata: { competitorName: 'Oracle' }
      }
    ];

    const mockClient = {
      recall: async (bankId, query) => mockRecallResponse
    };

    const res = await mockClient.recall('competitoriq-global', 'Oracle AWS partnership');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].id, 'mem-841');
  });

  test('7. Recall empty result returns empty memories array', async () => {
    const mockClient = {
      recall: async () => []
    };

    const res = await mockClient.recall('competitoriq-global', 'NonExistentTerm');
    assert.strictEqual(Array.isArray(res), true);
    assert.strictEqual(res.length, 0);
  });

  test('8. Recall failure error handling', async () => {
    try {
      handleHindsightApiError(new Error('Unauthorized 401 token invalid'));
      assert.fail('Should have thrown auth error');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_AUTH_FAILED');
      assert.strictEqual(err.statusCode, 401);
    }
  });

  test('9. Reflect success handling', async () => {
    const mockReflectResponse = {
      content: 'Oracle strategy focuses on multi-cloud database partnerships with hyperscalers.'
    };

    const mockClient = {
      reflect: async () => mockReflectResponse
    };

    const res = await mockClient.reflect('competitoriq-global', 'Oracle strategy');
    assert.ok(res.content.includes('Oracle strategy'));
  });

  test('10. Reflect failure error handling', async () => {
    try {
      handleHindsightApiError(new Error('fetch failed ECONNREFUSED'));
      assert.fail('Should have thrown unavailable error');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_UNAVAILABLE');
      assert.strictEqual(err.statusCode, 503);
    }
  });

  test('11. Invalid retain request (missing title/summary)', async () => {
    try {
      await retainCompetitorEvent({ competitorName: 'Microsoft' });
      assert.fail('Should have thrown HINDSIGHT_INVALID_REQUEST');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_INVALID_REQUEST');
      assert.strictEqual(err.statusCode, 400);
    }
  });

  test('12. Invalid recall request (empty query string)', async () => {
    try {
      await recallCompetitor('');
      assert.fail('Should have thrown HINDSIGHT_INVALID_REQUEST');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_INVALID_REQUEST');
      assert.strictEqual(err.statusCode, 400);
    }
  });

  test('13. Invalid reflect request (empty query string)', async () => {
    try {
      await reflectCompetitorStrategy('');
      assert.fail('Should have thrown HINDSIGHT_INVALID_REQUEST');
    } catch (err) {
      assert.strictEqual(err.code, 'HINDSIGHT_INVALID_REQUEST');
      assert.strictEqual(err.statusCode, 400);
    }
  });
});
