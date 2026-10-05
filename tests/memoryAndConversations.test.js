import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { agentService, AgentToolRegistry, isReflectQuery } from '../server/services/agentService.js';
import { ingestionService } from '../server/services/ingestionService.js';
import { memoryOperationRepository } from '../server/repositories/memoryOperationRepository.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Phase 4: Hindsight Memory Orchestration & Lifecycle Tests', () => {
  const testOrgId = `test-mem-org-${Date.now()}`;
  let competitorId = null;
  let sourceId = null;
  let seededEventIds = [];

  before(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // 1. Create Test Organization
    await prisma.organization.create({
      data: {
        id: testOrgId,
        name: 'Memory Orchestration Test Org',
        planTier: 'ENTERPRISE'
      }
    });

    // 2. Create Test Competitor
    const comp = await prisma.competitor.create({
      data: {
        organizationId: testOrgId,
        name: 'CognitiveScale Cloud',
        slug: `cognitivescale-${Date.now()}`,
        website: 'https://cognitivescale.example.com',
        industry: 'Cloud Infrastructure & AI'
      }
    });
    competitorId = comp.id;

    // 3. Create Source
    const source = await prisma.source.create({
      data: {
        organizationId: testOrgId,
        title: 'CognitiveScale Newsroom',
        url: 'https://cognitivescale.example.com/news',
        publisher: 'CognitiveScale Media',
        sourceType: 'BLOG'
      }
    });
    sourceId = source.id;
  });

  after(async () => {
    const prisma = getPrismaClient();
    if (!prisma) return;

    // Cleanup conversations and messages
    await prisma.agentMessage.deleteMany({
      where: {
        conversation: { organizationId: testOrgId }
      }
    }).catch(() => {});

    await prisma.agentConversation.deleteMany({
      where: { organizationId: testOrgId }
    }).catch(() => {});

    // Cleanup memory operations
    await prisma.memoryOperation.deleteMany({
      where: { organizationId: testOrgId }
    }).catch(() => {});

    // Cleanup events, evidence, signals
    if (seededEventIds.length > 0) {
      await prisma.eventEvidence.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.productSignal.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.pricingSignal.deleteMany({ where: { eventId: { in: seededEventIds } } }).catch(() => {});
      await prisma.competitorEvent.deleteMany({ where: { id: { in: seededEventIds } } }).catch(() => {});
    }

    // Cleanup sources, competitors, and organization
    await prisma.source.deleteMany({ where: { organizationId: testOrgId } }).catch(() => {});
    await prisma.competitor.deleteMany({ where: { organizationId: testOrgId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: testOrgId } }).catch(() => {});
  });

  describe('1. Semantic Query Stage Classifier (MEM-02, D-19)', () => {
    it('correctly classifies macro-trend and trajectory queries as REFLECT', () => {
      assert.strictEqual(isReflectQuery('Analyze the strategic trajectory of cloud competitors over 90 days'), true);
      assert.strictEqual(isReflectQuery('What macro patterns are emerging in hyperscaler pricing?'), true);
      assert.strictEqual(isReflectQuery('Explain the competitive landscape overview'), true);
      assert.strictEqual(isReflectQuery('Connect the dots on recent database moves'), true);
      assert.strictEqual(isReflectQuery('Strategic reflection on AI infrastructure shifts'), true);
    });

    it('correctly classifies entity/event-specific queries as not REFLECT (default RECALL)', () => {
      assert.strictEqual(isReflectQuery('What database products did CognitiveScale Cloud launch?'), false);
      assert.strictEqual(isReflectQuery('Show pricing changes for OCI'), false);
      assert.strictEqual(isReflectQuery('Who did AWS hire for quantum computing?'), false);
    });
  });

  describe('2. Automated RETAIN on Signal Ingestion (MEM-01)', () => {
    it('ingests event and logs RETAIN memory operation in database', async () => {
      const rawEvent = {
        competitorId,
        competitorName: 'CognitiveScale Cloud',
        title: 'CognitiveScale Launches Autonomous Inference Fabric v4.0',
        summary: 'CognitiveScale rolled out Autonomous Inference Fabric with distributed microsecond routing across multi-cloud.',
        description: 'Deep technical release detailing distributed inference clusters with integrated telemetry.',
        eventType: 'PRODUCT',
        eventDate: new Date().toISOString(),
        sourceUrl: 'https://cognitivescale.example.com/news/inference-fabric-v4',
        publisher: 'CognitiveScale Media',
        importance: 'HIGH',
        confidence: 0.95
      };

      const result = await ingestionService.ingestEvent(rawEvent, {
        organizationId: testOrgId,
        sourceId
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.eventId, 'Expected eventId to be returned');
      seededEventIds.push(result.eventId);

      // Verify that a RETAIN MemoryOperation was created
      const prisma = getPrismaClient();
      const retainOps = await prisma.memoryOperation.findMany({
        where: {
          organizationId: testOrgId,
          stage: 'RETAIN'
        },
        orderBy: { createdAt: 'desc' }
      });

      assert.ok(retainOps.length > 0, 'Expected at least one RETAIN memory operation to be recorded');
      const latestOp = retainOps[0];
      assert.strictEqual(latestOp.stage, 'RETAIN');
      assert.ok(['COMPLETED', 'FAILED', 'DEGRADED'].includes(latestOp.status));
    });
  });

  describe('3. Dynamic Memory Routing: RECALL vs REFLECT (MEM-02, D-19)', () => {
    it('executes RECALL stage for specific entity queries via AgentToolRegistry', async () => {
      const recallRes = await AgentToolRegistry.recall_memory({
        query: 'What database features did CognitiveScale launch?',
        organizationId: testOrgId,
        competitorId
      });

      assert.strictEqual(recallRes.tool, 'recall_memory');
      assert.strictEqual(recallRes.stage, 'RECALL');
      assert.ok(['completed', 'degraded'].includes(recallRes.status));
      assert.ok(typeof recallRes.durationMs === 'number');

      // Verify in database
      const prisma = getPrismaClient();
      const recallOps = await prisma.memoryOperation.findMany({
        where: {
          organizationId: testOrgId,
          stage: 'RECALL'
        }
      });
      assert.ok(recallOps.length > 0, 'Expected RECALL memory operation recorded in database');
    });

    it('executes REFLECT stage for strategic trajectory queries via AgentToolRegistry', async () => {
      const reflectRes = await AgentToolRegistry.recall_memory({
        query: 'Analyze the 90-day strategic trajectory and macro patterns of CognitiveScale Cloud',
        organizationId: testOrgId,
        competitorId
      });

      assert.strictEqual(reflectRes.tool, 'recall_memory');
      assert.strictEqual(reflectRes.stage, 'REFLECT');
      assert.ok(['completed', 'degraded'].includes(reflectRes.status));
      assert.ok(typeof reflectRes.durationMs === 'number');

      // Verify in database
      const prisma = getPrismaClient();
      const reflectOps = await prisma.memoryOperation.findMany({
        where: {
          organizationId: testOrgId,
          stage: 'REFLECT'
        }
      });
      assert.ok(reflectOps.length > 0, 'Expected REFLECT memory operation recorded in database');
    });
  });

  describe('4. Full Agent Execution Loop Memory Orchestration (MEM-02)', () => {
    it('executes agent query with appropriate hindsightStage and zero crashes', async () => {
      const res = await agentService.executeQuery(
        'What macro patterns and strategic trajectory have emerged for CognitiveScale Cloud?',
        { organizationId: testOrgId }
      );

      assert.ok(res.answer, 'Expected non-empty answer');
      assert.ok(['REFLECT', 'RECALL', 'DEGRADED', 'UNCONFIGURED'].includes(res.hindsightStage));
      assert.ok(Array.isArray(res.executionSteps));
      assert.ok(res.executionSteps.some(s => s.id === 'hindsight_reflect' || s.id === 'hindsight_memory_recall' || s.tool === 'recall_memory'));
    });
  });

  describe('5. Multi-Turn Conversational Persistence & Contextual Resolution (CONV-01, CONV-02)', () => {
    let sessionConversationId = null;

    it('Turn 1: Creates new conversation and persists both user query and assistant response', async () => {
      const turn1Res = await agentService.executeQuery(
        'What database features did CognitiveScale Cloud launch?',
        { organizationId: testOrgId }
      );

      assert.ok(turn1Res.conversationId, 'Expected conversationId to be created and returned');
      sessionConversationId = turn1Res.conversationId;
      assert.ok(turn1Res.answer, 'Expected non-empty turn 1 answer');

      const prisma = getPrismaClient();
      const messages = await prisma.agentMessage.findMany({
        where: { conversationId: sessionConversationId },
        orderBy: { createdAt: 'asc' }
      });

      assert.strictEqual(messages.length, 2, 'Expected 2 messages (USER, ASSISTANT) for Turn 1');
      assert.strictEqual(messages[0].role, 'USER');
      assert.ok(messages[0].content.includes('CognitiveScale Cloud'));
      assert.strictEqual(messages[1].role, 'ASSISTANT');
    });

    it('Turn 2: Follow-up question with pronoun inherits active competitor and records context_resolution', async () => {
      assert.ok(sessionConversationId, 'Expected active conversationId from Turn 1');

      const turn2Res = await agentService.executeQuery(
        'What about their pricing?',
        {
          organizationId: testOrgId,
          conversationId: sessionConversationId
        }
      );

      assert.strictEqual(turn2Res.conversationId, sessionConversationId, 'Expected same conversationId to be preserved');
      assert.ok(turn2Res.answer, 'Expected non-empty turn 2 answer');

      // Verify context_resolution step
      const contextResolutionStep = turn2Res.executionSteps?.find(s => s.id === 'context_resolution');
      assert.ok(contextResolutionStep, 'Expected context_resolution step to be recorded in executionSteps');
      assert.ok(contextResolutionStep.detail.includes('CognitiveScale Cloud'), 'Expected detail to reference inherited competitor');

      // Verify database messages
      const prisma = getPrismaClient();
      const messages = await prisma.agentMessage.findMany({
        where: { conversationId: sessionConversationId },
        orderBy: { createdAt: 'asc' }
      });

      assert.strictEqual(messages.length, 4, 'Expected 4 messages (2 USER, 2 ASSISTANT) across both turns');
      assert.strictEqual(messages[2].role, 'USER');
      assert.strictEqual(messages[2].content, 'What about their pricing?');
      assert.strictEqual(messages[3].role, 'ASSISTANT');
    });

    it('Turn 3: Starting a new session without conversationId isolates history into a new conversation', async () => {
      const freshRes = await agentService.executeQuery(
        'Hi, can you introduce yourself?',
        { organizationId: testOrgId }
      );

      assert.ok(freshRes.conversationId, 'Expected new conversationId');
      assert.notStrictEqual(freshRes.conversationId, sessionConversationId, 'Expected distinct conversationId for new session');

      const prisma = getPrismaClient();
      const messages = await prisma.agentMessage.findMany({
        where: { conversationId: freshRes.conversationId }
      });
      assert.strictEqual(messages.length, 2, 'Expected exactly 2 messages in fresh session');
    });
  });
});

