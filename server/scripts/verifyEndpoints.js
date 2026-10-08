import { signJwt } from '../utils/authUtils.js';

const token = signJwt({ id: 'user-test', organizationId: 'default-org', role: 'ANALYST' });
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
const BASE = 'http://localhost:5000/api';

async function check(name, path, method = 'GET', body = null) {
  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}${path}`, opts);
    const json = await r.json().catch(() => null);
    const count = Array.isArray(json?.data) ? json.data.length
                : Array.isArray(json?.events) ? json.events.length
                : Array.isArray(json?.alerts) ? json.alerts.length
                : (json?.data ? 'object' : (json?.token ? 'token' : 'empty'));
    console.log(`[${name}] status=${r.status} success=${json?.success ?? r.ok} items=${count}`);
  } catch (err) {
    console.error(`[${name}] FAILED:`, err.message);
  }
}

async function run() {
  await check('Health', '/health');
  await check('Auth Token', '/auth/token', 'POST', { organizationId: 'default-org', role: 'ANALYST' });
  await check('Competitors', '/competitors');
  await check('Events Timeline', '/ingestion/events?limit=10');
  await check('Connect Dots', '/connect-dots/patterns');
  await check('Strategic Analysis', '/strategic-analysis');
  await check('Alerts', '/alerts');
  await check('Comparison', '/competitive-comparison');
  await check('Hindsight Status', '/hindsight/status');
}

run();
