const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PATTERN_LABELS = {
  PRICING_PRODUCT: "Pricing → Product",
  HIRING_PRODUCT: "Hiring → Product",
  FUNDING_EXPANSION: "Funding → Expansion"
};

async function audit() {
  const analyses = await prisma.analysis.findMany({
    where: { type: 'CONNECT_DOTS' },
    include: { competitor: true }
  });

  const breakdown = {};
  analyses.forEach(a => {
    let pType = a.patternType;
    if (!pType) {
      const title = a.title || '';
      if (title.includes('Pricing')) pType = 'PRICING_PRODUCT';
      else if (title.includes('Hiring')) pType = 'HIRING_PRODUCT';
      else if (title.includes('Capital') || title.includes('Expansion') || title.includes('Funding')) pType = 'FUNDING_EXPANSION';
      else pType = 'REPEATED_SIGNAL';
    }
    const conf = a.confidence || 'UNKNOWN';
    const key = `${pType} | ${conf}`;
    breakdown[key] = (breakdown[key] || 0) + 1;
  });

  console.log('=== PATTERN BREAKDOWN IN DB ===');
  console.table(breakdown);

  // Print 1 sample per patternType
  const seenTypes = new Set();
  console.log('\n=== SAMPLE PER PATTERN TYPE ===');
  analyses.forEach(a => {
    let pType = a.patternType;
    if (!pType) {
      const title = a.title || '';
      if (title.includes('Pricing')) pType = 'PRICING_PRODUCT';
      else if (title.includes('Hiring')) pType = 'HIRING_PRODUCT';
      else if (title.includes('Capital') || title.includes('Expansion') || title.includes('Funding')) pType = 'FUNDING_EXPANSION';
      else pType = 'REPEATED_SIGNAL';
    }
    if (!seenTypes.has(pType)) {
      seenTypes.add(pType);
      console.log(`\nPatternType: ${pType} (${PATTERN_LABELS[pType] || 'Other'})`);
      console.log(`Title: ${a.title}`);
      console.log(`Competitor: ${a.competitor?.name}`);
      console.log(`Confidence: ${a.confidence}`);
    }
  });

  await prisma.$disconnect();
}

audit().catch(console.error);
