const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('=== DATABASE PATTERN AUDIT ===');
  
  const analyses = await prisma.analysis.findMany({
    where: { type: 'CONNECT_DOTS' },
    include: { competitor: true }
  });

  console.log(`Total CONNECT_DOTS analysis records in DB: ${analyses.length}`);
  analyses.forEach((a, i) => {
    console.log(`\n[${i+1}] ID: ${a.id}`);
    console.log(`Title: ${a.title}`);
    console.log(`Competitor: ${a.competitor?.name}`);
    console.log(`Confidence: ${a.confidence}`);
    console.log(`Facts: ${JSON.stringify(a.facts)}`);
  });

  const events = await prisma.competitorEvent.findMany({
    take: 100,
    orderBy: { eventDate: 'desc' },
    include: { competitor: true }
  });

  console.log(`\nTotal CompetitorEvent count sample: ${events.length}`);
  const counts = {};
  events.forEach(e => {
    counts[e.eventType] = (counts[e.eventType] || 0) + 1;
  });
  console.log('Event types breakdown in sample:', counts);

  await prisma.$disconnect();
}

checkDatabase().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
