import { getPrismaClient } from '../server/config/database.js';
import { competitiveComparisonService } from '../server/services/competitiveComparisonService.js';

async function testCanonicalComparison() {
  console.log('[CANONICAL COMPARISON TEST START]');
  const canonicalIds = [
    'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', // AWS
    'f131a513-f939-44eb-a830-1bfaf56ed35f', // Google Cloud
    'd61ea60c-312c-457d-960b-a063ab75321d', // IBM
    '9985d6a4-3012-494d-bea4-bb12bc2eb500'  // Microsoft
  ];

  console.log('[COMPARE] Testing for AWS, Google Cloud, IBM, Microsoft...');
  const t0 = Date.now();
  const res = await competitiveComparisonService.compareCompetitors({
    organizationId: 'default-org',
    competitorIds: canonicalIds,
    windowDays: 90
  });
  const duration = Date.now() - t0;
  console.log(`[COMPARE DONE] Total duration: ${duration}ms`);
  console.log(`[COMPARE RESULT] Success: ${res.success}, Competitor count: ${res.competitors?.length}`);
  if (res.competitors) {
    for (const c of res.competitors) {
      console.log(`  - ${c.competitor.name} (${c.competitor.id}): totalEvents=${c.metrics?.totalEvents}, hasSufficientEvidence=${c.hasSufficientEvidence}`);
    }
  }
}

testCanonicalComparison().then(() => process.exit(0)).catch(err => {
  console.error('[COMPARE DIAGNOSTIC ERROR]', err);
  process.exit(1);
});
