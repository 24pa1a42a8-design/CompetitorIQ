import { test, describe } from 'node:test';
import assert from 'node:assert';
import { classifyEvent } from '../server/ingestion/classifier.js';
import { normalizeIngestionItem, generateContentHash } from '../server/ingestion/normalizer.js';
import { isDuplicateEvent, recordEventHash } from '../server/ingestion/deduplicator.js';
import ingestionService from '../server/services/ingestionService.js';

describe('Competitive Intelligence Ingestion Pipeline Unit Tests', () => {

  test('1. Classification rules correctly map keywords to EventType categories', () => {
    assert.strictEqual(classifyEvent('Oracle updates OCI pricing model', 'New usage-based billing'), 'PRICING');
    assert.strictEqual(classifyEvent('AWS Bedrock launch v2', 'General availability of Bedrock agent API'), 'PRODUCT');
    assert.strictEqual(classifyEvent('Salesforce Agentforce feature update', 'New studio feature'), 'FEATURE');
    assert.strictEqual(classifyEvent('IBM repositions watsonx tagline', 'New enterprise AI positioning campaign'), 'MESSAGING');
    assert.strictEqual(classifyEvent('Oracle hiring 200 engineers in APAC', 'Openings in Singapore'), 'HIRING');
    assert.strictEqual(classifyEvent('Startup raises $50M Series B funding', 'Venture round valuation'), 'FUNDING');
    assert.strictEqual(classifyEvent('AWS and Oracle announce multi-cloud partnership', 'Strategic alliance'), 'PARTNERSHIP');
    assert.strictEqual(classifyEvent('New CEO appointed at TechCorp', 'Executive leadership shift'), 'LEADERSHIP');
    assert.strictEqual(classifyEvent('Data center expansion in EMEA', 'New regional infrastructure'), 'EXPANSION');
  });

  test('2. Normalizer generates deterministic content hashes and sanitizes fields', () => {
    const raw = {
      competitorName: 'Oracle',
      title: '<b>Oracle Launch 23ai</b>',
      summary: 'Oracle announced OCI Autonomous Database 23ai.',
      sourceUrl: 'https://oracle.com/news/23ai',
      eventDate: '2026-09-20T10:00:00.000Z'
    };

    const norm1 = normalizeIngestionItem(raw);
    const norm2 = normalizeIngestionItem(raw);

    assert.strictEqual(norm1.title, 'Oracle Launch 23ai');
    assert.strictEqual(norm1.eventType, 'PRODUCT');
    assert.strictEqual(norm1.contentHash, norm2.contentHash);
    assert.ok(norm1.contentHash.length > 10);
  });

  test('3. Deduplicator identifies matching content hashes', async () => {
    const hash = generateContentHash('oracle', 'Title A', 'Summary A', '2026-09-20');
    recordEventHash(hash);

    const check = await isDuplicateEvent({
      competitorId: 'oracle',
      contentHash: hash,
      sourceUrl: 'https://example.com/a',
      eventDate: new Date('2026-09-20')
    });

    assert.strictEqual(check.isDuplicate, true);
    assert.strictEqual(check.reason, 'HASH_MATCH_LOCAL_CACHE');
  });

  test('4. Ingestion service processes single item and handles Hindsight fallback safely', async () => {
    const fixtureItem = {
      competitorName: 'Oracle',
      eventType: 'PRODUCT',
      title: `OCI Database 23ai Release ${Date.now()}`,
      summary: 'Oracle announced Autonomous Database 23ai multi-cloud features.',
      source: 'Official Press Release',
      sourceUrl: `https://oracle.com/news/23ai-${Date.now()}`
    };

    const result = await ingestionService.processItem(fixtureItem, { organizationId: 'test-org' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isDuplicate, false);
    assert.strictEqual(result.competitorName, 'Oracle');
    assert.strictEqual(result.eventType, 'PRODUCT');
    assert.strictEqual(typeof result.hindsightRetained, 'boolean');
  });

  test('5. Ingestion service batch processing executes deduplication and tracking', async () => {
    const timestamp = Date.now();
    const batchItems = [
      {
        competitorName: 'IBM',
        eventType: 'PRODUCT',
        title: `watsonx Granite 3.0 Release ${timestamp}`,
        summary: 'IBM announced Granite 3.0 enterprise models.',
        sourceUrl: `https://ibm.com/news/granite-${timestamp}`
      },
      {
        competitorName: 'IBM',
        eventType: 'PRODUCT',
        title: `watsonx Granite 3.0 Release ${timestamp}`,
        summary: 'IBM announced Granite 3.0 enterprise models.',
        sourceUrl: `https://ibm.com/news/granite-${timestamp}`
      }
    ];

    const batchResult = await ingestionService.processBatch(batchItems, { organizationId: 'test-org' });

    assert.strictEqual(batchResult.total, 2);
    assert.strictEqual(batchResult.processed, 2);
    assert.strictEqual(batchResult.duplicatesSkipped, 1);
  });
});
