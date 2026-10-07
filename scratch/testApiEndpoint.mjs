const res = await fetch('http://localhost:5000/api/executive-reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
});

const json = await res.json();
console.log('--- API RESPONSE SUCCESS ---');
console.log('Status:', res.status);
console.log('Success:', json.success);
if (json.data) {
  console.log('Metadata:', json.data.metadata);
  console.log('Event Count:', json.data.metadata?.eventCount);
  console.log('Alert Count:', json.data.metadata?.alertCount);
  console.log('Pattern Count:', json.data.metadata?.patternCount);
  console.log('Executive Summary Facts:', json.data.sections?.executiveSummary?.facts);
  console.log('Verified Events Count:', json.data.sections?.keySignals?.reduce((sum, s) => sum + (s.events?.length || 0), 0));
  console.log('Supporting Events Count:', json.data.supportingEvents?.length);
} else {
  console.log('Response Body:', json);
}
