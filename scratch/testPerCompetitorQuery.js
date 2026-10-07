import { getPrismaClient } from '../server/config/database.js';

async function testPerCompetitorSpeed() {
  const prisma = getPrismaClient();
  const canonicalIds = [
    'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', // AWS
    'f131a513-f939-44eb-a830-1bfaf56ed35f', // Google Cloud
    'd61ea60c-312c-457d-960b-a063ab75321d', // IBM
    '9985d6a4-3012-494d-bea4-bb12bc2eb500'  // Microsoft
  ];

  console.log('[PER COMPETITOR QUERY SPEED TEST]');
  const t0 = Date.now();

  const currentStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [eventResults, allAlerts, allAnalyses] = await Promise.all([
    Promise.all(canonicalIds.map(cId => 
      prisma.competitorEvent.findMany({
        where: {
          organizationId: 'default-org',
          competitorId: cId,
          eventDate: { gte: previousStart }
        },
        orderBy: { eventDate: 'desc' },
        take: 30,
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
      })
    )),
    prisma.alert.findMany({
      where: {
        organizationId: 'default-org',
        competitorId: { in: canonicalIds },
        createdAt: { gte: currentStart }
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
        createdAt: { gte: currentStart }
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

  const allEvents = eventResults.flat();
  const duration = Date.now() - t0;

  console.log(`[PER COMPETITOR DONE] Total duration: ${duration}ms!`);
  console.log(`Fetched ${allEvents.length} events across ${canonicalIds.length} competitors (${allAlerts.length} alerts, ${allAnalyses.length} analyses).`);
}

testPerCompetitorSpeed().then(() => process.exit(0)).catch(console.error);
