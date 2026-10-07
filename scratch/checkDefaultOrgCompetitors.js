import { getPrismaClient } from '../server/config/database.js';

async function checkDefaultOrg() {
  const prisma = getPrismaClient();

  const competitors = await prisma.competitor.findMany({
    where: { organizationId: 'default-org' },
    include: {
      _count: {
        select: { events: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('--- DEFAULT-ORG COMPETITORS ---');
  for (const c of competitors) {
    console.log(`ID: ${c.id} | Name: ${c.name} | Slug: ${c.slug} | Events: ${c._count.events}`);
  }
}

checkDefaultOrg().then(() => process.exit(0)).catch(console.error);
