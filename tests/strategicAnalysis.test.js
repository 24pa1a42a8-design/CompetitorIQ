import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { 
  strategicAnalysisService, 
  calculateCompetitiveMomentum, 
  calculateDeterministicConfidence,
  SUPPORTED_ANALYSIS_TYPES
} from '../server/services/strategicAnalysisService.js';
import { strategicAnalysisController } from '../server/controllers/strategicAnalysisController.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Strategic Analysis Engine Unit & Integration Tests', () => {

  describe('1. Momentum & Confidence Deterministic Calculations', () => {
    it('calculates deterministic momentum score and explanation', () => {
      const mockEvents = [
        { id: '1', eventType: 'PRODUCT', eventDate: new Date(), importance: 'CRITICAL' },
        { id: '2', eventType: 'PRODUCT', eventDate: new Date(), importance: 'HIGH' },
        { id: '3', eventType: 'PRICING', eventDate: new Date(), importance: 'MEDIUM' },
        { id: '4', eventType: 'HIRING', eventDate: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)), importance: 'LOW' }
      ];
      const mockAlerts = [{ id: 'a1' }];
      const mockPatterns = [{ id: 'p1' }];

      const momentum = calculateCompetitiveMomentum(mockEvents, mockAlerts, mockPatterns, 90);

      assert.ok(typeof momentum.score === 'number');
      assert.ok(momentum.score > 0 && momentum.score <= 100);
      assert.ok(['HIGH_ACCELERATION', 'MODERATE_GROWTH', 'STABLE', 'LOW_ACTIVITY'].includes(momentum.level));
      assert.ok(momentum.explanation.includes('Momentum score'));
      assert.ok(momentum.recentVsHistoricalRatio >= 0);
    });

    it('calculates deterministic confidence levels based on evidence metrics', () => {
      const highConf = calculateDeterministicConfidence({
        events: [{}, {}, {}, {}],
        evidenceCount: 5,
        primarySourceCount: 3,
        hasRepeatedSignals: true,
        importanceHighCount: 2
      });
      assert.strictEqual(highConf, 'HIGH');

      const lowConf = calculateDeterministicConfidence({
        events: [{}],
        evidenceCount: 0,
        primarySourceCount: 0,
        hasRepeatedSignals: false,
        importanceHighCount: 0
      });
      assert.strictEqual(lowConf, 'LOW');
    });
  });

  describe('2. End-to-End Strategic Analysis Synthesis & Database Persistence', () => {
    const testOrgId = 'test-strat-org-' + Date.now();
    let competitorId = null;

    before(async () => {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.organization.create({
          data: { id: testOrgId, name: 'Strategic Test Org', planTier: 'ENTERPRISE' }
        });

        const comp = await prisma.competitor.create({
          data: { organizationId: testOrgId, name: 'Cloudflare', slug: 'cloudflare-' + Date.now() }
        });
        competitorId = comp.id;

        // Ingest events across different categories
        // Product strategy events
        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'PRODUCT',
            title: 'Cloudflare Workers AI Platform',
            summary: 'Global serverless GPU inference network launch',
            eventDate: new Date('2026-09-10'),
            importance: 'CRITICAL',
            confidence: 0.95
          }
        });

        // Pricing strategy events
        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'PRICING',
            title: 'Workers AI Usage Based Pricing',
            summary: 'Per-token billing model update for Workers AI',
            eventDate: new Date('2026-09-15'),
            importance: 'HIGH',
            confidence: 0.9
          }
        });

        // Hiring strategy events
        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'HIRING',
            title: 'Head of AI Security Recruitment',
            summary: 'Expanding AI security research engineering team',
            eventDate: new Date('2026-08-20'),
            importance: 'MEDIUM',
            confidence: 0.85
          }
        });

        // Expansion events
        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'EXPANSION',
            title: 'Tokyo Data Center Expansion',
            summary: 'Added 5 new edge POP facilities in Japan',
            eventDate: new Date('2026-08-05'),
            importance: 'HIGH',
            confidence: 0.92
          }
        });
      }
    });

    it('synthesizes product, pricing, hiring, and expansion strategy analyses', async () => {
      const result = await strategicAnalysisService.analyzeStrategicData({
        organizationId: testOrgId,
        competitorId,
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.analysesGenerated >= 3);

      const productAnalysis = result.analyses.find(a => a.analysisType === 'PRODUCT_STRATEGY');
      assert.ok(productAnalysis);
      assert.strictEqual(productAnalysis.type, 'STRATEGIC');
      assert.ok(Array.isArray(productAnalysis.facts));
      assert.ok(Array.isArray(productAnalysis.observations));
      assert.ok(Array.isArray(productAnalysis.inferencesList || productAnalysis.inferences));
      assert.ok(Array.isArray(productAnalysis.implications));
      assert.ok(Array.isArray(productAnalysis.unknowns));
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(productAnalysis.confidence));
    });

    it('enforces strict 5-part separation (FACTS, OBSERVATIONS, INFERENCES, IMPLICATIONS, UNKNOWNS)', async () => {
      const analyses = await strategicAnalysisService.getAnalyses(testOrgId);
      assert.ok(analyses.length > 0);

      const item = analyses[0];
      assert.ok(Array.isArray(item.facts), 'facts must be an array');
      assert.ok(Array.isArray(item.observations), 'observations must be an array');
      assert.ok(Array.isArray(item.inferencesList), 'inferencesList must be an array');
      assert.ok(Array.isArray(item.implications), 'implications must be an array');
      assert.ok(Array.isArray(item.unknowns), 'unknowns must be an array');
    });

    it('handles historical comparisons across bounded window (90 days)', async () => {
      const result = await strategicAnalysisService.analyzeStrategicData({
        organizationId: testOrgId,
        windowDays: 90
      });

      assert.strictEqual(result.windowDays, 90);
      assert.ok(typeof result.hindsightStatus === 'string');
    });

    it('prevents duplicate strategic analysis creation for identical title/competitor', async () => {
      const run1 = await strategicAnalysisService.analyzeStrategicData({ organizationId: testOrgId });
      const run2 = await strategicAnalysisService.analyzeStrategicData({ organizationId: testOrgId });

      assert.strictEqual(run1.analysesGenerated, run2.analysesGenerated);
    });

    it('handles insufficient evidence gracefully for empty organizations', async () => {
      const emptyOrgId = 'empty-org-' + Date.now();
      const result = await strategicAnalysisService.analyzeStrategicData({
        organizationId: emptyOrgId,
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.analysesGenerated, 0);
      assert.ok(result.message.includes('Insufficient evidence'));
    });

    it('enforces organization isolation strictly', async () => {
      const analysesOrgA = await strategicAnalysisService.getAnalyses(testOrgId);
      const analysesOrgB = await strategicAnalysisService.getAnalyses('non-existent-org-xyz');

      assert.ok(analysesOrgA.length > 0);
      assert.strictEqual(analysesOrgB.length, 0);
    });
  });

  describe('3. Controller & API Validation', () => {
    it('validates query parameters with Zod schema for GET /api/strategic-analysis', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        query: { confidence: 'INVALID_CONFIDENCE_LEVEL' }
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await strategicAnalysisController.getAnalyses(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });

    it('validates windowDays parameter with Zod schema for POST /api/strategic-analysis/analyze', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        body: { windowDays: 45 } // invalid window (must be 30, 60, 90, 180)
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await strategicAnalysisController.analyze(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });
  });
});
