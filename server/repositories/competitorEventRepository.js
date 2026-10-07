import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

const executeWithRetry = executeWithDbRetry;

export const competitorEventRepository = {
  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return executeWithRetry(() => prisma.competitorEvent.findUnique({
      where: { id },
      include: {
        competitor: true,
        source: true,
        evidence: true,
        pricingSignals: true,
        productSignals: true,
        messagingSignals: true,
        hiringSignals: true,
        fundingSignals: true
      }
    }));
  },

  async findByCompetitor(competitorId, options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    const where = { competitorId };
    if (options.organizationId) {
      where.organizationId = options.organizationId;
    }

    if (options.startDate || options.endDate) {
      where.eventDate = {};
      if (options.startDate) where.eventDate.gte = new Date(options.startDate);
      if (options.endDate) where.eventDate.lte = new Date(options.endDate);
    }

    return executeWithRetry(() => prisma.competitorEvent.findMany({
      where,
      take: options.limit || 20,
      orderBy: { eventDate: 'desc' },
      include: {
        competitor: true,
        source: true,
        evidence: true,
        pricingSignals: true,
        productSignals: true,
        messagingSignals: true,
        hiringSignals: true,
        fundingSignals: true
      }
    }));
  },

  async searchEvents(options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const where = {};
    if (options.organizationId) where.organizationId = options.organizationId;
    if (options.competitorId) where.competitorId = options.competitorId;
    if (options.eventType) where.eventType = options.eventType;

    if (options.startDate || options.endDate) {
      where.eventDate = {};
      if (options.startDate) where.eventDate.gte = new Date(options.startDate);
      if (options.endDate) where.eventDate.lte = new Date(options.endDate);
    }

    if (options.query && typeof options.query === 'string' && options.query.trim()) {
      const q = options.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { competitor: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    return executeWithRetry(() => prisma.competitorEvent.findMany({
      where,
      take: options.limit || 50,
      skip: options.offset || 0,
      orderBy: { eventDate: 'desc' },
      select: {
        id: true,
        organizationId: true,
        competitorId: true,
        sourceId: true,
        eventType: true,
        title: true,
        summary: true,
        description: true,
        eventDate: true,
        detectedAt: true,
        importance: true,
        confidence: true,
        contentHash: true,
        competitor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true
          }
        },
        source: {
          select: {
            id: true,
            url: true,
            publisher: true,
            title: true
          }
        },
        evidence: {
          take: 1,
          select: {
            id: true,
            excerpt: true,
            evidenceType: true
          }
        }
      }
    }));
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return executeWithRetry(() => prisma.competitorEvent.create({ data }));
  }
};

export default competitorEventRepository;
