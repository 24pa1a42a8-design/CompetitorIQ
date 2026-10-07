const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('=== COMPETITOR DUPLICATE AUDIT ===\n');

  const orgs = ['default-org', 'microsoft-demo-org', 'test-org'];
  
  for (const orgId of orgs) {
    const competitors = await prisma.competitor.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { events: true, analyses: true, alerts: true, hiringSignals: true, productSignals: true, pricingSignals: true, fundingSignals: true }
        }
      }
    });

    console.log(`Org [${orgId}]: Total Competitors = ${competitors.length}`);
    const nameMap = {};
    competitors.forEach(c => {
      const lower = c.name.trim().toLowerCase();
      nameMap[lower] = nameMap[lower] || [];
      nameMap[lower].push(c);
    });

    Object.entries(nameMap).forEach(([name, list]) => {
      if (list.length > 1) {
        console.log(`  ⚠️ DUPLICATE FOUND for "${name}" (${list.length} records):`);
        list.forEach(c => {
          console.log(`    - ID: ${c.id} | Slug: ${c.slug} | Events: ${c._count.events} | Analyses: ${c._count.analyses}`);
        });
      } else {
        console.log(`  ✓ ${list[0].name}: ID=${list[0].id} (Events=${list[0]._count.events}, Analyses=${list[0]._count.analyses})`);
      }
    });
    console.log('');
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
