const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectDefaultOrgPatterns() {
  const orgs = ['default-org', 'microsoft-demo-org', 'test-org'];
  for (const orgId of orgs) {
    console.log(`\n=== PATTERNS FOR ORG: ${orgId} ===`);
    const analyses = await prisma.analysis.findMany({
      where: { organizationId: orgId, type: 'CONNECT_DOTS' },
      include: { competitor: true }
    });
    console.log(`Total count: ${analyses.length}`);
    analyses.forEach((a, i) => {
      let pType = a.patternType;
      if (!pType) {
        const title = a.title || '';
        if (title.includes('Pricing')) pType = 'PRICING_PRODUCT';
        else if (title.includes('Hiring')) pType = 'HIRING_PRODUCT';
        else if (title.includes('Capital') || title.includes('Expansion') || title.includes('Funding')) pType = 'FUNDING_EXPANSION';
        else pType = 'REPEATED_SIGNAL';
      }
      console.log(`[${i+1}] Comp: ${a.competitor?.name || 'N/A'} | Title: "${a.title}" | pType: ${pType} | Conf: ${a.confidence}`);
    });
  }
  await prisma.$disconnect();
}

inspectDefaultOrgPatterns().catch(console.error);
