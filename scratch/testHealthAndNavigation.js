import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  const endpoints = [
    '/health',
    '/competitors',
    '/ingestion/events?limit=20',
    '/ingestion/events?eventType=PRICING',
    '/ingestion/events?eventType=FEATURE',
    '/connect-dots?limit=10',
    '/connect-dots?patternType=PRICING_TO_PRODUCT',
    '/alerts?limit=10',
    '/competitive-comparison?windowDays=90',
    '/executive-reports/latest',
    '/hindsight/status'
  ];

  console.log('--- Testing API Endpoints ---');
  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${ep}`, {
        headers: { 'x-organization-id': 'default-org' }
      });
      const duration = Date.now() - start;
      const data = await res.json();
      const status = res.status;
      const success = data.success !== undefined ? data.success : true;
      console.log(`[API TEST] ${ep} => HTTP ${status} (${duration}ms) - success: ${success}`);
    } catch (err) {
      console.error(`[API TEST FAIL] ${ep} => ${err.message}`);
    }
  }
}

testEndpoints();
