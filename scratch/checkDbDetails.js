import { getPrismaClient } from '../server/config/database.js';

async function check() {
  const prisma = getPrismaClient();

  const orgs = await prisma.organization.findMany();
  console.log('Orgs in DB:', orgs.map(o => ({ id: o.id, name: o.name })));
  
  const compCount = await prisma.competitor.count();
  console.log('Total competitors count:', compCount);
  const comps = await prisma.competitor.findMany();
  console.log('Competitors in DB:', comps.map(c => ({ id: c.id, name: c.name, orgId: c.organizationId, slug: c.slug })));
  
  const eventCount = await prisma.competitorEvent.count();
  console.log('Total CompetitorEvents in DB:', eventCount);
  
  const eventsByOrg = await prisma.competitorEvent.groupBy({
    by: ['organizationId'],
    _count: { id: true }
  });
  console.log('Events grouped by organizationId:', eventsByOrg);

  const eventsByComp = await prisma.competitorEvent.groupBy({
    by: ['competitorId'],
    _count: { id: true }
  });
  console.log('Events grouped by competitorId:', eventsByComp);

  const sourcesCount = await prisma.source.count();
  console.log('Total Sources count:', sourcesCount);

  const alertsCount = await prisma.alert.count();
  console.log('Total Alerts count:', alertsCount);
}

check().catch(err => console.error(err));
