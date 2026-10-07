const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const competitors = await prisma.competitor.findMany({
    orderBy: { name: 'asc' }
  });
  
  const nameMap = {};
  for (const c of competitors) {
    if (!nameMap[c.name]) nameMap[c.name] = [];
    nameMap[c.name].push(c);
  }

  console.log('=== DUPLICATE COMPETITOR NAMES IN DB ===');
  for (const [name, list] of Object.entries(nameMap)) {
    if (list.length > 1) {
      console.log(`\nCompetitor Name: "${name}" (Count: ${list.length})`);
      for (const c of list) {
        const events = await prisma.competitorEvent.count({ where: { competitorId: c.id } });
        const analyses = await prisma.analysis.count({ where: { competitorId: c.id } });
        const pricing = await prisma.pricingSignal.count({ where: { competitorId: c.id } });
        const product = await prisma.productSignal.count({ where: { competitorId: c.id } });
        const messaging = await prisma.messagingSignal.count({ where: { competitorId: c.id } });
        const hiring = await prisma.hiringSignal.count({ where: { competitorId: c.id } });
        const funding = await prisma.fundingSignal.count({ where: { competitorId: c.id } });
        console.log(`  - ID: ${c.id} | Slug: "${c.slug}" | Events: ${events} | Analyses: ${analyses} | Signals: p:${pricing}/prd:${product}/m:${messaging}/h:${hiring}/f:${funding}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
