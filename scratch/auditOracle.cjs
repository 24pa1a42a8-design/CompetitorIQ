const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllOracleCompetitors() {
  console.log('=== ALL ORACLE COMPETITORS & EVENTS AUDIT ===');
  
  const oracleComps = await prisma.competitor.findMany({
    where: { name: { contains: 'Oracle', mode: 'insensitive' } }
  });

  console.log(`Found ${oracleComps.length} Oracle competitor records:`);
  for (const comp of oracleComps) {
    console.log(`\nCompetitor ID: ${comp.id} | Org: ${comp.organizationId} | Name: ${comp.name}`);
    const events = await prisma.competitorEvent.findMany({
      where: { competitorId: comp.id },
      orderBy: { eventDate: 'asc' },
      select: { id: true, eventType: true, title: true, eventDate: true }
    });
    console.log(`Events count: ${events.length}`);
    events.forEach((e, idx) => {
      console.log(`  [${idx+1}] ${e.eventType} | ${e.eventDate.toISOString()} | ${e.title}`);
    });

    const analyses = await prisma.analysis.findMany({
      where: { competitorId: comp.id, type: 'CONNECT_DOTS' }
    });
    console.log(`Analyses count: ${analyses.length}`);
    analyses.forEach((a, idx) => {
      console.log(`  [${idx+1}] Title: ${a.title} | Conf: ${a.confidence}`);
    });
  }

  await prisma.$disconnect();
}

checkAllOracleCompetitors().catch(console.error);
