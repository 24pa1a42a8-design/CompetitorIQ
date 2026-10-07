import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

export async function handleGlobalSearch(req, res, next) {
  try {
    const rawQuery = (req.query.q || req.query.query || '').toString().trim();
    if (!rawQuery) {
      return res.json({
        success: true,
        data: {
          competitors: [],
          events: [],
          signals: []
        },
        query: ''
      });
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      return res.json({
        success: true,
        data: { competitors: [], events: [], signals: [] },
        query: rawQuery
      });
    }

    const orgId = req.organizationId || 'default-org';
    const q = rawQuery;

    // Search Competitors, Events, and Signals in parallel safely
    const [competitors, events, signals] = await Promise.all([
      // 1. Competitors search
      executeWithDbRetry(() =>
        prisma.competitor.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { industry: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 8,
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            industry: true
          }
        })
      ).catch(() => []),

      // 2. Competitor Events search
      executeWithDbRetry(() =>
        prisma.competitorEvent.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { competitor: { name: { contains: q, mode: 'insensitive' } } }
            ]
          },
          take: 12,
          orderBy: { eventDate: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            eventType: true,
            eventDate: true,
            importance: true,
            competitorId: true,
            competitor: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        })
      ).catch(() => []),

      // 3. Signals / Alerts search
      executeWithDbRetry(() =>
        prisma.alert.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
              { alertType: { contains: q, mode: 'insensitive' } },
              { competitor: { name: { contains: q, mode: 'insensitive' } } }
            ]
          },
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            alertType: true,
            severity: true,
            status: true,
            createdAt: true,
            competitorId: true,
            eventId: true,
            competitor: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        })
      ).catch(() => [])
    ]);

    return res.json({
      success: true,
      data: {
        competitors,
        events,
        signals
      },
      query: rawQuery
    });
  } catch (error) {
    next(error);
  }
}
