const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANONICAL_AWS_ID = 'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10';
const DUP_AWS_IDS = [
  '930b351d-9b09-4634-89e0-bb37f0d4c601',
  'f8cca828-c32e-4093-8fbf-92a2664b25a6'
];

async function main() {
  console.log('=== CONSOLIDATING AWS COMPETITOR RECORDS IN POSTGRESQL ===\n');

  // Verify canonical AWS exists
  const canonicalAws = await prisma.competitor.findUnique({
    where: { id: CANONICAL_AWS_ID }
  });
  if (!canonicalAws) {
    throw new Error(`Canonical AWS record ${CANONICAL_AWS_ID} not found!`);
  }
  console.log(`Canonical AWS: ID ${canonicalAws.id} | Name: "${canonicalAws.name}" | Slug: "${canonicalAws.slug}"`);

  for (const dupId of DUP_AWS_IDS) {
    const dup = await prisma.competitor.findUnique({ where: { id: dupId } });
    if (!dup) {
      console.log(`Duplicate record ${dupId} already removed or does not exist.`);
      continue;
    }
    console.log(`\nProcessing duplicate record: ID ${dup.id} | Name: "${dup.name}" | Slug: "${dup.slug}"`);

    // 1. Re-link Analysis records
    const analysisRes = await prisma.analysis.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${analysisRes.count} Analysis records to canonical AWS.`);

    // 2. Re-link CompetitorEvent records
    const eventRes = await prisma.competitorEvent.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${eventRes.count} CompetitorEvent records to canonical AWS.`);

    // 3. Re-link Signals
    const pricingRes = await prisma.pricingSignal.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${pricingRes.count} PricingSignal records to canonical AWS.`);

    const productRes = await prisma.productSignal.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${productRes.count} ProductSignal records to canonical AWS.`);

    const hiringRes = await prisma.hiringSignal.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${hiringRes.count} HiringSignal records to canonical AWS.`);

    const messagingRes = await prisma.messagingSignal.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${messagingRes.count} MessagingSignal records to canonical AWS.`);

    const fundingRes = await prisma.fundingSignal.updateMany({
      where: { competitorId: dup.id },
      data: { competitorId: CANONICAL_AWS_ID }
    });
    console.log(`  - Updated ${fundingRes.count} FundingSignal records to canonical AWS.`);

    // 4. Re-link MemoryOperation
    try {
      const memoryRes = await prisma.memoryOperation.updateMany({
        where: { competitorId: dup.id },
        data: { competitorId: CANONICAL_AWS_ID }
      });
      console.log(`  - Updated ${memoryRes.count} MemoryOperation records to canonical AWS.`);
    } catch (e) {
      console.log('  - MemoryOperation table not present or skipped:', e.message);
    }

    // Safely delete duplicate competitor row
    await prisma.competitor.delete({
      where: { id: dup.id }
    });
    console.log(`  - SAFELY DELETED duplicate competitor record ${dup.id}.`);
  }

  // Also clean up any orphan/duplicate BigQuery records if they have 0 events/analyses
  const bigqueryDups = await prisma.competitor.findMany({
    where: { name: 'BigQuery' }
  });
  console.log(`\nFound ${bigqueryDups.length} BigQuery records.`);
  if (bigqueryDups.length > 1) {
    const keepBigquery = bigqueryDups[0];
    for (let i = 1; i < bigqueryDups.length; i++) {
      const dupBq = bigqueryDups[i];
      const events = await prisma.competitorEvent.count({ where: { competitorId: dupBq.id } });
      const analyses = await prisma.analysis.count({ where: { competitorId: dupBq.id } });
      if (events === 0 && analyses === 0) {
        await prisma.competitor.delete({ where: { id: dupBq.id } });
      }
    }
    console.log('Cleaned up extra BigQuery records.');
  }

  // Final count of competitors in DB
  const finalCompetitors = await prisma.competitor.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('\n=== FINAL COMPETITORS IN DATABASE ===');
  for (const c of finalCompetitors) {
    const events = await prisma.competitorEvent.count({ where: { competitorId: c.id } });
    const analyses = await prisma.analysis.count({ where: { competitorId: c.id } });
    console.log(`- ID: ${c.id} | Name: "${c.name}" | Slug: "${c.slug}" | Events: ${events} | Analyses: ${analyses}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
