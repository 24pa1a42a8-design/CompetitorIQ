import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000';

async function postQuery(body, headers = {}) {
  const res = await fetch(`${BASE_URL}/api/agent/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': 'default-org',
      ...headers
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- Starting Agent API 10-Point Verification ---');
  let passed = 0;
  let failed = 0;

  // 1. General knowledge question
  try {
    console.log('\n[Test 1] General knowledge question: "What is an LLM (Large Language Model)?"');
    const { status, data } = await postQuery({ query: 'What is an LLM (Large Language Model)?' });
    assert.strictEqual(status, 200, `Expected 200, got ${status}`);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.insufficientEvidence, false);
    assert.ok(typeof data.data.answer === 'string' && data.data.answer.length > 20);
    assert.ok(data.data.ollamaStatus, 'Expected ollamaStatus object');
    console.log('✓ Test 1 passed. Model:', data.data.ollamaStatus.model, 'Answer snippet:', data.data.answer.slice(0, 100));
    passed++;
  } catch (err) {
    console.error('✗ Test 1 failed:', err.message);
    failed++;
  }

  // 2. Competitor-specific question
  try {
    console.log('\n[Test 2] Competitor-specific question: "What has AWS been doing recently?"');
    const { status, data } = await postQuery({ query: 'What has AWS been doing recently?' });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.insufficientEvidence, false);
    assert.ok(data.data.facts.length > 0, 'Expected AWS facts');
    assert.ok(data.data.facts.some(f => f.includes('AWS')));
    console.log('✓ Test 2 passed. Facts count:', data.data.facts.length);
    passed++;
  } catch (err) {
    console.error('✗ Test 2 failed:', err.message);
    failed++;
  }

  // 3. Questions with supporting database records (Pricing changes)
  try {
    console.log('\n[Test 3] Supporting database records: "What pricing changes have competitors made?"');
    const { status, data } = await postQuery({ query: 'What pricing changes have competitors made?' });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.insufficientEvidence, false);
    assert.ok(data.data.evidence.length > 0, 'Expected evidence items');
    assert.ok(Array.isArray(data.data.facts));
    console.log('✓ Test 3 passed. Evidence count:', data.data.evidence.length);
    passed++;
  } catch (err) {
    console.error('✗ Test 3 failed:', err.message);
    failed++;
  }

  // 4. Questions with no matching records (Non-existent company)
  try {
    console.log('\n[Test 4] No matching records: "What has NonExistentCompanyX999 been doing?"');
    const { status, data } = await postQuery({ query: 'What has NonExistentCompanyX999 been doing?' });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.insufficientEvidence, true);
    assert.ok(data.data.answer.includes('Insufficient evidence'));
    assert.strictEqual(data.data.facts.length, 0);
    console.log('✓ Test 4 passed. Correctly flagged insufficient evidence without inventing facts.');
    passed++;
  } catch (err) {
    console.error('✗ Test 4 failed:', err.message);
    failed++;
  }

  // 5. Follow-up questions with conversation context
  let sharedConvId = null;
  try {
    console.log('\n[Test 5] Follow-up question in conversation');
    // First turn
    const turn1 = await postQuery({ query: 'Summarize recent AWS activities and expansion.' });
    assert.strictEqual(turn1.status, 200);
    sharedConvId = turn1.data.data.conversationId;
    assert.ok(sharedConvId, 'Expected conversationId to be generated');

    // Second turn (Follow up using conversationId)
    const turn2 = await postQuery({
      query: 'What about their pricing?',
      conversationId: sharedConvId
    });
    assert.strictEqual(turn2.status, 200);
    assert.strictEqual(turn2.data.data.conversationId, sharedConvId);
    assert.ok(turn2.data.data.answer.length > 20);
    console.log('✓ Test 5 passed. Conversation ID maintained:', sharedConvId);
    passed++;
  } catch (err) {
    console.error('✗ Test 5 failed:', err.message);
    failed++;
  }

  // 6. Empty or invalid input
  try {
    console.log('\n[Test 6] Empty or whitespace query');
    const { status, data } = await postQuery({ query: '   ' });
    assert.strictEqual(status, 400, 'Expected 400 validation error for empty query');
    assert.strictEqual(data.error, 'VALIDATION_ERROR');
    console.log('✓ Test 6 passed. Rejected with 400 VALIDATION_ERROR');
    passed++;
  } catch (err) {
    console.error('✗ Test 6 failed:', err.message);
    failed++;
  }

  // 7. Long inputs (>4000 characters) and malformed requests
  try {
    console.log('\n[Test 7] Long input (>4000 characters)');
    const longQuery = 'A'.repeat(4500);
    const { status, data } = await postQuery({ query: longQuery });
    assert.strictEqual(status, 400, 'Expected 400 validation error for excessively long query');
    assert.strictEqual(data.error, 'VALIDATION_ERROR');
    console.log('✓ Test 7 passed. Long query safely rejected with 400 error.');
    passed++;
  } catch (err) {
    console.error('✗ Test 7 failed:', err.message);
    failed++;
  }

  // 8. Ollama unavailable or timed out (Service layer fallback)
  try {
    console.log('\n[Test 8] Ollama timeout / fallback behavior');
    // Directly invoke agentService with a 1ms timeout to simulate timeout
    const { agentService } = await import('../server/services/agentService.js');
    const result = await agentService.executeQuery('Compare AWS and Oracle', {
      organizationId: 'default-org',
      timeoutMs: 1
    });
    assert.strictEqual(result.insufficientEvidence, false);
    assert.strictEqual(result.ollamaStatus.used, false);
    assert.strictEqual(result.ollamaStatus.status, 'degraded');
    assert.ok(result.answer.includes('Competitor Intelligence Brief'));
    assert.ok(result.facts.length > 0);
    console.log('✓ Test 8 passed. Gracefully degraded to deterministic synthesis without failing or lying.');
    passed++;
  } catch (err) {
    console.error('✗ Test 8 failed:', err.message);
    failed++;
  }

  // 9. Hindsight unavailable or out of credits fallback
  try {
    console.log('\n[Test 9] Hindsight credit limit / out of credits fallback');
    const { agentService } = await import('../server/services/agentService.js');
    const result = await agentService.executeQuery('What strategic patterns are emerging for IBM?', {
      organizationId: 'default-org',
      mode: 'REFLECT'
    });
    assert.ok(result);
    assert.ok(typeof result.hindsightStatus === 'object');
    assert.strictEqual(typeof result.answer, 'string');
    console.log('✓ Test 9 passed. Hindsight stage/status:', result.hindsightStage, result.hindsightStatus.message);
    passed++;
  } catch (err) {
    console.error('✗ Test 9 failed:', err.message);
    failed++;
  }

  // 10. Conversation retrieval and persistence
  try {
    console.log('\n[Test 10] Conversation retrieval & persistence via REST API');
    // GET /api/agent/conversations
    const listRes = await fetch(`${BASE_URL}/api/agent/conversations`, {
      headers: { 'x-organization-id': 'default-org' }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.success, true);
    assert.ok(Array.isArray(listData.data));
    assert.ok(listData.data.length > 0, 'Expected at least 1 saved conversation');

    // GET /api/agent/conversations/:id/messages
    const convId = sharedConvId || listData.data[0].id;
    const msgRes = await fetch(`${BASE_URL}/api/agent/conversations/${convId}/messages`, {
      headers: { 'x-organization-id': 'default-org' }
    });
    assert.strictEqual(msgRes.status, 200);
    const msgData = await msgRes.json();
    assert.strictEqual(msgData.success, true);
    assert.ok(Array.isArray(msgData.data.messages));
    assert.ok(msgData.data.messages.length >= 2, 'Expected conversation to have user and assistant messages');
    console.log(`✓ Test 10 passed. Found ${msgData.data.messages.length} messages in conversation ${convId}`);
    passed++;
  } catch (err) {
    console.error('✗ Test 10 failed:', err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Total Passed: ${passed} / 10`);
  console.log(`Total Failed: ${failed} / 10`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unexpected failure:', err);
  process.exit(1);
});
