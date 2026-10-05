import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { agentService, AgentToolRegistry } from '../server/services/agentService.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Phase 3: Autonomous AI Agent Execution Loop & Tool Registry Tests', () => {
  const testOrgId = `test-agent-loop-org-${Date.now()}`;
  let competitorAId = null;
  let competitorBId = null;
  let seededEventIds = [];

  before(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // 1. Create Test Organization
    await prisma.organization.create({
      data: {
        id: testOrgId,
        name: 'Agent Loop Test Org',
        planTier: 'ENTERPRISE'
      }
    });

    // 2. Create Competitor A
    const compA = await prisma.competitor.create({
      data: {
        organizationId: testOrgId,
        name: 'NexusCloud Systems',
        slug: `nexuscloud-${Date.now()}`,
        website: 'https://nexuscloud.example.com',
        industry: 'Cloud Computing'
      }
    });
    competitorAId = compA.id;

    // 3. Create Competitor B
    const compB = await prisma.competitor.create({
      data: {
        organizationId: testOrgId,
        name: 'VortexAI Labs',
        slug: `vortexai-${Date.now()}`,
        website: 'https://vortexai.example.com',
        industry: 'Enterprise AI'
      }
    });
    competitorBId = compB.id;

    // 4. Create Source
    const source = await prisma.source.create({
      data: {
        organizationId: testOrgId,
        title: 'NexusCloud Press Feed',
        url: 'https://nexuscloud.example.com/press',
        publisher: 'NexusCloud Communications',
        sourceType: 'RSS'
      }
    });

    // 5. Seed PRICING event for NexusCloud
    const pricingEvt = await prisma.competitorEvent.create({
      data: {
        organizationId: testOrgId,
        competitorId: competitorAId,
        sourceId: source.id,
        eventType: 'PRICING',
        title: 'NexusCloud Lowers Multi-Region Storage Rates by 15%',
        summary: 'NexusCloud announced a price cut on object storage tiers across all regions.',
        eventDate: new Date('2026-09-20T00:00:00Z'),
        confidence: 0.95,
        importance: 'HIGH',
        contentHash: `hash-nexus-pricing-${Date.now()}`,
        evidence: {
          create: [
            {
              sourceId: source.id,
              excerpt: 'Starting November, standard object storage is reduced by 15% across US and EU regions.',
              evidenceType: 'PRIMARY_SOURCE'
            }
          ]
        },
        pricingSignals: {
          create: [
            {
              competitorId: competitorAId,
              tierName: 'Standard S3 Storage',
              previousPrice: 0.023,
              newPrice: 0.0195,
              currency: 'USD',
              effectiveDate: new Date('2026-11-01T00:00:00Z')
            }
          ]
        }
      }
    });
    seededEventIds.push(pricingEvt.id);

    // 6. Seed PRODUCT event for VortexAI
    const productEvt = await prisma.competitorEvent.create({
      data: {
        organizationId: testOrgId,
        competitorId: competitorBId,
        sourceId: source.id,
        eventType: 'PRODUCT',
        title: 'VortexAI Launches Enterprise Agent Studio v2',
        summary: 'VortexAI unveiled an autonomous multi-agent orchestration console.',
        eventDate: new Date('2026-09-25T00:00:00Z'),
        confidence: 0.92,
        importance: 'CRITICAL',
        contentHash: `hash-vortex-product-${Date.now()}`,
        evidence: {
          create: [
            {
              sourceId: source.id,
              excerpt: 'VortexAI Agent Studio allows enterprises to deploy multi-agent reasoning pipelines.',
              evidenceType: 'PRIMARY_SOURCE'
            }
          ]
        }
      }
    });
    seededEventIds.push(productEvt.id);
  });

  after(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // Cleanup seeded records
    await prisma.agentMessage.deleteMany({
      where: {
        conversation: { organizationId: testOrgId }
      }
    });
    await prisma.agentConversation.deleteMany({
      where: { organizationId: testOrgId }
    });
    await prisma.pricingSignal.deleteMany({
      where: { eventId: { in: seededEventIds } }
    });
    await prisma.eventEvidence.deleteMany({
      where: { eventId: { in: seededEventIds } }
    });
    await prisma.competitorEvent.deleteMany({
      where: { id: { in: seededEventIds } }
    });
    await prisma.source.deleteMany({
      where: { organizationId: testOrgId }
    });
    await prisma.competitor.deleteMany({
      where: { organizationId: testOrgId }
    });
    await prisma.organization.deleteMany({
      where: { id: testOrgId }
    });
  });

  describe('1. AgentToolRegistry Verification (AGENT-02)', () => {
    it('provides all 5 typed tools with standardized response contracts', async () => {
      assert.ok(AgentToolRegistry.search_events, 'search_events tool exists');
      assert.ok(AgentToolRegistry.get_competitor_comparison, 'get_competitor_comparison tool exists');
      assert.ok(AgentToolRegistry.correlate_strategic_patterns, 'correlate_strategic_patterns tool exists');
      assert.ok(AgentToolRegistry.analyze_pricing_signals, 'analyze_pricing_signals tool exists');
      assert.ok(AgentToolRegistry.recall_memory, 'recall_memory tool exists');
    });

    it('search_events queries events filtered by organizationId and competitorId', async () => {
      const res = await AgentToolRegistry.search_events({
        organizationId: testOrgId,
        competitorId: competitorAId
      });

      assert.equal(res.tool, 'search_events');
      assert.equal(res.status, 'completed');
      assert.equal(typeof res.durationMs, 'number');
      assert.ok(res.itemCount >= 1, 'retrieved at least 1 event');
      assert.equal(res.data[0].competitorId, competitorAId);
    });

    it('get_competitor_comparison computes comparison momentum across competitors', async () => {
      const res = await AgentToolRegistry.get_competitor_comparison({
        organizationId: testOrgId,
        competitors: [
          { id: competitorAId, name: 'NexusCloud Systems' },
          { id: competitorBId, name: 'VortexAI Labs' }
        ],
        windowDays: 90
      });

      assert.equal(res.tool, 'get_competitor_comparison');
      assert.equal(res.status, 'completed');
      assert.ok(res.itemCount >= 2, 'compared at least 2 competitors');
      assert.ok(res.data.some(c => c.competitorId === competitorAId));
      assert.ok(res.data.some(c => c.competitorId === competitorBId));
      assert.equal(typeof res.data[0].momentumScore, 'number');
    });

    it('analyze_pricing_signals extracts structured pricing metrics', async () => {
      const res = await AgentToolRegistry.analyze_pricing_signals({
        organizationId: testOrgId,
        competitorId: competitorAId
      });

      assert.equal(res.tool, 'analyze_pricing_signals');
      assert.equal(res.status, 'completed');
      assert.ok(res.itemCount >= 1, 'found pricing signals');
      assert.ok(res.data.some(ps => ps.tierName === 'Standard S3 Storage'));
    });

    it('correlate_strategic_patterns runs without throwing errors', async () => {
      const res = await AgentToolRegistry.correlate_strategic_patterns({
        organizationId: testOrgId,
        competitorId: competitorAId,
        windowDays: 90
      });

      assert.equal(res.tool, 'correlate_strategic_patterns');
      assert.ok(res.status === 'completed' || res.status === 'degraded');
      assert.equal(typeof res.itemCount, 'number');
      assert.ok(Array.isArray(res.data));
    });

    it('recall_memory returns standardized structure even if Hindsight is unconfigured/degraded', async () => {
      const res = await AgentToolRegistry.recall_memory({
        query: 'NexusCloud storage pricing reduction',
        organizationId: testOrgId
      });

      assert.equal(res.tool, 'recall_memory');
      assert.ok(res.status === 'completed' || res.status === 'degraded');
      assert.equal(typeof res.durationMs, 'number');
      assert.ok(Array.isArray(res.data));
    });
  });

  describe('2. Autonomous Execution Loop & Tool Planning (AGENT-01)', () => {
    it('decomposes comparison query to invoke get_competitor_comparison', async () => {
      const res = await agentService.executeQuery(
        'Compare NexusCloud Systems and VortexAI Labs pricing and momentum',
        {
          organizationId: testOrgId,
          timeoutMs: 100
        }
      );

      assert.ok(res.executionPlan.includes('get_competitor_comparison'), 'Plan includes get_competitor_comparison');
      const compStep = res.executionSteps.find(s => s.id === 'get_competitor_comparison');
      assert.ok(compStep, 'Execution steps recorded get_competitor_comparison');
      assert.equal(compStep.tool, 'get_competitor_comparison');
      assert.equal(typeof compStep.durationMs, 'number');

      // Facts contain comparative momentum
      assert.ok(res.facts.some(f => f.includes('Comparative Momentum') || f.includes('NexusCloud Systems')));
    });

    it('decomposes pricing query to invoke analyze_pricing_signals', async () => {
      const res = await agentService.executeQuery(
        'What pricing changes has NexusCloud Systems announced?',
        {
          organizationId: testOrgId,
          timeoutMs: 100
        }
      );

      assert.ok(res.executionPlan.includes('analyze_pricing_signals'), 'Plan includes analyze_pricing_signals');
      const priceStep = res.executionSteps.find(s => s.id === 'analyze_pricing_signals');
      assert.ok(priceStep, 'Execution steps recorded analyze_pricing_signals');
      assert.equal(priceStep.tool, 'analyze_pricing_signals');

      // Facts contain pricing signals
      assert.ok(res.facts.some(f => f.includes('Pricing Signal') || f.includes('Standard S3 Storage')));
    });
  });

  describe('3. Adaptive Query Relaxation / Self-Correction (AGENT-01, D-15)', () => {
    it('autonomously broadens search and marks self_correct_broaden_search when keyword yields 0 records', async () => {
      // Query with non-matching keywords for NexusCloud
      const res = await agentService.executeQuery(
        'What is NexusCloud Systems doing in quantum cryogenic robotics satellite?',
        {
          organizationId: testOrgId,
          timeoutMs: 100
        }
      );

      // Verify self-correction step was recorded
      const relaxStep = res.executionSteps.find(s => s.id === 'self_correct_broaden_search');
      assert.ok(relaxStep, 'Recorded self_correct_broaden_search step');
      assert.equal(relaxStep.status, 'self_corrected');
      assert.ok(relaxStep.itemCount >= 1, 'Broadened query retrieved available competitor signals');

      // Verify that insufficientEvidence is FALSE because the agent autonomously self-corrected!
      assert.equal(res.insufficientEvidence, false, 'Self-correction successfully retrieved competitor signals');
      assert.ok(res.facts.length > 0, 'Populated facts from broadened competitor activity');
    });

    it('preserves strict fail-closed when competitor genuinely has zero records even after relaxation', async () => {
      const res = await agentService.executeQuery(
        'What has Cyberdyne Systems been doing?',
        {
          organizationId: testOrgId,
          timeoutMs: 100
        }
      );

      assert.equal(res.insufficientEvidence, true, 'Fail-closed triggered for genuinely non-existent entity');
      assert.equal(res.facts.length, 0, 'Zero fabricated facts');
      assert.ok(res.unknowns.some(u => u.includes('fail-closed') || u.includes('Cyberdyne')));
    });
  });

  describe('4. Deterministic Offline Resilience & Transparency (AGENT-03)', () => {
    it('executes without 500 crash when Ollama is offline or times out', async () => {
      const res = await agentService.executeQuery(
        'What has NexusCloud Systems announced?',
        {
          organizationId: testOrgId,
          timeoutMs: 1 // Force immediate timeout
        }
      );

      assert.ok(res.answer, 'Generated valid answer via deterministic fallback');
      assert.equal(res.insufficientEvidence, false);
      assert.ok(res.ollamaStatus, 'Ollama status object present');
      assert.equal(res.ollamaStatus.used, false);
      assert.equal(res.ollamaStatus.status, 'degraded');
      assert.ok(res.facts.length > 0, 'Facts populated via deterministic ground truth');
    });
  });
});
