import { getPrismaClient } from '../config/database.js';

export const conversationRepository = {
  async createConversation(data) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.agentConversation.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId || null,
        title: data.title || 'Competitor Intelligence Session'
      }
    });
  },

  async findConversationById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.agentConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  },

  async findConversationsByOrg(organizationId, limit = 20) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return prisma.agentConversation.findMany({
      where: { organizationId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async addMessage(data) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    // Create the message and update conversation timestamp
    const message = await prisma.agentMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
      }
    });

    await prisma.agentConversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() }
    }).catch(() => {});

    return message;
  }
};

export default conversationRepository;
