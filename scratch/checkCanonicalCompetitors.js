import { getPrismaClient } from '../server/config/database.js';

async function checkCanonical() {
  const prisma = getPrismaClient();

  const competitors = await prisma.competitor.findMany({
    include: {
      _count: {
        select: { events: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('--- ALL COMPETITORS AND EVENT COUNTS ---');
  for (const c of competitors) {
    if (c._count.events > 0) {
      console.log(`[CANONICAL WITH DATA] ID: ${c.id} | Name: ${c.name} | Slug: ${c.slug} | OrgId: ${c.organizationId} | Events: ${c._count.events}`);
    } else {
      console.log(`[EMPTY] ID: ${c.id} | Name: ${c.name} | Slug: ${c.slug} | OrgId: ${c.organizationId} | Events: 0`);
    }
  }
}

checkCanonical().then(() => process.exit(0)).catch(console.error);
