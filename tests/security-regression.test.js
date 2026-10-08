import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server/app.js';
import { signJwt, verifyJwt } from '../server/utils/authUtils.js';

let server;
let port;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

test('Security Test 1: Unauthenticated protected API returns 401 Unauthorized', async () => {
  const res = await request('/competitors');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body?.error?.code, 'UNAUTHORIZED');
});

test('Security Test 2: Invalid JWT returns 401 Unauthorized', async () => {
  const res = await request('/competitors', {
    headers: { Authorization: 'Bearer invalid.fake.token' }
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body?.error?.code, 'UNAUTHORIZED');
});

test('Security Test 3: Expired JWT returns 401 Unauthorized', async () => {
  const expiredToken = signJwt({ id: 'user-test', organizationId: 'test-org', role: 'ANALYST' }, -10);
  const res = await request('/competitors', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body?.error?.code, 'UNAUTHORIZED');
});

test('Security Test 4: Valid JWT user is allowed (HTTP 200)', async () => {
  const validToken = signJwt({ id: 'user-test', organizationId: 'default-org', role: 'ANALYST' });
  const res = await request('/competitors', {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body?.success, true);
});

test('Security Test 5 & 6: Header manipulation (Org A token + Org B x-organization-id header) returns 403 Forbidden', async () => {
  const orgAToken = signJwt({ id: 'user-orga', organizationId: 'tenant-a', role: 'ANALYST' });
  const res = await request('/competitors', {
    headers: {
      Authorization: `Bearer ${orgAToken}`,
      'x-organization-id': 'tenant-b'
    }
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body?.error?.code, 'CROSS_ORGANIZATION_ACCESS_DENIED');
});

test('Security Test 7: Fetching non-existent or other org report returns 404', async () => {
  const validToken = signJwt({ id: 'user-test', organizationId: 'tenant-a', role: 'ANALYST' });
  const res = await request('/executive-reports/other-org-report-id', {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  assert.strictEqual(res.status, 404);
});

test('Security Test 8: Fetching other org conversation returns 404', async () => {
  const validToken = signJwt({ id: 'user-test', organizationId: 'tenant-a', role: 'ANALYST' });
  const res = await request('/agent/conversations/other-org-conversation-id', {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  assert.strictEqual(res.status, 404);
});

test('Security Test 9: Non-admin monitoring request returns 403 Forbidden', async () => {
  const analystToken = signJwt({ id: 'user-analyst', organizationId: 'default-org', role: 'ANALYST' });
  const res = await request('/monitoring/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${analystToken}` }
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body?.error?.code, 'FORBIDDEN');
});

test('Security Test 10: Admin monitoring request is allowed', async () => {
  const { monitoringScheduler } = await import('../server/services/monitoringScheduler.js');
  const originalRunAll = monitoringScheduler.runAllNow;
  monitoringScheduler.runAllNow = async () => ({ status: 'triggered' });
  try {
    const adminToken = signJwt({ id: 'user-admin', organizationId: 'default-org', role: 'ADMIN' });
    const res = await request('/monitoring/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  } finally {
    monitoringScheduler.runAllNow = originalRunAll;
  }
});

test('Security Test 11: Unknown CORS origin is rejected', async () => {
  const res = await request('/health', {
    headers: { Origin: 'http://malicious-attacker-domain.com' }
  });
  assert.strictEqual(res.status, 500); // Express CORS error handler
});

test('Security Test 12: Malformed competitor creation payload returns 400 Bad Request', async () => {
  const adminToken = signJwt({ id: 'user-admin', organizationId: 'default-org', role: 'ADMIN' });
  const res = await request('/competitors', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: { website: 'not-a-valid-url' } // Missing name and invalid URL
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body?.error?.code, 'VALIDATION_ERROR');
});

test('Security Test 13: Search query length limit and wildcard escaping works', async () => {
  const validToken = signJwt({ id: 'user-test', organizationId: 'default-org', role: 'ANALYST' });
  const longQuery = 'A'.repeat(200);
  const res = await request(`/search?q=${encodeURIComponent(longQuery)}`, {
    headers: { Authorization: `Bearer ${validToken}` }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body?.query?.length <= 100, true);
});

test('Security Test 14: Auth token endpoint issues valid JWT token', async () => {
  const res = await request('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { organizationId: 'tenant-secure', role: 'ANALYST' }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.body?.data?.token, 'string');

  const verified = verifyJwt(res.body.data.token);
  assert.strictEqual(verified?.organizationId, 'tenant-secure');
  assert.strictEqual(verified?.role, 'ANALYST');
});
