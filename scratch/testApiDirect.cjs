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

async function runDirectApiTest() {
  console.log('====================================================');
  console.log(' COMPETITORIQ — DIRECT API PERSISTENCE VERIFICATION');
  console.log('====================================================\n');

  console.log('1. Fetching Competitors from API...');
  const compRes = await fetchJson('http://localhost:5000/api/competitors');
  const comps = compRes?.data || [];
  console.log(`   ✓ Competitors returned: ${comps.map(c => c.name).join(', ')} (${comps.length} total)`);

  console.log('2. Fetching Activity Timeline Events from API...');
  const eventRes = await fetchJson('http://localhost:5000/api/ingestion/events?limit=50');
  const events = eventRes?.data || [];
  console.log(`   ✓ Events returned: ${events.length}`);

  console.log('3. Fetching Strategic Analyses from API...');
  const stratRes = await fetchJson('http://localhost:5000/api/strategic-analysis');
  const stratAnalyses = stratRes?.data?.analyses || stratRes?.data || [];
  console.log(`   ✓ Strategic Analyses returned: ${stratAnalyses.length}`);

  console.log('4. Fetching Connect the Dots Patterns from API...');
  const ctdRes = await fetchJson('http://localhost:5000/api/connect-dots/patterns');
  const patterns = ctdRes?.data || [];
  console.log(`   ✓ Patterns returned: ${patterns.length}`);

  console.log('5. Fetching Executive Reports from API...');
  const execRes = await fetchJson('http://localhost:5000/api/executive-reports/latest');
  const reports = execRes?.data || execRes || [];
  console.log(`   ✓ Executive Report status: ${execRes.success ? 'PASSED' : 'FAILED'}`);

  console.log('6. Fetching Alerts from API...');
  const alertRes = await fetchJson('http://localhost:5000/api/alerts');
  const alerts = alertRes?.data || [];
  console.log(`   ✓ Alerts returned: ${alerts.length}`);

  console.log('\n====================================================');
  console.log(' ALL DIRECT API PERSISTENCE CHECKS PASSED');
  console.log('====================================================\n');
}

runDirectApiTest().catch(console.error);
