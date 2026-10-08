import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

const executeWithRetry = executeWithDbRetry;

export const conversationRepository = {
  async createConversation(data) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return executeWithRetry(async () => {
      if (data.organizationId) {
        await prisma.organization.upsert({
          where: { id: data.organizationId },
          update: {},
          create: { id: data.organizationId, name: 'Default Organization', planTier: 'FREE' }
        }).catch(() => {});
      }
      return prisma.agentConversation.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId || null,
          title: data.title || 'Competitor Intelligence Session'
        }
      });
    });
  },

  async findConversationById(id, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    const where = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return executeWithRetry(() => prisma.agentConversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    }));
  },

  async findConversationsByOrg(organizationId, limit = 20) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return executeWithRetry(() => prisma.agentConversation.findMany({
      where: { organizationId },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    }));
  },

  async addMessage(data) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    // Create the message and update conversation timestamp
    const message = await executeWithRetry(() => prisma.agentMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
      }
    }));

    await executeWithRetry(() => prisma.agentConversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() }
    })).catch(() => {});

    return message;
  }
};

export default conversationRepository;

