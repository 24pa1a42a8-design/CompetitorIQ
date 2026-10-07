const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consolidate() {
  console.log('=== CONSOLIDATING DUPLICATE COMPETITOR RECORDS ===');

  const orgs = ['default-org', 'microsoft-demo-org', 'test-org'];

  for (const orgId of orgs) {
    const comps = await prisma.competitor.findMany({
      where: { organizationId: orgId }
    });

    const grouped = {};
    comps.forEach(c => {
      const lower = c.name.trim().toLowerCase();
      grouped[lower] = grouped[lower] || [];
      grouped[lower].push(c);
    });

    for (const [name, list] of Object.entries(grouped)) {
      if (list.length > 1) {
        console.log(`\nConsolidating ${list.length} records for "${name}" in ${orgId}...`);
        
        // Pick canonical (prefer slug === name.toLowerCase(), or record with most events)
        let canonical = list.find(c => c.slug === name || c.slug === name.replace(/\s+/g, '-'));
        if (!canonical) canonical = list[0];

        const duplicates = list.filter(c => c.id !== canonical.id);

        for (const dup of duplicates) {
          console.log(`  Merging duplicate ${dup.id} (${dup.slug}) into canonical ${canonical.id} (${canonical.slug})...`);
          
          // Reassign CompetitorEvents
          const evtCount = await prisma.competitorEvent.updateMany({
            where: { competitorId: dup.id },
            data: { competitorId: canonical.id }
          });

          // Reassign Analyses
          const anaCount = await prisma.analysis.updateMany({
            where: { competitorId: dup.id },
            data: { competitorId: canonical.id }
          });

          // Reassign Alerts
          const altCount = await prisma.alert.updateMany({
            where: { competitorId: dup.id },
            data: { competitorId: canonical.id }
          });

          // Reassign Signals
          await prisma.hiringSignal.updateMany({ where: { competitorId: dup.id }, data: { competitorId: canonical.id } });
          await prisma.productSignal.updateMany({ where: { competitorId: dup.id }, data: { competitorId: canonical.id } });
          await prisma.pricingSignal.updateMany({ where: { competitorId: dup.id }, data: { competitorId: canonical.id } });
          await prisma.fundingSignal.updateMany({ where: { competitorId: dup.id }, data: { competitorId: canonical.id } });
          await prisma.messagingSignal.updateMany({ where: { competitorId: dup.id }, data: { competitorId: canonical.id } });

          console.log(`    - Reassigned ${evtCount.count} events, ${anaCount.count} analyses, ${altCount.count} alerts.`);

          // Delete duplicate competitor
          await prisma.competitor.delete({ where: { id: dup.id } });
          console.log(`    - Safely deleted duplicate competitor record ${dup.id}.`);
        }
      }
    }
  }

  console.log('\n=== CONSOLIDATION COMPLETE ===');
  await prisma.$disconnect();
}

consolidate().catch(console.error);
