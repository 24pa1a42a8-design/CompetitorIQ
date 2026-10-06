import { getPrismaClient } from '../config/database.js';

export const signalRepository = {
  async createPricingSignal(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.pricingSignal.create({
      data: {
        eventId: data.eventId || null,
        competitorId: data.competitorId,
        previousPrice: data.previousPrice !== undefined && data.previousPrice !== null ? data.previousPrice : null,
        newPrice: data.newPrice,
        currency: data.currency || 'USD',
        billingPeriod: data.billingPeriod || 'MONTHLY',
        tierName: data.tierName || 'Standard',
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date()
      }
    });
  },

  async createProductSignal(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.productSignal.create({
      data: {
        eventId: data.eventId || null,
        competitorId: data.competitorId,
        productName: data.productName,
        featureName: data.featureName || null,
        signalType: data.signalType || 'NEW_FEATURE',
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date()
      }
    });
  },

  async createHiringSignal(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.hiringSignal.create({
      data: {
        eventId: data.eventId || null,
        competitorId: data.competitorId,
        role: data.role,
        department: data.department || null,
        location: data.location || null,
        detectedCount: Number.isInteger(data.detectedCount) ? data.detectedCount : 1
      }
    });
  },

  async createMessagingSignal(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.messagingSignal.create({
      data: {
        eventId: data.eventId || null,
        competitorId: data.competitorId,
        messageTheme: data.messageTheme || 'Strategy',
        previousMessaging: data.previousMessaging || null,
        newMessaging: data.newMessaging
      }
    });
  },

  async createFundingSignal(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.fundingSignal.create({
      data: {
        eventId: data.eventId || null,
        competitorId: data.competitorId,
        fundingType: data.fundingType || 'INVESTMENT',
        amount: data.amount,
        currency: data.currency || 'USD',
        announcedDate: data.announcedDate ? new Date(data.announcedDate) : new Date()
      }
    });
  },

  async getSignalsByCompetitor(competitorId) {
    const prisma = getPrismaClient();
    if (!prisma) return { pricing: [], product: [], hiring: [], messaging: [], funding: [] };
    const [pricing, product, hiring, messaging, funding] = await Promise.all([
      prisma.pricingSignal.findMany({ where: { competitorId }, orderBy: { effectiveDate: 'desc' } }),
      prisma.productSignal.findMany({ where: { competitorId }, orderBy: { effectiveDate: 'desc' } }),
      prisma.hiringSignal.findMany({ where: { competitorId }, orderBy: { createdAt: 'desc' } }),
      prisma.messagingSignal.findMany({ where: { competitorId }, orderBy: { createdAt: 'desc' } }),
      prisma.fundingSignal.findMany({ where: { competitorId }, orderBy: { announcedDate: 'desc' } })
    ]);
    return { pricing, product, hiring, messaging, funding };
  }
};

export default signalRepository;
