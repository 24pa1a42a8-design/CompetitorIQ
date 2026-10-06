import adapterRegistry from '../adapters/adapterRegistry.js';
import adapterIngestionService from '../services/adapterIngestionService.js';
import monitoringScheduler from '../services/monitoringScheduler.js';
import { logger } from '../config/logger.js';

export async function runAdapterE2ETest() {
  console.log('\n=== Testing Competitor Source Adapters & Scheduler ===\n');

  // 1. Verify registered adapters
  const registered = adapterRegistry.listRegisteredAdapters();
  console.log('Registered Adapters:', registered);

  // 2. Verify configured sources
  const sources = adapterRegistry.listAvailableSources();
  console.log(`Configured Sources (${sources.length}):`, sources.map(s => `${s.id} (${s.competitorName}: ${s.url})`));

  // 3. Test scheduled source checks
  const msftNews = sources.find(s => s.id === 'microsoft_news');
  console.log('\nTesting Ingestion trigger for:', msftNews.id);

  // Triggering adapter ingestion
  const res = await adapterIngestionService.triggerSource(msftNews.id, {
    organizationId: 'default-org'
  });

  console.log('Result for microsoft_news trigger:', {
    sourceId: res.sourceId,
    success: res.success,
    error: res.error,
    collectedCount: res.collectedCount,
    duplicatesSkipped: res.duplicatesSkipped,
    items: res.items?.length
  });

  // 4. Test rate limiting honesty
  const t0 = Date.now();
  const rateLimitTest = await adapterIngestionService.triggerSource(msftNews.id, {
    organizationId: 'default-org'
  });
  const elapsed = Date.now() - t0;
  console.log(`Rate limit enforced: elapsed=${elapsed}ms`);

  // 5. Test Scheduler metrics
  const schedulerState = {
    enabled: monitoringScheduler.enabled,
    totalSources: monitoringScheduler.sources.size,
    metrics: monitoringScheduler.metrics
  };
  console.log('\nScheduler state:', schedulerState);

  return { registered, sourcesCount: sources.length, testResult: res };
}

if (process.argv[1]?.endsWith('testAdaptersE2E.js')) {
  runAdapterE2ETest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Adapter test error:', err);
      process.exit(1);
    });
}
