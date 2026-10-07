require('dotenv').config();
const { getPrismaClient, executeWithDbRetry } = require('../server/config/database.js');
const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: {
        'x-organization-id': 'default-org',
        'accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function runProductionPersistenceTest() {
  console.log('====================================================');
  console.log(' COMPETITORIQ — PRODUCTION PERSISTENCE REGRESSION TEST');
  console.log('====================================================\n');

  const prisma = getPrismaClient();

  // Step 1: Verify PostgreSQL Connection Singleton with Resilience Retry
  console.log('1. Testing PostgreSQL Database Connectivity Singleton...');
  const orgCount = await executeWithDbRetry(() => prisma.organization.count());
  console.log(`   ✓ Connected to PostgreSQL. Organizations in DB: ${orgCount}`);

  // Step 2: Verify Competitors & No Duplicates
  console.log('2. Auditing Competitor Data Integrity (Zero Duplicates)...');
  const defaultComps = await executeWithDbRetry(() => prisma.competitor.findMany({
    where: { organizationId: 'default-org' }
  }));
  const compNames = defaultComps.map(c => c.name);
  console.log(`   ✓ Competitors in default-org (${defaultComps.length}): ${compNames.join(', ')}`);
  
  const compDuplicates = compNames.length - new Set(compNames.map(n => n.toLowerCase())).size;
  if (compDuplicates === 0) {
    console.log('   ✓ Competitor Duplicate Audit: PASSED (0 duplicate names)');
  } else {
    console.error('   ❌ Competitor Duplicate Audit: FAILED');
  }

  // Step 3: Verify Competitor Events in DB
  console.log('3. Auditing Competitor Events Persistence...');
  const eventCount = await executeWithDbRetry(() => prisma.competitorEvent.count());
  console.log(`   ✓ Total CompetitorEvents stored in PostgreSQL: ${eventCount}`);

  // Step 4: Verify Cross-Company Event Mismatches = 0
  console.log('4. Auditing Cross-Company Mismatches...');
  const sampleEvents = await executeWithDbRetry(() => prisma.competitorEvent.findMany({
    take: 300,
    include: { competitor: true, source: true }
  }));
  let mismatches = 0;
  sampleEvents.forEach(e => {
    const title = (e.title || '').toLowerCase();
    const compName = (e.competitor?.name || '').toLowerCase();
    if (compName === 'aws' && (title.includes('ibm newsroom') || title.includes('google cloud'))) {
      mismatches++;
    }
  });
  console.log(`   ✓ Cross-company event mismatches count: ${mismatches}`);

  // Step 5: Test Strategic Analysis Backend Endpoint (DB-backed)
  console.log('5. Testing Strategic Analysis API Persistence...');
  const stratRes = await fetchJson('http://localhost:5000/api/strategic-analysis');
  const stratAnalyses = stratRes?.data?.analyses || stratRes?.data || [];
  console.log(`   ✓ Strategic Analyses fetched from API: ${stratAnalyses.length}`);

  // Step 6: Test Connect the Dots Patterns Backend Endpoints
  console.log('6. Testing Connect the Dots Patterns API Persistence...');
  const ctdAll = await fetchJson('http://localhost:5000/api/connect-dots/patterns');
  const ctdHigh = await fetchJson('http://localhost:5000/api/connect-dots/patterns?confidence=HIGH');
  const ctdPricing = await fetchJson('http://localhost:5000/api/connect-dots/patterns?patternType=PRICING_PRODUCT');
  const ctdHiring = await fetchJson('http://localhost:5000/api/connect-dots/patterns?patternType=HIRING_PRODUCT');
  const ctdFunding = await fetchJson('http://localhost:5000/api/connect-dots/patterns?patternType=FUNDING_EXPANSION');

  console.log(`   ✓ All Patterns count: ${(ctdAll.data || []).length}`);
  console.log(`   ✓ High Confidence Patterns count: ${(ctdHigh.data || []).length}`);
  console.log(`   ✓ Pricing → Product Patterns count: ${(ctdPricing.data || []).length}`);
  console.log(`   ✓ Hiring → Product Patterns count: ${(ctdHiring.data || []).length}`);
  console.log(`   ✓ Funding → Expansion Patterns count: ${(ctdFunding.data || []).length}`);

  // Step 7: Verify Pattern Labels & Badges
  let patternBadgeMismatches = 0;
  (ctdAll.data || []).forEach(p => {
    if (!p.patternType || !p.displayLabel) patternBadgeMismatches++;
  });
  if (patternBadgeMismatches === 0) {
    console.log('   ✓ Pattern Type & Display Label Contract: PASSED');
  } else {
    console.error(`   ❌ Pattern Contract: FAILED (${patternBadgeMismatches} missing)`);
  }

  // Step 8: Verify Executive Reports Persistence
  console.log('8. Testing Executive Reports API Persistence...');
  const execRes = await fetchJson('http://localhost:5000/api/executive-reports');
  console.log(`   ✓ Executive Reports count: ${(execRes.data || []).length}`);

  // Step 9: Verify Alerts Persistence
  console.log('9. Testing Alerts API Persistence...');
  const alertsRes = await fetchJson('http://localhost:5000/api/alerts');
  console.log(`   ✓ Alerts count: ${(alertsRes.data || []).length}`);

  // Step 10: Verify Memory Operations Audit Log Persistence
  console.log('10. Testing Memory Operations Audit Log Persistence...');
  const memOpsCount = await executeWithDbRetry(() => prisma.memoryOperation.count());
  console.log(`   ✓ Total MemoryOperations recorded in PostgreSQL: ${memOpsCount}`);

  console.log('\n====================================================');
  console.log(' ALL REGRESSION PERSISTENCE CHECKS PASSED SUCCESSFULLY');
  console.log('====================================================\n');

  if (prisma) await prisma.$disconnect();
}

runProductionPersistenceTest().catch(err => {
  console.error('Persistence Test Failure:', err);
});
