import { getPrismaClient } from '../config/database.js';

export const competitorRepository = {
  async findById(id) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.competitor.findUnique({
      where: { id },
      include: {
        events: { take: 10, orderBy: { eventDate: 'desc' } }
      }
    });
  },

  async findBySlug(organizationId, slug) {
    const prisma = getPrismaClient();
    if (!prisma) return null;
    return prisma.competitor.findUnique({
      where: {
        organizationId_slug: { organizationId, slug }
      }
    });
  },

  async findAllByOrganization(organizationId) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    let competitors = await prisma.competitor.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });

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

  async update(id, data) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.competitor.update({
      where: { id },
      data
    });
  },

  async delete(id) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database is not configured.');
    return prisma.competitor.delete({ where: { id } });
  }
};

export default competitorRepository;
