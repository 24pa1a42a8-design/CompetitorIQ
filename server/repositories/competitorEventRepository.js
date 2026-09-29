import { getPrismaClient } from '../config/database.js';

export const competitorEventRepository = {
  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.competitorEvent.findUnique({
      where: { id },
      include: {
        competitor: true,
        source: true,
        evidence: true
      }
    });
  },

  async findByCompetitor(competitorId, options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return prisma.competitorEvent.findMany({
      where: { competitorId },
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
    });
  },

  async searchEvents(options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const where = {};
    if (options.organizationId) where.organizationId = options.organizationId;
    if (options.competitorId) where.competitorId = options.competitorId;
    if (options.eventType) where.eventType = options.eventType;

    if (options.query && typeof options.query === 'string' && options.query.trim()) {
      const q = options.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { competitor: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    return prisma.competitorEvent.findMany({
      where,
      take: options.limit || 20,
      skip: options.offset || 0,
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
    });
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.competitorEvent.create({ data });
  }
};

export default competitorEventRepository;
