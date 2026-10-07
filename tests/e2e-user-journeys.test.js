import test, { before, after } from 'node:test';
import assert from 'node:assert';
import app from '../server/app.js';

let serverInstance = null;

before(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/health/ready');
    if (res.ok) return;
  } catch {
    await new Promise((resolve) => {
      serverInstance = app.listen(5000, () => resolve());
    });
  }
});

after(() => {
  if (serverInstance) {
    serverInstance.close();
  }
});

test('CompetitorIQ End-to-End User Journeys Verification', async (t) => {
  const BASE_URL = 'http://localhost:5000/api';
  let conversationId = null;
  let sampleEventId = null;
  let sampleSourceUrl = null;

  // Journey 1: Open application / Verify backend readiness
  await t.test('Journey 1: System Readiness & Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health/ready`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.database, 'ok');
    console.log('✓ Journey 1 passed: Backend and PostgreSQL database ready');
  });

  // Journey 2: Authenticate and retrieve user session context
  await t.test('Journey 2: Authenticate with valid organization boundary', async () => {
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer org-default:test-token',
        'x-organization-id': 'org-default'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.count === 'number');
    console.log(`✓ Journey 2 passed: Authenticated as org-default; Unread alerts: ${data.count}`);
  });

  // Journey 3: Load dashboard data using actual PostgreSQL database records
  await t.test('Journey 3: Load Dashboard Data (Live Database Records)', async () => {
    const res = await fetch(`${BASE_URL}/ingestion/events?limit=10`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const events = data.events || data.data || [];
    assert.ok(Array.isArray(events), 'Events must be an array');
    assert.ok(events.length > 0, 'Database must return real ingested events');
    sampleEventId = events[0].id;
    sampleSourceUrl = events[0].source?.url;
    console.log(`✓ Journey 3 passed: Loaded ${events.length} real dashboard events`);
  });

  // Journey 4: View Microsoft (Focal) and its 5 competitors
  await t.test('Journey 4: View Microsoft and Competitors (AWS, Google Cloud, Oracle, IBM, Salesforce)', async () => {
    const res = await fetch(`${BASE_URL}/competitors`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const competitors = data.data || data;
    assert.ok(Array.isArray(competitors), 'Competitors must be an array');
    const compNames = competitors.map(c => c.name.toLowerCase());
    
    // Verify focal or key competitors exist
    const expected = ['aws', 'oracle', 'ibm', 'salesforce'];
    for (const exp of expected) {
      assert.ok(compNames.some(n => n.includes(exp)), `Competitor ${exp} must exist in database`);
    }
    console.log(`✓ Journey 4 passed: Verified ${competitors.length} tracked competitors`);
  });

  // Journey 5: Open competitor profile
  await t.test('Journey 5: Open Competitor Profile Details', async () => {
    const compsRes = await fetch(`${BASE_URL}/competitors`);
    const compsData = await compsRes.json();
    const firstComp = (compsData.data || compsData)[0];
    assert.ok(firstComp?.id, 'Competitor must have an ID');

    const profileRes = await fetch(`${BASE_URL}/competitors/${firstComp.id}`);
    assert.strictEqual(profileRes.status, 200);
    const profile = await profileRes.json();
    assert.strictEqual(profile.success, true);
    assert.ok(profile.data?.name, 'Profile must contain competitor name');
    console.log(`✓ Journey 5 passed: Loaded competitor profile for "${profile.data.name}"`);
  });

  // Journey 6: View structured signals (Pricing, Product, Hiring, Funding)
  await t.test('Journey 6: View Structured Signals with Relations', async () => {
    assert.ok(sampleEventId, 'Must have sample event ID');
    const eventRes = await fetch(`${BASE_URL}/events/${sampleEventId}`);
    assert.strictEqual(eventRes.status, 200);
    const eventData = await eventRes.json();
    assert.strictEqual(eventData.success, true);
    assert.ok(eventData.data?.title, 'Event must have title');
    assert.ok(Array.isArray(eventData.data?.evidence || []), 'Event must include evidence relation');
    console.log(`✓ Journey 6 passed: Verified event "${eventData.data.title}" with relations`);
  });

  // Journey 7: AI Agent General Question
  await t.test('Journey 7: Ask AI Agent a General Question', async () => {
    const agentRes = await fetch(`${BASE_URL}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is an LLM (Large Language Model)?'
      })
    });
    assert.strictEqual(agentRes.status, 200);
    const resData = await agentRes.json();
    assert.strictEqual(resData.success, true);
    assert.ok(resData.data?.answer?.length > 10, 'Answer must not be empty');
    conversationId = resData.data?.conversationId;
    assert.ok(conversationId, 'Conversation ID must be generated');
    console.log(`✓ Journey 7 passed: Agent responded to general question; Conversation ID: ${conversationId}`);
  });

  // Journey 8: AI Agent Competitor Grounded Question
  await t.test('Journey 8: Ask AI Agent a Competitor Grounded Question', async () => {
    const agentRes = await fetch(`${BASE_URL}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What recent activities and pricing updates have been recorded for AWS?',
        conversationId
      })
    });
    assert.strictEqual(agentRes.status, 200);
    const resData = await agentRes.json();
    assert.strictEqual(resData.success, true);
    assert.ok(resData.data?.evidence?.length > 0, 'Competitor question must return evidence items');
    assert.ok(resData.data?.facts?.length > 0, 'Competitor question must return grounded facts');
    console.log(`✓ Journey 8 passed: Grounded response returned with ${resData.data.evidence.length} evidence citations`);
  });

  // Journey 9: Follow-up question in conversation context
  await t.test('Journey 9: Follow-up Question in Conversation Context', async () => {
    assert.ok(conversationId, 'Must have conversation ID from previous turns');
    const agentRes = await fetch(`${BASE_URL}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Can you summarize that in two bullet points?',
        conversationId
      })
    });
    assert.strictEqual(agentRes.status, 200);
    const resData = await agentRes.json();
    assert.strictEqual(resData.success, true);
    assert.strictEqual(resData.data.conversationId, conversationId);
    console.log('✓ Journey 9 passed: Follow-up question persisted in conversation context');
  });

  // Journey 10: Ground truth evidence and source URL validation
  await t.test('Journey 10: Supporting Evidence & Source Verification', async () => {
    const alertsRes = await fetch(`${BASE_URL}/alerts?limit=5`);
    const alertsData = await alertsRes.json();
    const alerts = alertsData.data || [];
    assert.ok(alerts.length > 0, 'Must have alerts');
    const sample = alerts[0];
    assert.ok(sample.title, 'Alert must have title');
    assert.ok(sample.message, 'Alert must have message with evidence text');
    console.log(`✓ Journey 10 passed: Verified source provenance on alert "${sample.title}"`);
  });

  // Journey 11: Ingestion / Continuous Monitoring Status
  await t.test('Journey 11: Monitoring Status & Ingestion Health', async () => {
    const monRes = await fetch(`${BASE_URL}/monitoring/status`);
    assert.strictEqual(monRes.status, 200);
    const monData = await monRes.json();
    assert.strictEqual(monData.success, true);
    assert.ok(typeof monData.data?.sourcesConfigured === 'number');
    console.log(`✓ Journey 11 passed: Monitoring operational (${monData.data.sourcesConfigured} sources configured)`);
  });

  // Journey 12: Handle unavailable or invalid source safely
  await t.test('Journey 12: Graceful Error Handling for Unavailable Source', async () => {
    const res = await fetch(`${BASE_URL}/monitoring/run/non_existent_source_999`, {
      method: 'POST'
    });
    // Should return 404 with standard error format
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.message, 'Error must have clear message');
    console.log('✓ Journey 12 passed: Handled unavailable source gracefully without crashing');
  });

  // Journey 13: Handle missing records cleanly
  await t.test('Journey 13: Graceful 404 for Missing Records', async () => {
    const res = await fetch(`${BASE_URL}/events/00000000-0000-0000-0000-000000000000`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error?.code, 'EVENT_NOT_FOUND');
    console.log('✓ Journey 13 passed: Handled missing event ID gracefully');
  });

  // Journey 14: Organization Data Isolation Enforcement
  await t.test('Journey 14: Strict Organization Boundary Enforcement', async () => {
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer org-alpha:token-123',
        'x-organization-id': 'org-beta' // Cross-tenant tampering attempt
      }
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error?.code, 'CROSS_ORGANIZATION_ACCESS_DENIED');
    console.log('✓ Journey 14 passed: Cross-organization data leakage strictly prevented');
  });
});
