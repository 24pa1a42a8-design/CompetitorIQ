const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function testApi() {
  console.log('=== CONNECT THE DOTS API VERIFICATION ===\n');

  const baseUrl = 'http://localhost:5000/api/connect-dots/patterns';

  const tests = [
    { tab: 'ALL', url: baseUrl },
    { tab: 'HIGH_CONFIDENCE', url: `${baseUrl}?confidence=HIGH` },
    { tab: 'PRICING_PRODUCT', url: `${baseUrl}?patternType=PRICING_PRODUCT` },
    { tab: 'HIRING_PRODUCT', url: `${baseUrl}?patternType=HIRING_PRODUCT` },
    { tab: 'FUNDING_EXPANSION', url: `${baseUrl}?patternType=FUNDING_EXPANSION` },
    { tab: 'PRICING_PRODUCT + HIGH', url: `${baseUrl}?patternType=PRICING_PRODUCT&confidence=HIGH` },
    { tab: 'HIRING_PRODUCT + HIGH', url: `${baseUrl}?patternType=HIRING_PRODUCT&confidence=HIGH` }
  ];

  for (const t of tests) {
    console.log(`Testing Filter [${t.tab}]:`);
    const start = Date.now();
    const res = await fetchJson(t.url);
    const duration = Date.now() - start;
    const patterns = res.data || [];
    console.log(`  - API Duration: ${duration}ms`);
    console.log(`  - Patterns Returned: ${patterns.length}`);

    // Verify all returned patterns match criteria strictly
    let mismatches = 0;
    patterns.forEach(p => {
      if (!p.patternType || !p.displayLabel) {
        console.log(`    ❌ Missing patternType or displayLabel!`, p);
        mismatches++;
      }
      if (t.tab === 'PRICING_PRODUCT' && p.patternType !== 'PRICING_PRODUCT') mismatches++;
      if (t.tab === 'HIRING_PRODUCT' && p.patternType !== 'HIRING_PRODUCT') mismatches++;
      if (t.tab === 'FUNDING_EXPANSION' && p.patternType !== 'FUNDING_EXPANSION') mismatches++;
      if (t.tab.includes('HIGH') && p.confidence !== 'HIGH') mismatches++;
    });

    if (mismatches === 0) {
      console.log(`  - Strict Type & Confidence Match: PASSED (0 mismatches)`);
    } else {
      console.log(`  - Strict Type & Confidence Match: FAILED (${mismatches} mismatches)`);
    }
    if (patterns.length > 0) {
      console.log(`  - Sample Card: [${patterns[0].confidence}] [${patterns[0].displayLabel}] (${patterns[0].competitor?.name}) "${patterns[0].title}"`);
    }
    console.log('');
  }
}

testApi().catch(console.error);
