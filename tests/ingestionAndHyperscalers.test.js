import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateSourceUrl } from '../server/adapters/ssrfValidator.js';
import { classifyEvent } from '../server/ingestion/classifier.js';
import { normalizeIngestionItem, generateContentHash } from '../server/ingestion/normalizer.js';
import { isDuplicateEvent } from '../server/ingestion/deduplicator.js';
import { ingestionService } from '../server/services/ingestionService.js';
import { adapterRegistry } from '../server/adapters/adapterRegistry.js';
import { SOURCE_CONFIGS } from '../server/config/sourcesConfig.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Phase 5: Microsoft & Hyperscaler Ecosystem Ingestion Tests', () => {
  const testOrgId = `test-ingest-org-${Date.now()}`;
  let competitorId = null;
  let sourceId = null;
  let seededEventIds = [];

  before(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // Create Test Org
    await prisma.organization.create({
      data: {
        id: testOrgId,
        name: 'Hyperscaler Ingestion Test Org',
        planTier: 'ENTERPRISE'
      }
    });

    // Create Test Competitor
    const comp = await prisma.competitor.create({
      data: {
        organizationId: testOrgId,
        name: 'AWS',
        slug: `aws-${Date.now()}`,
        website: 'https://aws.amazon.com',
        industry: 'Cloud Infrastructure'
      }
    });
    competitorId = comp.id;

    // Create Test Source
    const source = await prisma.source.create({
      data: {
        organizationId: testOrgId,
        title: 'AWS News Blog',
        url: 'https://aws.amazon.com/blogs/aws/feed/',
        publisher: 'AWS',
        sourceType: 'BLOG'
      }
    });
    sourceId = source.id;
  });

  after(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // Clean up created test data
    if (seededEventIds.length > 0) {
      await prisma.eventEvidence.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.productSignal.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.pricingSignal.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.competitorEvent.deleteMany({ where: { id: { in: seededEventIds } } }).catch(() => {});
    }

    await prisma.source.deleteMany({ where: { organizationId: testOrgId } }).catch(() => {});
    await prisma.competitor.deleteMany({ where: { organizationId: testOrgId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: testOrgId } }).catch(() => {});
  });

  describe('1. SSRF Security Defense (INGEST-03)', () => {
    it('strictly blocks private IPv4 loopback (127.0.0.1)', () => {
      assert.throws(() => {
        validateSourceUrl('http://127.0.0.1/admin');
      }, /SSRF Defense|prohibited|private/i);
    });

    it('strictly blocks cloud metadata endpoints (169.254.169.254)', () => {
      assert.throws(() => {
        validateSourceUrl('http://169.254.169.254/latest/meta-data');
      }, /SSRF Defense|prohibited|private/i);
    });

    it('strictly blocks local network IP addresses (10.0.0.1, 192.168.1.1)', () => {
      assert.throws(() => {
        validateSourceUrl('http://10.0.0.1/internal');
      }, /SSRF Defense|prohibited|private/i);

      assert.throws(() => {
        validateSourceUrl('http://192.168.1.1/router');
      }, /SSRF Defense|prohibited|private/i);
    });

    it('blocks unpermitted protocols (file://, ftp://)', () => {
      assert.throws(() => {
        validateSourceUrl('file:///etc/passwd');
      }, /protocol|http/i);
    });

    it('permits official hyperscaler public URLs (Microsoft, AWS, GCP, Oracle, Salesforce, IBM)', () => {
      const msRes = validateSourceUrl('https://news.microsoft.com/feed/');
      assert.strictEqual(msRes.valid, true);

      const awsRes = validateSourceUrl('https://aws.amazon.com/pricing/');
      assert.strictEqual(awsRes.valid, true);

      const gcpRes = validateSourceUrl('https://cloud.google.com/blog');
      assert.strictEqual(gcpRes.valid, true);

      const oraRes = validateSourceUrl('https://www.oracle.com/news/announcement/');
      assert.strictEqual(oraRes.valid, true);

      const sfRes = validateSourceUrl('https://www.salesforce.com/news/feed/');
      assert.strictEqual(sfRes.valid, true);

      const ibmRes = validateSourceUrl('https://newsroom.ibm.com/announcements');
      assert.strictEqual(ibmRes.valid, true);
    });
  });

  describe('2. 5-Taxonomy Signal Classification (INGEST-02)', () => {
    it('classifies PRODUCT launches and releases', () => {
      const type = classifyEvent('Microsoft Copilot Studio Launches Autonomous AI Agents for Enterprise Workflows', 'General availability of autonomous agents');
      assert.strictEqual(type, 'PRODUCT');
    });

    it('classifies PRICING changes and subscription models', () => {
      const type = classifyEvent('Microsoft 365 Copilot Commercial Pricing Established at $30 Per User Per Month', 'Commercial licensing add-on for enterprise');
      assert.strictEqual(type, 'PRICING');
    });

    it('classifies PARTNERSHIP alliances and multi-cloud deals', () => {
      const type = classifyEvent('Oracle Database@Azure Expands to Multiple Global Regions', 'Oracle and Microsoft expand multi-cloud agreement');
      assert.strictEqual(type, 'PARTNERSHIP');
    });

    it('classifies HIRING surges and recruitment talent spikes', () => {
      const type = classifyEvent('AWS Annapurna Labs Recruits 55+ Silicon Validation Engineers', 'Hiring engineers for Trainium2 chip clusters');
      assert.strictEqual(type, 'HIRING');
    });

    it('classifies LEADERSHIP C-suite shifts and executive appointments', () => {
      const type = classifyEvent('Matt Garman Appointed as Chief Executive Officer of Amazon Web Services', 'Executive transition and new CEO appointment');
      assert.strictEqual(type, 'LEADERSHIP');
    });
  });

  describe('3. Content-Hash SHA-256 Deduplication (INGEST-03)', () => {
    it('generates deterministic SHA-256 content hashes', () => {
      const hash1 = generateContentHash('aws', 'AWS Bedrock Release', 'Summary text', '2024-05-01');
      const hash2 = generateContentHash('aws', 'AWS Bedrock Release', 'Summary text', '2024-05-01');
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
    });

    it('flags identical events as duplicates upon re-ingestion', async () => {
      const rawEvent = {
        competitorId,
        competitorName: 'AWS',
        title: 'AWS Announces Amazon EC2 Trn2 Instances',
        summary: 'AWS announced new Amazon EC2 Trn2 instances powered by Trainium2 accelerators.',
        description: 'Deep technical release detailing second-generation Trainium2 chips.',
        eventType: 'PRODUCT',
        eventDate: new Date().toISOString(),
        sourceUrl: 'https://aws.amazon.com/about-aws/whats-new/trn2',
        publisher: 'AWS Whats New',
        importance: 'HIGH',
        confidence: 0.95
      };

      // First ingestion
      const result1 = await ingestionService.ingestEvent(rawEvent, { organizationId: testOrgId, sourceId });
      assert.strictEqual(result1.success, true);
      assert.ok(result1.eventId);
      seededEventIds.push(result1.eventId);

      // Duplicate ingestion
      const result2 = await ingestionService.ingestEvent(rawEvent, { organizationId: testOrgId, sourceId });
      assert.strictEqual(result2.isDuplicate, true);
      assert.ok(result2.reason);
    });
  });

  describe('4. Hyperscaler Ecosystem & Hybrid Adapter Collection (INGEST-01, D-20)', () => {
    it('registers source configurations for Microsoft and all 5 hyperscalers', () => {
      assert.ok(SOURCE_CONFIGS.microsoft_news);
      assert.ok(SOURCE_CONFIGS.aws_news_blog);
      assert.ok(SOURCE_CONFIGS.google_cloud_blog);
      assert.ok(SOURCE_CONFIGS.oracle_cloud_feed);
      assert.ok(SOURCE_CONFIGS.ibm_announcements);
      assert.ok(SOURCE_CONFIGS.salesforce_news);
    });

    it('collects items using hybrid fallback strategy when live endpoints are restricted', async () => {
      const adapter = adapterRegistry.getAdapter('news_press');
      assert.ok(adapter, 'Expected news_press adapter');

      const result = await adapter.collect(SOURCE_CONFIGS.aws_news_blog);
      assert.strictEqual(result.success, true);
      assert.ok(result.items.length > 0, 'Expected collected items');
      assert.strictEqual(result.items[0].competitorName, 'AWS');
    });
  });
});
