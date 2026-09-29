import { getPrismaClient } from '../config/database.js';

export const sourceRepository = {
  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.source.findUnique({ where: { id } });
  },

  async findByUrl(organizationId, url) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.source.findUnique({
      where: {
        organizationId_url: { organizationId, url }
      }
    });
  },

  async upsertSource(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.source.upsert({
      where: {
        organizationId_url: {
          organizationId: data.organizationId,
          url: data.url
        }
      },
      update: {
        title: data.title,
        contentHash: data.contentHash,
        collectedAt: new Date()
      },
      create: data
    });
  }
};

export default sourceRepository;
