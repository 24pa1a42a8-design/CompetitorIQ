import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getExpectedCompetitor(event) {
  const url = (event.source?.url || '').toLowerCase().trim();
  const sourceName = (event.source?.name || event.source?.publisher || '').toLowerCase().trim();

  // 1. DOMAIN / URL MATCHING (Highest Confidence - Never override domain by title text)
  if (url.includes('newsroom.ibm.com') || url.includes('ibm.com')) return 'IBM';
  if (url.includes('cloud.google.com') || url.includes('blog.google') || url.includes('cloudblog.withgoogle.com')) return 'Google Cloud';
  if (url.includes('aws.amazon.com') || url.includes('amazon.com/aws') || url.includes('aws.amazon')) return 'AWS';
  if (url.includes('microsoft.com') || url.includes('azure.microsoft.com') || url.includes('azure.com')) return 'Microsoft';
  if (url.includes('oracle.com')) return 'Oracle';
  if (url.includes('salesforce.com')) return 'Salesforce';

  // 2. PUBLISHER MATCHING
  if (sourceName.includes('ibm')) return 'IBM';
  if (sourceName.includes('google cloud') || sourceName.includes('gcp')) return 'Google Cloud';
  if (sourceName.includes('aws') || sourceName.includes('amazon web services')) return 'AWS';
  if (sourceName.includes('microsoft') || sourceName.includes('azure')) return 'Microsoft';
  if (sourceName.includes('oracle')) return 'Oracle';
  if (sourceName.includes('salesforce')) return 'Salesforce';

  return null;
}

async function auditDatabaseEvents() {
  console.log('=== COMPETITOR EVENT DATA INTEGRITY AUDIT ===\n');

  const events = await prisma.competitorEvent.findMany({
    include: {
      competitor: true,
      source: true
    }
  });

  console.log(`Total events in database: ${events.length}`);

  const countsByCompetitor = {};
  const mismatches = [];

  for (const event of events) {
    const compName = event.competitor?.name || 'UNKNOWN';
    countsByCompetitor[compName] = (countsByCompetitor[compName] || 0) + 1;

    const expectedCompetitor = getExpectedCompetitor(event);

    if (expectedCompetitor && expectedCompetitor !== compName) {
      mismatches.push({
        id: event.id,
        title: (event.title || '').substring(0, 70),
        assignedCompetitor: compName,
        expectedCompetitor,
        sourceName: event.source?.name || '',
        sourceUrl: (event.source?.url || '').substring(0, 50)
      });
    }
  }

  console.log('\nEvents by Competitor:');
  console.table(countsByCompetitor);

  console.log(`\nCross-company mismatches: ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.log('\nMismatched Events:');
    console.table(mismatches);
  }

  await prisma.$disconnect();
}

auditDatabaseEvents().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
