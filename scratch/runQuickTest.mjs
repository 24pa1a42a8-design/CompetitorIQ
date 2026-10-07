import fs from 'fs';

const res = await fetch('http://localhost:5000/api/executive-reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
});

const json = await res.json();
const lines = [
  `Status: ${res.status}`,
  `Success: ${json.success}`,
  `Event Count: ${json.data?.metadata?.eventCount}`,
  `Alert Count: ${json.data?.metadata?.alertCount}`,
  `Pattern Count: ${json.data?.metadata?.patternCount}`,
  `Supporting Events Count: ${json.data?.supportingEvents?.length}`,
  `Executive Summary: ${json.data?.sections?.executiveSummary?.microsoftPosition}`
];

fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/test_out.txt', lines.join('\n'));
console.log('SUCCESS_WRITTEN');
