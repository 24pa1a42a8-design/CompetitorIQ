import { getPrismaClient } from '../config/database.js';

export const alertRepository = {
  async findByOrganization(organizationId, options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const where = { organizationId };

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

    return prisma.alert.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        competitor: true,
        event: {
          include: {
            source: true,
            evidence: true
          }
        }
      }
    });
  },

  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    return prisma.alert.findUnique({
      where: { id },
      include: {
        competitor: true,
        event: {
          include: {
            source: true,
            evidence: true
          }
        }
      }
    });
  },

  async findByEventAndType(organizationId, eventId, type) {
    const prisma = getPrismaClient();
    if (!prisma || !eventId) return null;

    return prisma.alert.findFirst({
      where: {
        organizationId,
        eventId,
        type
      }
    });
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.alert.create({
      data,
      include: {
        competitor: true,
        event: true
      }
    });
  },

  async updateStatus(id, status) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');

    const updateData = { status };
    if (status === 'READ') {
      updateData.readAt = new Date();
    }

    return prisma.alert.update({
      where: { id },
      data: updateData,
      include: {
        competitor: true,
        event: true
      }
    });
  },

  async markAsRead(id) {
    return this.updateStatus(id, 'READ');
  }
};

export default alertRepository;

