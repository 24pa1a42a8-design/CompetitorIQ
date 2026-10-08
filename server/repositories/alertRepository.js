import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

export const alertRepository = {
  async findByOrganization(organizationId, options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const targetOrg = organizationId || 'default-org';
    const where = {
      organizationId: targetOrg
    };

    if (options.competitorId) {
      where.competitorId = options.competitorId;
    }
    if (options.severity) {
      where.severity = options.severity;
    }
    if (options.type) {
      where.type = options.type;
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const take = parseInt(options.limit, 10) || 50;
    const skip = parseInt(options.offset, 10) || 0;

    return executeWithDbRetry(() => prisma.alert.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        competitor: true
      }
    }));
  },

  async findById(id, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const where = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return executeWithDbRetry(() => prisma.alert.findFirst({
      where,
      include: {
        competitor: true,
        event: {
          include: {
            source: true,
            evidence: true,
            pricingSignals: true,
            productSignals: true,
            messagingSignals: true,
            hiringSignals: true,
            fundingSignals: true
          }
        }
      }
    }));
  },

  async findByEventAndType(organizationId, eventId, type) {
    const prisma = getPrismaClient();
    if (!prisma || !eventId) return null;

    return executeWithDbRetry(() => prisma.alert.findFirst({
      where: {
        organizationId,
        eventId,
        type
      }
    }));
  },

  async countUnread(organizationId) {
    const prisma = getPrismaClient();
    if (!prisma) return 0;
    const where = { status: 'UNREAD' };
    if (organizationId && organizationId !== 'all') {
      where.organizationId = organizationId;
    }
    return executeWithDbRetry(() => prisma.alert.count({ where }));
  },

  async markAllAsRead(organizationId) {
    const prisma = getPrismaClient();
    if (!prisma) return { count: 0 };
    const where = { status: 'UNREAD' };
    if (organizationId && organizationId !== 'all') {
      where.organizationId = organizationId;
    }
    return executeWithDbRetry(() => prisma.alert.updateMany({
      where,
      data: {
        status: 'READ',
        readAt: new Date()
      }
    }));
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return executeWithDbRetry(() => prisma.alert.create({
      data,
      include: {
        competitor: true,
        event: true
      }
    }));
  },

  async updateStatus(id, status) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');

    const updateData = { status };
    if (status === 'READ') {
      updateData.readAt = new Date();
    }

    return executeWithDbRetry(() => prisma.alert.update({
      where: { id },
      data: updateData,
      include: {
        competitor: true,
        event: {
          include: {
            source: true,
            evidence: true,
            pricingSignals: true,
            productSignals: true
          }
        }
      }
    }));
  },

  async markAsRead(id) {
    return this.updateStatus(id, 'READ');
  }
};

export default alertRepository;

