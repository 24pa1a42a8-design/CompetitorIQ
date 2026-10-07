import { connectDotsService } from '../server/services/connectDotsService.js';

async function runTest() {
  console.log('\n========================================');
  console.log('CONNECT THE DOTS BACKEND FILTER TEST');
  console.log('========================================\n');

  const all = await connectDotsService.getPatterns('default-org', {});
  console.log('1. ALL PATTERNS Count:', all.length);

  const high = await connectDotsService.getPatterns('default-org', { confidence: 'HIGH' });
  console.log('2. HIGH CONFIDENCE Count:', high.length);
  console.log('   Sample High Confidence Patterns:');
  high.slice(0, 3).forEach(p => console.log(`   - [${p.competitor?.name || 'Comp'}] [${p.patternType}] Conf: ${p.confidence} (${p.confidenceScore}%) | ${p.title}`));

  const pricing = await connectDotsService.getPatterns('default-org', { patternType: 'PRICING_PRODUCT' });
  console.log('3. PRICING -> PRODUCT Count:', pricing.length);
  pricing.slice(0, 5).forEach(p => console.log(`   - [${p.competitor?.name || 'Comp'}] [${p.patternType}] Conf: ${p.confidence} (${p.confidenceScore}%) | ${p.title}`));

  const hiring = await connectDotsService.getPatterns('default-org', { patternType: 'HIRING_PRODUCT' });
  console.log('4. HIRING -> PRODUCT Count:', hiring.length);
  hiring.slice(0, 5).forEach(p => console.log(`   - [${p.competitor?.name || 'Comp'}] [${p.patternType}] Conf: ${p.confidence} (${p.confidenceScore}%) | ${p.title}`));

  const funding = await connectDotsService.getPatterns('default-org', { patternType: 'FUNDING_EXPANSION' });
  console.log('5. FUNDING -> EXPANSION Count:', funding.length);
  funding.slice(0, 5).forEach(p => console.log(`   - [${p.competitor?.name || 'Comp'}] [${p.patternType}] Conf: ${p.confidence} (${p.confidenceScore}%) | ${p.title}`));
}

runTest().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
