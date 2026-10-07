import fs from 'fs';

async function test() {
  const log = [];

  // Test 1: Direct Express
  try {
    const t0 = Date.now();
    const res1 = await fetch('http://localhost:5000/api/executive-reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-organization-id': 'default-org' },
      body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
    });
    const d1 = Date.now() - t0;
    const json1 = await res1.json();
    log.push(`Direct Express (5000): HTTP ${res1.status}, duration ${d1}ms, success: ${json1.success}, eventCount: ${json1.data?.metadata?.eventCount}`);
  } catch (e) {
    log.push(`Direct Express Error: ${e.message}`);
  }

  // Test 2: Via Vite Proxy (5174)
  try {
    const t0 = Date.now();
    const res2 = await fetch('http://localhost:5174/api/executive-reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-organization-id': 'default-org' },
      body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
    });
    const d2 = Date.now() - t0;
    const json2 = await res2.json();
    log.push(`Vite Proxy (5174): HTTP ${res2.status}, duration ${d2}ms, success: ${json2.success}, eventCount: ${json2.data?.metadata?.eventCount}`);
  } catch (e) {
    log.push(`Vite Proxy Error: ${e.message}`);
  }

  fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/proxy_test.txt', log.join('\n'));
  console.log('PROXY_TEST_DONE');
}

test();
