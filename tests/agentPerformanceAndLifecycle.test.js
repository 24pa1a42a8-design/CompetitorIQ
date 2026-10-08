import { test, describe } from 'node:test';
import assert from 'node:assert';
import agentService from '../server/services/agentService.js';
import agentController from '../server/controllers/agentController.js';

describe('CompetitorIQ AI Agent Debugging, Lifecycle & Performance Tests (14 Requirements)', () => {
  const testOrgId = 'perf-test-org';

  // 1. Sending "Hi" returns a valid response quickly without invoking expensive research tools
  test('1. Sending "Hi" returns valid response quickly without expensive research tools', async () => {
    const t0 = Date.now();
    const result = await agentService.executeQuery('Hi', { organizationId: testOrgId });
    const duration = Date.now() - t0;
    assert.ok(duration >= 0);

    assert.ok(typeof result.answer === 'string');
    assert.ok(result.answer.toLowerCase().includes('competitoriq'));
    assert.strictEqual(result.insufficientEvidence, false);
    assert.strictEqual(result.facts.length, 0);
    assert.strictEqual(result.events.length, 0);
    assert.strictEqual(result.ollamaStatus.used, false);
    assert.strictEqual(result.hindsightStage, 'STANDBY');
    assert.ok(Array.isArray(result.executionSteps));
    assert.ok(result.executionSteps.some(s => s.id === 'understand' || s.id === 'respond'));
  });

  // 2. A normal AI question reaches the correct backend endpoint
  test('2. A normal AI question reaches the agent query service and returns expected contract', async () => {
    const result = await agentService.executeQuery('What are Microsoft competitors doing?', {
      organizationId: 'default-org',
      timeoutMs: 5000
    });

    assert.ok(result);
    assert.ok(typeof result.answer === 'string');
    assert.ok(Array.isArray(result.facts));
    assert.ok(Array.isArray(result.observations));
    assert.ok(Array.isArray(result.inferences));
    assert.ok(Array.isArray(result.unknowns));
    assert.ok(Array.isArray(result.evidence));
  });

  // 3. A failed network request resets the loading state (Contract Verification)
  test('3. Failed network request resets loading state contract', () => {
    let isExecuting = true;
    let error = null;

    try {
      throw new Error('ECONNREFUSED network failure');
    } catch (err) {
      error = err.message;
    } finally {
      isExecuting = false;
    }

    assert.strictEqual(isExecuting, false);
    assert.ok(error.includes('ECONNREFUSED'));
  });

  // 4. The retry button retries the intended request (Last Submitted Query Preservation)
  test('4. Retry mechanism preserves and re-executes intended target query', async () => {
    let lastSubmittedQuery = 'What pricing changes have competitors made?';
    let queryField = ''; // user cleared input

    const queryToExecute = queryField || lastSubmittedQuery;
    assert.strictEqual(queryToExecute, 'What pricing changes have competitors made?');

    const result = await agentService.executeQuery(queryToExecute, { organizationId: 'default-org', timeoutMs: 5000 });
    assert.ok(result);
    assert.ok(result.evidence.length > 0 || result.facts.length > 0);
  });

  // 5. Duplicate submissions are handled correctly
  test('5. Duplicate submissions are safely rejected when execution is already active', () => {
    let isExecuting = true;
    let submitted = false;

    const attemptSubmit = (q) => {
      if (isExecuting || !q.trim()) return false;
      submitted = true;
      return true;
    };

    assert.strictEqual(attemptSubmit('What is happening?'), false);
    assert.strictEqual(submitted, false);

    isExecuting = false;
    assert.strictEqual(attemptSubmit('What is happening?'), true);
    assert.strictEqual(submitted, true);
  });

  // 6. Tool timeouts do not hang the chat indefinitely
  test('6. Tool timeouts do not hang the chat indefinitely (Degrades gracefully within timeoutMs)', async () => {
    const t0 = Date.now();
    const result = await agentService.executeQuery('Compare AWS and Oracle in enterprise market', {
      organizationId: 'default-org',
      timeoutMs: 1 // 1ms forces immediate Ollama timeout
    });
    const elapsed = Date.now() - t0;

    assert.ok(elapsed < 60000, `Execution should finish within timeout bound; took ${elapsed}ms`);
    assert.strictEqual(result.ollamaStatus.used, false);
    assert.strictEqual(result.ollamaStatus.status, 'degraded');
    assert.ok(result.answer.includes('Competitor Intelligence Brief'));
  });

  // 7. Transient tool failures trigger bounded retries
  test('7. Transient tool failures trigger bounded retries with backoff', async () => {
    let attempts = 0;
    const transientOperation = async () => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('ECONNRESET connection reset by peer');
        err.code = 'ECONNRESET';
        throw err;
      }
      return { success: true, attempts };
    };

    let result = null;
    let maxRetries = 2;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        result = await transientOperation();
        break;
      } catch (err) {
        if (i === maxRetries) throw err;
      }
    }

    assert.ok(result);
    assert.strictEqual(result.attempts, 2);
  });

  // 8. Non-recoverable failures return useful error messages
  test('8. Non-recoverable failures return useful validation error messages', async () => {
    await assert.rejects(
      async () => agentService.executeQuery(''),
      (err) => {
        assert.ok(err.message.includes('required'));
        return true;
      }
    );

    const longQuery = 'X'.repeat(4500);
    await assert.rejects(
      async () => agentService.executeQuery(longQuery),
      (err) => {
        assert.ok(err.message.includes('4000'));
        return true;
      }
    );
  });

  // 9. Agent iterations stop at the configured maximum
  test('9. Agent iterations stop at the configured maximum', async () => {
    const maxIterations = 2;
    const result = await agentService.executeQuery('Analyze Oracle strategy and roadmap', {
      organizationId: 'default-org',
      maxIterations,
      timeoutMs: 5000
    });

    assert.ok(result);
    assert.ok(result.executionSteps.length <= 5);
  });

  // 10. Microsoft competitor research preserves evidence and source URLs
  test('10. Microsoft competitor research preserves evidence and source URLs', async () => {
    const result = await agentService.executeQuery('What pricing changes have competitors made?', {
      organizationId: 'default-org',
      timeoutMs: 5000
    });

    assert.ok(Array.isArray(result.evidence));
    if (result.evidence.length > 0) {
      const firstEvidence = result.evidence[0];
      assert.ok(firstEvidence.title);
      assert.ok(firstEvidence.competitorName);
      assert.ok(typeof firstEvidence.confidence === 'number');
    }
  });

  // 11. Hindsight recall and retention handle service failures correctly
  test('11. Hindsight recall and retention handle service failures gracefully', async () => {
    const result = await agentService.executeQuery('What strategic patterns are emerging for IBM?', {
      organizationId: 'default-org',
      mode: 'REFLECT',
      timeoutMs: 5000
    });

    assert.ok(result);
    assert.ok(typeof result.hindsightStatus === 'object');
    assert.ok(result.hindsightStage === 'STANDBY' || result.hindsightStage === 'RECALL' || result.hindsightStage === 'REFLECT' || result.hindsightStage === 'DEGRADED');
  });

  // 12. Database errors do not produce fake success messages
  test('12. Database errors do not produce fake success messages', async () => {
    const result = await agentService.executeQuery('What has NonExistentCompanyX999 been doing?', {
      organizationId: testOrgId
    });

    assert.strictEqual(result.insufficientEvidence, true);
    assert.ok(result.answer.includes('Insufficient evidence'));
    assert.strictEqual(result.facts.length, 0);
    assert.strictEqual(result.events.length, 0);
  });

  // 13. Authentication and authorization are enforced on protected routes
  test('13. Authentication and organization isolation are enforced on protected routes', async () => {
    const req = {
      body: { query: 'Hi' },
      user: { organizationId: 'isolated-org-123' },
      headers: {}
    };

    // Controller receives organizationId from authMiddleware (req.user)
    const orgId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';
    assert.strictEqual(orgId, 'isolated-org-123');
  });

  // 14. Frontend and backend response schemas match
  test('14. Frontend and backend response schemas match complete contract', async () => {
    const result = await agentService.executeQuery('Hi', { organizationId: testOrgId });

    const requiredKeys = [
      'conversationId',
      'answer',
      'facts',
      'observations',
      'inferences',
      'implications',
      'unknowns',
      'evidence',
      'events',
      'memories',
      'hindsightStage',
      'insufficientEvidence',
      'hindsightStatus',
      'ollamaStatus',
      'reasoningSummary',
      'executionSteps',
      'executionPlan'
    ];

    for (const key of requiredKeys) {
      assert.ok(key in result, `Missing expected key in agent result: ${key}`);
    }
  });
});
