import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

export const eventEvidenceRepository = {
  async findByEventId(eventId) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return executeWithDbRetry(() => prisma.eventEvidence.findMany({
      where: { eventId },
      include: { source: true },
      orderBy: { capturedAt: 'desc' }
    }));
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return executeWithDbRetry(() => prisma.eventEvidence.create({ data }));
  }
};

export default eventEvidenceRepository;
