import adapterRegistry from '../adapters/adapterRegistry.js';
import ingestionService from './ingestionService.js';
import { logger } from '../config/logger.js';

export const adapterIngestionService = {
  async triggerSource(sourceIdOrConfig, options = {}) {
    let sourceConfig;
    if (typeof sourceIdOrConfig === 'string') {
      sourceConfig = adapterRegistry.getSourceConfig(sourceIdOrConfig);
      if (!sourceConfig) {
        throw new Error(`Unknown source configuration ID: '${sourceIdOrConfig}'`);
      }
    } else if (typeof sourceIdOrConfig === 'object' && sourceIdOrConfig.url) {
      sourceConfig = sourceIdOrConfig;
    } else {
      throw new Error('Valid source ID or source configuration object with URL is required.');
    }

    const adapterType = sourceConfig.adapterType || 'news_press';
    const adapter = adapterRegistry.getAdapter(adapterType);

    if (!adapter) {
      throw new Error(`No registered source adapter found for adapterType: '${adapterType}'`);
    }

    const orgId = options.organizationId || 'default-org';
    logger.info({ sourceId: sourceConfig.id, adapterType, url: sourceConfig.url }, 'Triggering automated source adapter ingestion');

    // 1. Fetch & Parse using Source Adapter
    const collectResult = await adapter.collect(sourceConfig, options);

    if (!collectResult.success || !collectResult.items || collectResult.items.length === 0) {
      return {
        success: collectResult.success,
        sourceId: sourceConfig.id || 'custom_source',
        adapterType,
        url: sourceConfig.url,
        count: 0,
        ingestionBatch: null,
        error: collectResult.error || 'No items extracted from source'
      };
    }

    // 2. Pass extracted signals to existing ingestion pipeline (processBatch)
    const batchResult = await ingestionService.processBatch(collectResult.items, {
      organizationId: orgId
    });

    return {
      success: true,
      sourceId: sourceConfig.id || 'custom_source',
      adapterType,
      url: sourceConfig.url,
      collectedCount: collectResult.items.length,
      ingestedCount: batchResult.processed,
      duplicatesSkipped: batchResult.duplicatesSkipped,
      ingestionBatch: batchResult
    };
  }
};

export default adapterIngestionService;
