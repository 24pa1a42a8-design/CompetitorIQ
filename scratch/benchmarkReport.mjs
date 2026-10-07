import fs from 'fs';

const startTime = Date.now();
try {
  const res = await fetch('http://localhost:5000/api/executive-reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
  });

  const durationMs = Date.now() - startTime;
  const json = await res.json();
  const report = json.data?.report || json.data;

  const lines = [
    `Duration: ${durationMs}ms`,
    `HTTP Status: ${res.status}`,
    `Success: ${json.success}`,
    `Event Count: ${report?.metadata?.eventCount}`,
    `Alert Count: ${report?.metadata?.alertCount}`,
    `Pattern Count: ${report?.metadata?.patternCount}`,
    `Supporting Events Count: ${report?.supportingEvents?.length}`,
    `Executive Summary Title: ${report?.sections?.executiveSummary?.title}`,
    `Executive Summary Observations: ${JSON.stringify(report?.sections?.executiveSummary?.observations)}`,
    `Competitor Activity Count: ${report?.sections?.competitorActivity?.length}`,
    `Timeline Count: ${report?.sections?.timeline?.length}`,
    `Recommended Actions Count: ${report?.sections?.recommendedActions?.length}`
  ];

  fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/final_report_test.txt', lines.join('\n'));
  console.log('BENCHMARK_COMPLETED_IN_' + durationMs + 'MS');
} catch (e) {
  fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/final_report_test.txt', 'Error: ' + e.message + '\n' + e.stack);
}
