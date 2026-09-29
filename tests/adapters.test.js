import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateSourceUrl } from '../server/adapters/ssrfValidator.js';
import { parseSourceContent } from '../server/adapters/htmlParser.js';
import { NewsPressAdapter } from '../server/adapters/newsPressAdapter.js';
import { ProductReleaseAdapter } from '../server/adapters/productReleaseAdapter.js';
import { PricingPageAdapter } from '../server/adapters/pricingPageAdapter.js';
import { CareersHiringAdapter } from '../server/adapters/careersHiringAdapter.js';
import adapterRegistry from '../server/adapters/adapterRegistry.js';
import adapterIngestionService from '../server/services/adapterIngestionService.js';

describe('Automated Competitive Intelligence Source Adapters Unit Tests', () => {

  const fixtureHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Oracle Launches OCI Autonomous Database 23ai</title>
        <meta name="description" content="Oracle announced general availability of OCI Autonomous Database 23ai with AI vector search." />
        <meta property="article:published_time" content="2026-09-20T10:00:00Z" />
      </head>
      <body>
        <h1>Oracle Launches OCI Autonomous Database 23ai</h1>
        <p>Oracle today announced the release of OCI 23ai for enterprise cloud workloads.</p>
        <article>
          <h2>Oracle Cloud Price Drop</h2>
          <p>Oracle reduced pricing tier by 15% for usage-based credits.</p>
        </article>
      </body>
    </html>
  `;

  test('1. SSRF Validator blocks private IPs and unauthorized domains', () => {
    // Valid URL
    const valid = validateSourceUrl('https://oracle.com/news/press');
    assert.strictEqual(valid.valid, true);

    // Loopback IP (127.0.0.1)
    assert.throws(() => {
      validateSourceUrl('http://127.0.0.1:5000/internal');
    }, /SSRF Defense/);

    // AWS Metadata IP (169.254.169.254)
    assert.throws(() => {
      validateSourceUrl('http://169.254.169.254/latest/meta-data/');
    }, /SSRF Defense/);

    // Non-whitelisted domain
    assert.throws(() => {
      validateSourceUrl('https://untrusted-unknown-domain.com/malicious');
    }, /Domain Restriction/);
  });

  test('2. HTML Parser extracts title, summary, date, and evidence excerpt', () => {
    const parsed = parseSourceContent(fixtureHtml, { sourceUrl: 'https://oracle.com/news/press' });
    assert.strictEqual(parsed.title, 'Oracle Launches OCI Autonomous Database 23ai');
    assert.ok(parsed.summary.includes('OCI Autonomous Database 23ai'));
    assert.ok(parsed.evidence.length > 10);
    assert.ok(Array.isArray(parsed.items));
  });

  test('3. Source Adapters convert fixtures into raw intelligence items', async () => {
    const adapter = new ProductReleaseAdapter();
    const result = await adapter.collect({
      id: 'oracle_test',
      competitorName: 'Oracle',
      url: 'https://oracle.com/news/press',
      publisher: 'Oracle Newsroom'
    }, { mockContent: fixtureHtml });

    assert.strictEqual(result.success, true);
    assert.ok(result.items.length > 0);
    assert.strictEqual(result.items[0].competitorName, 'Oracle');
    assert.strictEqual(result.items[0].eventType, 'PRODUCT');
  });

  test('4. Adapter Registry contains default configured source types', () => {
    const types = adapterRegistry.listRegisteredAdapters();
    assert.ok(types.includes('news_press'));
    assert.ok(types.includes('product_release'));
    assert.ok(types.includes('pricing_page'));
    assert.ok(types.includes('careers_hiring'));
  });

  test('5. Adapter Ingestion Service passes items to processBatch pipeline', async () => {
    const sourceConfig = {
      id: 'oracle_press_fixture',
      competitorName: 'Oracle',
      adapterType: 'product_release',
      url: 'https://oracle.com/news/press',
      publisher: 'Oracle Newsroom'
    };

    const timestamp = Date.now();
    const customFixture = fixtureHtml.replace('23ai', `23ai-${timestamp}`);

    const result = await adapterIngestionService.triggerSource(sourceConfig, {
      organizationId: 'adapter-test-org',
      mockContent: customFixture
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.collectedCount > 0);
    assert.ok(result.ingestedCount > 0);
    assert.strictEqual(typeof result.duplicatesSkipped, 'number');
  });

});
