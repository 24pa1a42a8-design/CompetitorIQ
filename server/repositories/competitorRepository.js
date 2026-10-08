import { getPrismaClient, executeWithDbRetry } from '../config/database.js';

const executeWithRetry = executeWithDbRetry;

export const competitorRepository = {
  async findById(id, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    const where = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return executeWithRetry(() => prisma.competitor.findFirst({
      where,
      include: {
        events: { take: 10, orderBy: { eventDate: 'desc' } }
      }
    }));
  },

  async findBySlug(organizationId, slug) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return executeWithRetry(() => prisma.competitor.findUnique({
      where: {
        organizationId_slug: { organizationId, slug }
      }
    }));
  },

  async findAllByOrganization(organizationId) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    let competitors = await executeWithRetry(() => prisma.competitor.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    }));

    // Deduplicate by trimmed, lowercased competitor name to prevent UI dropdown duplicates
    const uniqueMap = new Map();
    for (const c of competitors) {
      const key = c.name.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      } else {
        const existing = uniqueMap.get(key);
        if (existing.slug === 'general-competitor' && c.slug !== 'general-competitor') {
          uniqueMap.set(key, c);
        }
      }
    }
    competitors = Array.from(uniqueMap.values());

    if (organizationId === 'default-org' && competitors.length < 4) {
      const defaultComps = [
        { name: 'AWS', slug: 'aws', website: 'https://aws.amazon.com', industry: 'Cloud Infrastructure & Bedrock AI' },
        { name: 'Oracle', slug: 'oracle', website: 'https://oracle.com', industry: 'Enterprise Cloud & Autonomous DB' },
        { name: 'IBM', slug: 'ibm', website: 'https://ibm.com', industry: 'watsonx AI & Hybrid Cloud' },
        { name: 'Salesforce', slug: 'salesforce', website: 'https://salesforce.com', industry: 'CRM & Autonomous Agents' }
      ];
      for (const comp of defaultComps) {
        if (!competitors.some(c => c.name.toLowerCase() === comp.name.toLowerCase())) {
          try {
            const created = await prisma.competitor.create({
              data: {
                organizationId,
                name: comp.name,
                slug: comp.slug,
                website: comp.website,
                industry: comp.industry,
                status: 'ACTIVE'
              }
            });
            competitors.push(created);
          } catch (e) {
            // ignore if duplicate
          }
        }
      }
      competitors.sort((a, b) => a.name.localeCompare(b.name));
    }

    return competitors;
  },

  async create(data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.competitor.create({ data });
  },

  async update(id, data, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    if (organizationId) {
      const existing = await this.findById(id, organizationId);
      if (!existing) throw new Error('Competitor not found or access denied.');
    }
    return executeWithRetry(() => prisma.competitor.update({
      where: { id },
      data
    }));
  },

  async delete(id, organizationId = null) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    if (organizationId) {
      const existing = await this.findById(id, organizationId);
      if (!existing) throw new Error('Competitor not found or access denied.');
    }
    return executeWithRetry(() => prisma.competitor.delete({ where: { id } }));
  }
};

export default competitorRepository;
