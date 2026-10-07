import fs from 'fs';

const res = await fetch('http://localhost:5000/api/executive-reports/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-organization-id': 'custom-demo-org-123'
  },
  body: JSON.stringify({ windowDays: 90, reportType: 'EXECUTIVE_SUMMARY' })
});

const json = await res.json();
fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/custom_org_res.json', JSON.stringify(json, null, 2));
console.log('CUSTOM_ORG_RESULT_WRITTEN');
