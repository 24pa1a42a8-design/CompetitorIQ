const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const competitors = await prisma.competitor.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('Competitors in DB count:', competitors.length);
  for (const c of competitors) {
    const eventCount = await prisma.competitorEvent.count({
      where: { competitorId: c.id }
    });
    const analysisCount = await prisma.analysis.count({
      where: { competitorId: c.id }
    });
    console.log(`- ID: ${c.id} | Name: "${c.name}" | Slug: "${c.slug}" | Events: ${eventCount} | Analyses: ${analysisCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
