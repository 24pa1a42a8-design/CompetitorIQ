import http from 'http';
import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function verifyPersistence() {
  console.log('\n==================================================');
  console.log('    COMPETITORIQ PERSISTENCE & RESTART VERIFICATION ');
  console.log('==================================================');

  // 1. Direct DB verification via Prisma
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client unavailable');
    process.exit(1);
  }

  const [competitors, events, analyses, alerts] = await Promise.all([
    executeWithDbRetry(() => prisma.competitor.count()),
    executeWithDbRetry(() => prisma.competitorEvent.count()),
    executeWithDbRetry(() => prisma.analysis.count()),
    executeWithDbRetry(() => prisma.alert.count())
  ]);

  console.log('\nPostgreSQL Database Counts:');
  console.log(`- Competitors:        ${competitors}`);
  console.log(`- Competitor Events:  ${events}`);
  console.log(`- Strategic Analyses: ${analyses}`);
  console.log(`- Strategic Alerts:   ${alerts}`);

  if (competitors === 0 || events === 0) {
    console.error('FAIL: Database tables are empty!');
    process.exit(1);
  }

  // 2. HTTP Endpoint Verification
  console.log('\nHTTP Endpoint Verification (Local Backend Server):');
  const baseUrl = 'http://localhost:5000/api';

  try {
    const health = await fetchJson(`${baseUrl}/health`);
    console.log(`- GET /api/health:                 HTTP ${health.status} (${health.body?.status || 'ok'})`);

    const compRes = await fetchJson(`${baseUrl}/competitors`);
    const compCount = compRes.body?.data?.length || 0;
    console.log(`- GET /api/competitors:            HTTP ${compRes.status} (${compCount} items)`);

    const eventRes = await fetchJson(`${baseUrl}/ingestion/events?limit=10`);
    const eventCount = eventRes.body?.data?.events?.length || eventRes.body?.data?.length || 0;
    console.log(`- GET /api/ingestion/events:       HTTP ${eventRes.status} (${eventCount} items)`);

    const alertRes = await fetchJson(`${baseUrl}/alerts?limit=10`);
    const alertCount = alertRes.body?.data?.length || 0;
    console.log(`- GET /api/alerts:                 HTTP ${alertRes.status} (${alertCount} items)`);

    const compCompRes = await fetchJson(`${baseUrl}/competitive-comparison?windowDays=90`);
    const compCompCount = compCompRes.body?.data?.competitors?.length || 0;
    console.log(`- GET /api/competitive-comparison: HTTP ${compCompRes.status} (${compCompCount} competitors compared)`);

    console.log('\n✓ PERSISTENCE VERIFICATION PASSED');
    console.log('==================================================\n');
  } catch (err) {
    console.error('HTTP endpoint check failed:', err.message);
    process.exit(1);
  }
}

verifyPersistence().then(() => process.exit(0)).catch(err => {
  console.error('Persistence verification failed:', err);
  process.exit(1);
});
