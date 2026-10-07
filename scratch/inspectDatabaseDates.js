import { getPrismaClient } from '../server/config/database.js';

async function inspect() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client unavailable');
    return;
  }

  const events = await prisma.competitorEvent.findMany({
    include: { competitor: true, source: true },
    orderBy: { eventDate: 'desc' }
  });

  console.log(`Total CompetitorEvents in DB: ${events.length}`);

  const byComp = {};
  const sameDayGroups = {};

  for (const e of events) {
    const compName = e.competitor?.name || 'Unknown';
    if (!byComp[compName]) byComp[compName] = [];
    byComp[compName].push(e);

    const dateStr = e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : 'NoDate';
    if (!sameDayGroups[dateStr]) sameDayGroups[dateStr] = [];
    sameDayGroups[dateStr].push(e);
  }

  console.log('\n--- Events Grouped By Competitor ---');
  for (const [comp, list] of Object.entries(byComp)) {
    console.log(`\nCompetitor: ${comp} (${list.length} events)`);
    list.slice(0, 10).forEach(e => {
      const dateStr = e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : 'N/A';
      const createdStr = e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : 'N/A';
      console.log(`  [${dateStr}] (${e.eventType}) ${e.title.slice(0, 50)}... | URL: ${e.source?.url || 'N/A'}`);
    });
  }

  console.log('\n--- Suspicious Same-Day Groups ---');
  for (const [dateStr, list] of Object.entries(sameDayGroups)) {
    if (list.length > 2) {
      console.log(`Date ${dateStr}: ${list.length} events assigned this exact date`);
    }
  }
}

inspect();
