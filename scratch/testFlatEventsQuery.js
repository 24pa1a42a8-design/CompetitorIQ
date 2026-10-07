import { getPrismaClient } from '../server/config/database.js';

async function testFlatWithTake() {
  const prisma = getPrismaClient();
  const canonicalIds = [
    'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10',
    'f131a513-f939-44eb-a830-1bfaf56ed35f',
    'd61ea60c-312c-457d-960b-a063ab75321d',
    '9985d6a4-3012-494d-bea4-bb12bc2eb500'
  ];

  console.log('[FLAT WITH TAKE TEST START]');
  const t0 = Date.now();

  const [allEvents, allAlerts, allAnalyses] = await Promise.all([
    prisma.competitorEvent.findMany({
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
        competitorId: true
      }
    }),
    prisma.alert.findMany({
      where: {
        organizationId: 'default-org',
        competitorId: { in: canonicalIds },
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        severity: true,
        title: true,
        message: true,
        createdAt: true,
        competitorId: true
      }
    }),
    prisma.analysis.findMany({
      where: {
        organizationId: 'default-org',
        competitorId: { in: canonicalIds },
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        summary: true,
        confidence: true,
        createdAt: true,
        competitorId: true
      }
    })
  ]);

  const duration = Date.now() - t0;
  console.log(`[FLAT WITH TAKE DONE] Duration for ALL 3 Parallel Queries: ${duration}ms!`);
  console.log(`Fetched ${allEvents.length} events, ${allAlerts.length} alerts, ${allAnalyses.length} analyses.`);
}

testFlatWithTake().then(() => process.exit(0)).catch(console.error);
