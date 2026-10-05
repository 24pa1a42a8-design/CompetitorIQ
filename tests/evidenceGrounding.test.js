import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import agentService from '../server/services/agentService.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Phase 2 Pre-Retrieval Evidence & Grounding Pipeline Verification', () => {
  const testOrgA = `test-grounding-org-a-${Date.now()}`;
  const testOrgB = `test-grounding-org-b-${Date.now()}`;
  let competitorAId = null;
  let competitorBId = null;
  let seededEventIds = [];

  before(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // 1. Create Test Organizations
    await prisma.organization.createMany({
      data: [
        { id: testOrgA, name: 'Evidence Test Org A', planTier: 'ENTERPRISE' },
        { id: testOrgB, name: 'Evidence Test Org B', planTier: 'ENTERPRISE' }
      ]
    });

    // 2. Create Competitor for Org A
    const compA = await prisma.competitor.create({
      data: {
        organizationId: testOrgA,
        name: 'AlphaCloud Corp',
        slug: 'alphacloud',
        website: 'https://alphacloud.example.com',
        industry: 'Cloud Computing'
      }
    });
    competitorAId = compA.id;

    // 3. Create Competitor for Org B
    const compB = await prisma.competitor.create({
      data: {
        organizationId: testOrgB,
        name: 'BetaData Systems',
        slug: 'betadata',
        website: 'https://betadata.example.com',
        industry: 'Data Platform'
      }
    });
    competitorBId = compB.id;

    // 4. Seed Source
    const source = await prisma.source.create({
      data: {
        organizationId: testOrgA,
        title: 'AlphaCloud Official Blog',
        url: 'https://alphacloud.example.com/blog/feed',
        publisher: 'AlphaCloud Newsroom',
        sourceType: 'RSS'
      }
    });

    // 5. Seed PRICING Event with Evidence and Signal in Org A
    const pricingEvt = await prisma.competitorEvent.create({
      data: {
        organizationId: testOrgA,
        competitorId: competitorAId,
        sourceId: source.id,
        eventType: 'PRICING',
        title: 'AlphaCloud Cuts Enterprise Compute Prices by 18%',
        summary: 'AlphaCloud announced an immediate 18% price drop on enterprise GPU instances.',
        description: 'Comprehensive discount structure designed to pressure rival hyperscalers.',
        eventDate: new Date('2026-09-15T00:00:00Z'),
        confidence: 0.95,
        importance: 'HIGH',
        contentHash: 'hash-alphacloud-pricing-001',
        evidence: {
          create: [
            {
              sourceId: source.id,
              excerpt: 'Effective October 1st, all AlphaCloud H100 instances will reflect an 18% price reduction.',
              evidenceType: 'PRIMARY_SOURCE'
            }
          ]
        },
        pricingSignals: {
          create: [
            {
              competitorId: competitorAId,
              tierName: 'Enterprise GPU Tier',
              previousPrice: 100.0,
              newPrice: 82.0,
              currency: 'USD',
              billingPeriod: 'HOURLY',
              effectiveDate: new Date('2026-10-01T00:00:00Z')
            }
          ]
        }
      }
    });
    seededEventIds.push(pricingEvt.id);

    // 6. Seed PRODUCT Event with Evidence in Org A
    const productEvt = await prisma.competitorEvent.create({
      data: {
        organizationId: testOrgA,
        competitorId: competitorAId,
        sourceId: source.id,
        eventType: 'PRODUCT',
        title: 'AlphaCloud Launches Multi-Agent Autonomous Orchestrator',
        summary: 'New enterprise workflow orchestration engine competing with Microsoft Copilot Studio.',
        description: 'Production deployment capability across heterogeneous cloud environments.',
        eventDate: new Date('2026-09-20T00:00:00Z'),
        confidence: 0.92,
        importance: 'CRITICAL',
        contentHash: 'hash-alphacloud-product-002',
        evidence: {
          create: [
            {
              sourceId: source.id,
              excerpt: 'The orchestrator allows cross-cloud deployment of autonomous AI agents with unified governance.',
              evidenceType: 'PRIMARY_SOURCE'
            }
          ]
        }
      }
    });
    seededEventIds.push(productEvt.id);

    // 7. Seed HIRING Event with Evidence and Signal in Org A
    const hiringEvt = await prisma.competitorEvent.create({
      data: {
        organizationId: testOrgA,
        competitorId: competitorAId,
        sourceId: source.id,
        eventType: 'HIRING',
        title: 'AlphaCloud Hires 50 AI Infrastructure Engineers',
        summary: 'Aggressive recruitment wave targeting silicon optimization talent.',
        description: 'New semiconductor engineering lab established in Austin.',
        eventDate: new Date('2026-09-25T00:00:00Z'),
        confidence: 0.88,
        importance: 'MEDIUM',
        contentHash: 'hash-alphacloud-hiring-003',
        evidence: {
          create: [
            {
              sourceId: source.id,
              excerpt: 'Fifty senior ASIC and silicon architects hired to accelerate in-house chip design.',
              evidenceType: 'PRIMARY_SOURCE'
            }
          ]
        },
        hiringSignals: {
          create: [
            {
              competitorId: competitorAId,
              role: 'Senior Silicon Architect',
              department: 'Hardware Engineering',
              location: 'Austin, TX',
              detectedCount: 50
            }
          ]
        }
      }
    });
    seededEventIds.push(hiringEvt.id);
  });

  after(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    try {
      await prisma.agentMessage.deleteMany({
        where: { conversation: { organizationId: { in: [testOrgA, testOrgB] } } }
      });
      await prisma.agentConversation.deleteMany({
        where: { organizationId: { in: [testOrgA, testOrgB] } }
      });
      await prisma.eventEvidence.deleteMany({
        where: { eventId: { in: seededEventIds } }
      });
      await prisma.pricingSignal.deleteMany({
        where: { eventId: { in: seededEventIds } }
      });
      await prisma.hiringSignal.deleteMany({
        where: { eventId: { in: seededEventIds } }
      });
      await prisma.competitorEvent.deleteMany({
        where: { id: { in: seededEventIds } }
      });
      await prisma.source.deleteMany({
        where: { organizationId: { in: [testOrgA, testOrgB] } }
      });
      await prisma.competitor.deleteMany({
        where: { organizationId: { in: [testOrgA, testOrgB] } }
      });
      await prisma.organization.deleteMany({
        where: { id: { in: [testOrgA, testOrgB] } }
      });
    } catch {
      // Clean teardown attempt
    }
  });

  describe('1. Strict Fail-Closed Pre-Retrieval Enforcement (D-09)', () => {
    it('returns insufficientEvidence: true with zero fabricated facts for non-existent entities', async () => {
      const result = await agentService.executeQuery('What has NonExistentQuantumStartup999 been doing?', {
        organizationId: testOrgA,
        timeoutMs: 1000
      });

      assert.strictEqual(result.insufficientEvidence, true);
      assert.strictEqual(result.facts.length, 0);
      assert.strictEqual(result.observations.length, 0);
      assert.strictEqual(result.inferences.length, 0);
      assert.strictEqual(result.implications.length, 0);
      assert.ok(result.unknowns.length > 0);
      assert.ok(result.answer.includes('Insufficient evidence'));
      assert.strictEqual(result.evidence.length, 0);
    });

    it('returns insufficientEvidence: true for a known competitor with zero recorded signals in an empty org', async () => {
      const result = await agentService.executeQuery('What has BetaData Systems been doing recently?', {
        organizationId: testOrgB,
        timeoutMs: 1000
      });

      assert.strictEqual(result.insufficientEvidence, true);
      assert.strictEqual(result.facts.length, 0);
      assert.strictEqual(result.observations.length, 0);
      assert.strictEqual(result.inferences.length, 0);
      assert.strictEqual(result.implications.length, 0);
      assert.ok(result.unknowns.some(u => u.includes('BetaData Systems')));
      assert.ok(result.answer.includes('Insufficient evidence'));
      assert.strictEqual(result.evidence.length, 0);
    });

    it('strictly isolates tenant data across organizations', async () => {
      // Querying AlphaCloud under Org B must find 0 events because AlphaCloud was registered under Org A
      const result = await agentService.executeQuery('What has AlphaCloud Corp been doing?', {
        organizationId: testOrgB,
        timeoutMs: 1000
      });

      assert.strictEqual(result.insufficientEvidence, true);
      assert.strictEqual(result.facts.length, 0);
      assert.strictEqual(result.events.length, 0);
      assert.strictEqual(result.evidence.length, 0);
    });
  });

  describe('2. 5-Box Epistemological Claim Classification (D-10)', () => {
    it('populates all 5 epistemological buckets: facts, observations, inferences, implications, unknowns', async () => {
      const result = await agentService.executeQuery('Analyze AlphaCloud moves in pricing, product, and talent', {
        organizationId: testOrgA,
        timeoutMs: 1000 // Test resilience in deterministic mode
      });

      assert.strictEqual(result.insufficientEvidence, false);

      // 1. Facts
      assert.ok(Array.isArray(result.facts), 'facts must be an array');
      assert.ok(result.facts.length >= 3, 'Must contain at least 3 seeded event facts');
      assert.ok(result.facts.some(f => f.includes('AlphaCloud Cuts Enterprise Compute Prices')));
      assert.ok(result.facts.some(f => f.includes('Multi-Agent Autonomous Orchestrator')));
      assert.ok(result.facts.some(f => f.includes('50 role(s) for Senior Silicon Architect')));

      // 2. Observations
      assert.ok(Array.isArray(result.observations), 'observations must be an array');
      assert.ok(result.observations.length > 0, 'Must contain empirical frequency observation');
      assert.ok(result.observations.some(o => o.includes('PRICING') || o.includes('PRODUCT') || o.includes('HIRING')));

      // 3. Inferences
      assert.ok(Array.isArray(result.inferences), 'inferences must be an array');
      assert.ok(result.inferences.length > 0, 'Must contain logical inferences');
      assert.ok(result.inferences.some(i => i.includes('pricing') || i.includes('feature') || i.includes('talent')));

      // 4. Implications (5th Epistemological Bucket)
      assert.ok(Array.isArray(result.implications), 'implications must be an array');
      assert.ok(result.implications.length > 0, 'Must contain commercial and competitive implications');
      assert.ok(result.implications.some(imp => imp.includes('margin pressure') || imp.includes('parity') || imp.includes('capability surges')));

      // 5. Unknowns
      assert.ok(Array.isArray(result.unknowns), 'unknowns must be an array');
    });

    it('includes Business & Strategic Implications section in deterministic markdown brief', async () => {
      const result = await agentService.executeQuery('What are the strategic implications of AlphaCloud updates?', {
        organizationId: testOrgA,
        timeoutMs: 1 // Force immediate deterministic fallback
      });

      assert.ok(result.answer.includes('#### Verified Facts:'));
      assert.ok(result.answer.includes('#### Strategic Observations:'));
      assert.ok(result.answer.includes('#### Logical Inferences:'));
      assert.ok(result.answer.includes('#### Business & Strategic Implications:'));
      assert.ok(result.reasoningSummary.includes('implications'));
    });
  });

  describe('3. Evidence Citations & Traceability (D-11)', () => {
    it('formats structured citations with citationId, contentHash, publisher, excerpt, and sourceUrl', async () => {
      const result = await agentService.executeQuery('Summarize AlphaCloud price changes with citations', {
        organizationId: testOrgA,
        timeoutMs: 1000
      });

      assert.ok(Array.isArray(result.evidence));
      assert.ok(result.evidence.length >= 3);

      for (const item of result.evidence) {
        assert.ok(item.citationId, 'Must have a citationId');
        assert.ok(item.citationId.startsWith('cit-'), 'citationId must start with cit-');
        assert.ok(item.eventId, 'Must have an eventId');
        assert.strictEqual(item.competitorName, 'AlphaCloud Corp');
        assert.ok(item.title, 'Must have title');
        assert.ok(item.publisher, 'Must have publisher');
        assert.ok(item.contentHash, 'Must have contentHash');
        assert.ok(item.excerpt, 'Must have excerpt');
        assert.ok(typeof item.confidence === 'number');
      }

      // Check specific pricing excerpt
      const pricingCitation = result.evidence.find(e => e.eventType === 'PRICING');
      assert.ok(pricingCitation);
      assert.ok(pricingCitation.excerpt.includes('18% price reduction'));
      assert.strictEqual(pricingCitation.publisher, 'AlphaCloud Newsroom');
    });
  });

  describe('4. Deterministic Offline Resilience & Fallback Transparency', () => {
    it('executes cleanly when Ollama is offline or times out with degraded status badge and 0 crashes', async () => {
      const result = await agentService.executeQuery('What has AlphaCloud released?', {
        organizationId: testOrgA,
        timeoutMs: 1 // Forces immediate timeout
      });

      assert.strictEqual(result.ollamaStatus.used, false);
      assert.strictEqual(result.ollamaStatus.status, 'degraded');
      assert.ok(result.answer.includes('Competitor Intelligence Brief: AlphaCloud Corp'));
      assert.ok(result.facts.length > 0);
      assert.ok(result.implications.length > 0);
      assert.strictEqual(result.insufficientEvidence, false);
      assert.ok(result.executionSteps.some(s => s.id === 'grounded_ai_synthesis' && s.status === 'degraded'));
    });
  });
});
