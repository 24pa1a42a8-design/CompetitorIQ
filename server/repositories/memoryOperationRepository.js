import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

const executeWithRetry = executeWithDbRetry;

export const memoryOperationRepository = {
  async recordStart(data) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return executeWithRetry(() => prisma.memoryOperation.create({
      data: {
        stage: data.stage,
        status: 'RUNNING',
        organizationId: data.organizationId,
        competitorId: data.competitorId,
        eventId: data.eventId,
        requestId: data.requestId,
        query: data.query,
        startedAt: new Date()
      }
    }));
  },

  async recordCompletion(id, details = {}) {
    const prisma = getPrismaClient();
    if (!prisma || !id) return null;
    const completedAt = new Date();
    return executeWithRetry(() => prisma.memoryOperation.update({
      where: { id },
      data: {
        status: details.status || 'COMPLETED',
        completedAt,
        durationMs: details.durationMs,
        memoryCount: details.memoryCount,
        errorCode: details.errorCode,
        metadata: details.metadata
      }
    }));
  },

  async findRecent(options = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return executeWithRetry(() => prisma.memoryOperation.findMany({
      take: options.limit || 10,
      orderBy: { startedAt: 'desc' }
    }));
  }
};

export default memoryOperationRepository;

