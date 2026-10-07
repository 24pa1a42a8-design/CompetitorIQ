import fs from 'fs';

const res = await fetch('http://localhost:5000/api/executive-reports/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-organization-id': 'default-org'
  },
  body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
});

const data = await res.json();

// Frontend unwrapping logic:
const reportPayload = data?.data?.report || data?.data?.data || (data?.data?.metadata ? data.data : null) || data?.data || data;

const summary = {
  rawSuccess: data.success,
  unwrappedTitle: reportPayload?.title,
  eventCount: reportPayload?.metadata?.eventCount,
  alertCount: reportPayload?.metadata?.alertCount,
  patternCount: reportPayload?.metadata?.patternCount,
  hasExecutiveSummary: Boolean(reportPayload?.sections?.executiveSummary),
  factsLength: reportPayload?.sections?.executiveSummary?.facts?.length,
  hasCompetitorActivity: Boolean(reportPayload?.sections?.competitorActivity?.length)
};

fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/frontend_unwrap_test.json', JSON.stringify(summary, null, 2));
console.log('UNWRAP_TEST_SUCCESS');
