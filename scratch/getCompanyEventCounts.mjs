import { getPrismaClient } from '../server/config/database.js';
import fs from 'fs';

const prisma = getPrismaClient();

async function getCounts() {
  const companies = ['Microsoft', 'AWS', 'Google Cloud', 'Oracle', 'Salesforce', 'IBM'];
  const results = {};

  for (const name of companies) {
    const comp = await prisma.competitor.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } }
    });

    if (comp) {
      const evtCount = await prisma.competitorEvent.count({
        where: { competitorId: comp.id }
      });
      results[name] = evtCount;
    } else {
      results[name] = 0;
    }
  }

  const totalEvents = await prisma.competitorEvent.count();
  const totalSources = await prisma.source.count();
  const totalAlerts = await prisma.alert.count();

  const summary = {
    countsByCompany: results,
    totalEvents,
    totalSources,
    totalAlerts
  };

  fs.writeFileSync('c:/Users/vedak/OneDrive/Desktop/HYD/competitor-iq/scratch/company_counts.json', JSON.stringify(summary, null, 2));
  console.log('COMPANY_COUNTS_SUCCESS');
  process.exit(0);
}

getCounts();
