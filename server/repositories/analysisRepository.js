import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

export const analysisRepository = {
  async findByOrganization(organizationId, options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const targetOrg = organizationId || 'default-org';
    const where = {
      organizationId: targetOrg
    };

    if (options.type) {
      where.type = options.type;
    }
    if (options.competitorId) {
      where.competitorId = options.competitorId;
    }
    if (options.confidence && options.confidence !== 'ALL') {
      where.confidence = options.confidence;
    }
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const take = parseInt(options.limit, 10) || 50;
    const skip = parseInt(options.offset, 10) || 0;

    return executeWithDbRetry(() => prisma.analysis.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { competitor: true }
    }));
  },

  async findById(id, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const where = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return executeWithDbRetry(() => prisma.analysis.findFirst({
      where,
      include: { competitor: true }
    }));
  },

  async findExistingPattern(organizationId, competitorId, title) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    return executeWithDbRetry(() => prisma.analysis.findFirst({
      where: {
        organizationId,
        competitorId: competitorId || null,
        type: 'CONNECT_DOTS',
        title
      }
    }));
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');

    // Ensure Organization exists
    let org = await executeWithDbRetry(() => prisma.organization.findUnique({ where: { id: data.organizationId } }));
    if (!org) {
      try {
        await executeWithDbRetry(() => prisma.organization.create({
          data: {
            id: data.organizationId,
            name: data.organizationId === 'default-org' ? 'Default Organization' : data.organizationId,
            planTier: 'FREE'
          }
        }));
      } catch (e) {
        // Created concurrently
      }
    }

    // Ensure Competitor exists if provided
    let competitorId = data.competitorId || null;
    if (competitorId) {
      const comp = await executeWithDbRetry(() => prisma.competitor.findUnique({ where: { id: competitorId } }));
      if (!comp) {
        competitorId = null;
      }
    }

    return executeWithDbRetry(() => prisma.analysis.create({
      data: {
        ...data,
        competitorId
      },
      include: { competitor: true }
    }));
  }
};

export default analysisRepository;

