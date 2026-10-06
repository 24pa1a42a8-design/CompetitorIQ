import test from 'node:test';
import assert from 'node:assert';

test('Production Security & Organization Isolation Tests', async (t) => {
  const BASE_URL = 'http://localhost:5000/api';

  await t.test('1. Public health check is accessible without authentication', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data?.status || data.status, 'ok');
  });

  await t.test('2. Rejects empty Bearer token with 401 INVALID_TOKEN', async () => {
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer '
      }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error?.code, 'INVALID_TOKEN');
  });

  await t.test('3. Rejects invalid token claims format with 401', async () => {
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer org-!@#$%^:secret'
      }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error?.code, 'INVALID_TOKEN_CLAIMS');
  });

  await t.test('4. Rejects cross-organization access with 403 CROSS_ORGANIZATION_ACCESS_DENIED', async () => {
    // User authenticated as org-tenant-a attempts to query org-tenant-b
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer org-tenant-a:user-key-123',
        'x-organization-id': 'org-tenant-b'
      }
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.error?.code, 'CROSS_ORGANIZATION_ACCESS_DENIED');
  });

  await t.test('5. Rejects malicious organization identifiers with 400 INVALID_ORGANIZATION_ID', async () => {
    // Malicious injection attempt in x-organization-id
    const maliciousPayloads = [
      '../../etc/passwd',
      "org' OR 1=1 --",
      'org<script>alert(1)</script>',
      'a'.repeat(100) // exceeds max length
    ];

    for (const payload of maliciousPayloads) {
      const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
        headers: {
          'x-organization-id': payload
        }
      });
      assert.strictEqual(res.status, 400, `Payload '${payload}' must be rejected with 400`);
      const data = await res.json();
      assert.strictEqual(data.error?.code, 'INVALID_ORGANIZATION_ID');
    }
  });

  await t.test('6. Valid tenant token accesses own organization boundary safely', async () => {
    const res = await fetch(`${BASE_URL}/alerts/unread-count`, {
      headers: {
        'Authorization': 'Bearer org-tenant-a:user-key-123',
        'x-organization-id': 'org-tenant-a'
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.count === 'number');
  });
});
