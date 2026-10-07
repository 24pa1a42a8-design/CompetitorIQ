const http = require('http');

const data = JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/executive-reports/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('HTTP Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('Success:', parsed.success);
      if (parsed.data) {
        console.log('Meta:', parsed.data.meta);
        console.log('Verified Events Count:', parsed.data.report?.verifiedEvents?.length);
        console.log('Competitor Activities Count:', parsed.data.report?.competitorActivities?.length);
        console.log('Strategic Patterns Count:', parsed.data.report?.strategicPatterns?.length);
        console.log('Alerts Count:', parsed.data.report?.alerts?.length);
        console.log('Executive Summary Preview:', parsed.data.report?.executiveSummary?.substring(0, 150));
      } else {
        console.log('Response Body:', body);
      }
    } catch (e) {
      console.log('Raw Body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
