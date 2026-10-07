import { getPrismaClient } from '../server/config/database.js';

async function testSpeed() {
  const prisma = getPrismaClient();
  const canonicalIds = [
    'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10',
    'f131a513-f939-44eb-a830-1bfaf56ed35f',
    'd61ea60c-312c-457d-960b-a063ab75321d',
    '9985d6a4-3012-494d-bea4-bb12bc2eb500'
  ];

  console.log('[SPEED TEST START]');
  
  // Test A: With evidence relation
  const tA0 = Date.now();
  await prisma.competitorEvent.findMany({
    where: {
      organizationId: 'default-org',
      competitorId: { in: canonicalIds },
      eventDate: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
    },
    orderBy: { eventDate: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      eventType: true,
      eventDate: true,
      importance: true,
      confidence: true,
      competitorId: true,
      source: {
        select: { title: true, url: true, publisher: true }
      },
      evidence: {
        select: { excerpt: true, evidenceType: true }
      }
    }
  });
  const durA = Date.now() - tA0;
  console.log(`[TEST A - WITH EVIDENCE] Duration: ${durA}ms`);

  // Test B: WITHOUT evidence relation
  const tB0 = Date.now();
  await prisma.competitorEvent.findMany({
    where: {
      organizationId: 'default-org',
      competitorId: { in: canonicalIds },
      eventDate: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
    },
    orderBy: { eventDate: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      eventType: true,
      eventDate: true,
      importance: true,
      confidence: true,
      competitorId: true,
      source: {
        select: { title: true, url: true, publisher: true }
      }
    }
  });
  const durB = Date.now() - tB0;
  console.log(`[TEST B - WITHOUT EVIDENCE RELATION] Duration: ${durB}ms`);
}

testSpeed().then(() => process.exit(0)).catch(console.error);
