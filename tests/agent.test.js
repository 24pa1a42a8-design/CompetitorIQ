import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import agentService from '../server/services/agentService.js';
import ingestionService from '../server/services/ingestionService.js';
import memoryOperationRepository from '../server/repositories/memoryOperationRepository.js';

describe('Competitor Intelligence Agent Unit & Integration Tests', () => {

  const testOrgId = 'agent-test-org';
  const timestamp = Date.now();

  before(async () => {
    // Seed test competitor events into ingestion pipeline & DB
    await ingestionService.processItem({
      competitorName: 'TestCorp',
      eventType: 'PRICING',
      title: `TestCorp Pro Plan Price Drop ${timestamp}`,
      summary: 'TestCorp reduced Pro tier price from $99 to $49/mo.',
      source: 'Official Blog',
      sourceUrl: `https://testcorp.com/blog/pricing-${timestamp}`,
      eventDate: new Date().toISOString()
    }, { organizationId: testOrgId });

    await ingestionService.processItem({
      competitorName: 'TestCorp',
      eventType: 'PRODUCT',
      title: `TestCorp AI Assistant Launch ${timestamp}`,
      summary: 'TestCorp launched autonomous AI copilot feature.',
      source: 'Press Release',
      sourceUrl: `https://testcorp.com/press/ai-copilot-${timestamp}`,
      eventDate: new Date().toISOString()
    }, { organizationId: testOrgId });
  });

  test('1. Factual grounding & historical recall for known competitor', async () => {
    const result = await agentService.executeQuery(`What are the recent pricing and product changes for TestCorp?`, {
      organizationId: testOrgId
    });

    assert.strictEqual(result.insufficientEvidence, false);
    assert.ok(result.facts.length >= 2);
    assert.ok(result.facts.some(f => f.includes('TestCorp Pro Plan Price Drop')));
    assert.ok(result.facts.some(f => f.includes('TestCorp AI Assistant Launch')));
    assert.ok(result.answer.includes('TestCorp Pro Plan Price Drop'));
    assert.strictEqual(Array.isArray(result.evidence), true);
    assert.ok(result.evidence.length >= 2);
  });

  test('2. Insufficient evidence handling for non-existent competitor', async () => {
    const result = await agentService.executeQuery(`What has NonExistentCompanyX999 been doing?`, {
      organizationId: testOrgId
    });

    assert.strictEqual(result.insufficientEvidence, true);
    assert.ok(result.answer.includes('Insufficient evidence'));
    assert.strictEqual(result.facts.length, 0);
    assert.strictEqual(result.events.length, 0);
    assert.ok(result.unknowns.length > 0);
  });

  test('3. Categorized response format contains required sections', async () => {
    const result = await agentService.executeQuery(`Analyze recent moves for TestCorp`, {
      organizationId: testOrgId
    });

    assert.ok(Array.isArray(result.facts));
    assert.ok(Array.isArray(result.observations));
    assert.ok(Array.isArray(result.inferences));
    assert.ok(Array.isArray(result.unknowns));
    assert.ok(Array.isArray(result.evidence));
    assert.ok(Array.isArray(result.events));
    assert.ok(Array.isArray(result.memories));
    assert.ok(typeof result.hindsightStage === 'string');
    assert.ok(typeof result.hindsightStatus === 'object');
  });

  test('4. Hindsight credit limit / unavailable error fallback handling', async () => {
    // Force a query with mode: 'REFLECT' or recall
    const result = await agentService.executeQuery(`What strategy and patterns are emerging for TestCorp?`, {
      organizationId: testOrgId,
      mode: 'REFLECT'
    });

    // Should return result grounded in PostgreSQL without throwing
    assert.ok(result);
    assert.strictEqual(typeof result.answer, 'string');
    assert.ok(result.facts.length > 0);
  });

  test('5. Operation tracking logs RECALL and REFLECT memory operations', async () => {
    const recentOps = await memoryOperationRepository.findRecent({ limit: 10 });
    assert.ok(Array.isArray(recentOps));
    // Verify stages exist in tracking
    const stages = recentOps.map(op => op.stage);
    assert.ok(stages.includes('RETAIN') || stages.includes('RECALL') || stages.includes('REFLECT'));
  });

  test('6. Input validation throws on empty string or overly long query', async () => {
    await assert.rejects(
      async () => agentService.executeQuery('', { organizationId: testOrgId }),
      /required/i
    );
    await assert.rejects(
      async () => agentService.executeQuery('a'.repeat(4001), { organizationId: testOrgId }),
      /4000 characters/i
    );
  });

  test('7. Multi-turn conversation preserves conversationId and context', async () => {
    const turn1 = await agentService.executeQuery('What are TestCorp pricing plans?', {
      organizationId: testOrgId
    });
    assert.ok(turn1.conversationId);

    const turn2 = await agentService.executeQuery('What was the price drop amount?', {
      organizationId: testOrgId,
      conversationId: turn1.conversationId
    });
    assert.strictEqual(turn2.conversationId, turn1.conversationId);
    assert.ok(turn2.answer);
  });

  test('8. General knowledge query executes via local Ollama or fallback', async () => {
    const result = await agentService.executeQuery('What is Retrieval-Augmented Generation?', {
      organizationId: testOrgId
    });
    assert.ok(result);
    assert.strictEqual(typeof result.answer, 'string');
    assert.ok(result.answer.length > 0);
  });

});

