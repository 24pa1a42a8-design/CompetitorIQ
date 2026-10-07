import { getPrismaClient } from '../config/database.js';
import { connectDotsService } from '../services/connectDotsService.js';
import { resolveCompetitorFromSource } from '../ingestion/competitorResolver.js';

export async function runCompetitivePatternsAudit() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Database client not available.');
    process.exit(1);
  }

  console.log('================================================================');
  console.log(' CompetitorIQ — Competitive Patterns & Data Pipeline Audit');
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  // 1. EVENT COUNTS BY TYPE
  const events = await prisma.competitorEvent.findMany({
    include: { competitor: true, source: true }
  });

  const eventCountsByType = {
    PRODUCT: 0,
    PRICING: 0,
    FEATURE: 0,
    HIRING: 0,
    FUNDING: 0,
    EXPANSION: 0
  };

  const eventCountsByComp = {
    Microsoft: 0,
    AWS: 0,
    'Google Cloud': 0,
    Oracle: 0,
    Salesforce: 0,
    IBM: 0
  };

  let crossCompanyMismatches = 0;
  let missingCompetitorId = 0;
  let missingSourceId = 0;
  let missingSourceUrl = 0;
  let missingEventType = 0;
  let officialSourceCount = 0;
  let nonOfficialSourceCount = 0;

  for (const evt of events) {
    const type = evt.eventType;
    if (eventCountsByType[type] !== undefined) {
      eventCountsByType[type]++;
    }

    const compName = evt.competitor?.name;
    if (eventCountsByComp[compName] !== undefined) {
      eventCountsByComp[compName]++;
    }

    if (!evt.competitorId) missingCompetitorId++;
    if (!evt.sourceId) missingSourceId++;
    if (!evt.source?.url) missingSourceUrl++;
    if (!evt.eventType) missingEventType++;

    const url = (evt.source?.url || '').toLowerCase();
    if (url.includes('microsoft.com') || url.includes('aws.amazon.com') || url.includes('cloud.google.com') || url.includes('oracle.com') || url.includes('salesforce.com') || url.includes('ibm.com')) {
      officialSourceCount++;
    } else {
      nonOfficialSourceCount++;
    }

    // Verify competitor mapping integrity
    const resolvedComp = resolveCompetitorFromSource({
      sourceUrl: evt.source?.url || '',
      sourceName: evt.source?.name || evt.source?.publisher || '',
      title: evt.title,
      summary: evt.summary,
      competitorName: compName,
      competitorId: evt.competitor?.slug
    });

    if (resolvedComp && compName && resolvedComp.name !== compName) {
      crossCompanyMismatches++;
    }
  }

  // 2. PATTERN ANALYSIS RUN
  const patternResult = await connectDotsService.analyzePatterns({
    organizationId: 'default-org',
    windowDays: 180
  });

  const patterns = patternResult.patterns || [];

  const patternCountsByType = {
    'Pricing → Product': 0,
    'Hiring → Product': 0,
    'Funding → Expansion': 0,
    'Other Patterns': 0
  };

  const confidenceCounts = {
    High: 0,
    Medium: 0,
    Low: 0
  };

  for (const p of patterns) {
    const pType = (p.patternType || p.type || '').toUpperCase();
    if (pType.includes('PRICING')) patternCountsByType['Pricing → Product']++;
    else if (pType.includes('HIRING')) patternCountsByType['Hiring → Product']++;
    else if (pType.includes('FUNDING')) patternCountsByType['Funding → Expansion']++;
    else patternCountsByType['Other Patterns']++;

    const conf = (p.confidence || 'MEDIUM').toUpperCase();
    if (conf === 'HIGH') confidenceCounts.High++;
    else if (conf === 'MEDIUM') confidenceCounts.Medium++;
    else confidenceCounts.Low++;
  }

  console.log('--- EVENT COUNTS BY CATEGORY ---');
  console.table(eventCountsByType);

  console.log('\n--- EVENT COUNTS BY COMPETITOR ---');
  console.table(eventCountsByComp);

  console.log('\n--- PATTERN COUNTS ---');
  console.table(patternCountsByType);

  console.log('\n--- CONFIDENCE BREAKDOWN ---');
  console.table(confidenceCounts);

  console.log('\n--- SOURCE QUALITY ---');
  console.table({
    Official: officialSourceCount,
    'Non-official / Test': nonOfficialSourceCount,
    Missing: missingSourceUrl
  });

  console.log('\n--- DATA INTEGRITY ---');
  console.table({
    'Cross-company mismatches': crossCompanyMismatches,
    'Missing competitorId': missingCompetitorId,
    'Missing sourceId': missingSourceId,
    'Missing source URL': missingSourceUrl,
    'Missing eventType': missingEventType
  });

  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('auditCompetitivePatterns.js')) {
  runCompetitivePatternsAudit()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
