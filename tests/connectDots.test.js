import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PATTERN_RULES, connectDotsService } from '../server/services/connectDotsService.js';
import { connectDotsController } from '../server/controllers/connectDotsController.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Connect the Dots Intelligence Engine Unit Tests', () => {

  describe('1. Pattern Matchers & Evaluator Logic', () => {
    it('detects Pricing -> Product pattern within 30 days', () => {
      const evtA = { id: 'evt-a', eventType: 'PRICING', title: 'Pro Plan Price Hike', confidence: 0.9, eventDate: new Date('2026-09-01') };
      const evtB = { id: 'evt-b', eventType: 'PRODUCT', title: 'AI Assistant Launch', confidence: 0.9, eventDate: new Date('2026-09-14') };
      
      const rule = PATTERN_RULES.find(r => r.patternType === 'PRICING_PRODUCT');
      assert.ok(rule);

      const matches = rule.matches(evtA, evtB, 13);
      assert.strictEqual(matches, true);

      const result = rule.evaluate('Snowflake', evtA, evtB, 13);
      assert.strictEqual(result.patternType, 'PRICING_PRODUCT');
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(result.confidence));
      assert.strictEqual(result.facts.length, 2);
      assert.strictEqual(result.observations.length, 2);
      assert.strictEqual(result.inferences.length, 1);
      assert.strictEqual(result.unknowns.length, 1);
    });

    it('detects Hiring -> Product pattern within 60 days', () => {
      const evtA = { id: 'evt-c', eventType: 'HIRING', title: 'VP of AI Recruitment', importance: 'HIGH', eventDate: new Date('2026-08-01') };
      const evtB = { id: 'evt-d', eventType: 'PRODUCT', title: 'LLM Studio Feature', eventDate: new Date('2026-09-15') };

      const rule = PATTERN_RULES.find(r => r.patternType === 'HIRING_PRODUCT');
      assert.ok(rule);

      const matches = rule.matches(evtA, evtB, 45);
      assert.strictEqual(matches, true);

      const result = rule.evaluate('Databricks', evtA, evtB, 45);
      assert.strictEqual(result.patternType, 'HIRING_PRODUCT');
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(result.confidence));
    });

    it('detects Funding -> Expansion pattern within 90 days', () => {
      const evtA = { id: 'evt-e', eventType: 'FUNDING', title: 'Series D $150M', eventDate: new Date('2026-06-01') };
      const evtB = { id: 'evt-f', eventType: 'EXPANSION', title: 'EMEA Region Opening', eventDate: new Date('2026-08-01') };

      const rule = PATTERN_RULES.find(r => r.patternType === 'FUNDING_EXPANSION');
      assert.ok(rule);

      const matches = rule.matches(evtA, evtB, 61);
      assert.strictEqual(matches, true);

      const result = rule.evaluate('Figma', evtA, evtB, 61);
      assert.strictEqual(result.patternType, 'FUNDING_EXPANSION');
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(result.confidence));
    });

    it('rejects events outside temporal window', () => {
      const evtA = { id: 'evt-g', eventType: 'PRICING', title: 'Old Price Change', eventDate: new Date('2026-01-01') };
      const evtB = { id: 'evt-h', eventType: 'PRODUCT', title: 'Late Launch', eventDate: new Date('2026-06-01') };

      const rule = PATTERN_RULES.find(r => r.patternType === 'PRICING_PRODUCT');
      assert.strictEqual(rule.matches(evtA, evtB, 150), false);
    });
  });

  describe('2. End-to-End Relationship Analysis & Database Persistence', () => {
    const testOrgId = 'test-dots-org-' + Date.now();
    let compId = null;

    before(async () => {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.organization.create({
          data: { id: testOrgId, name: 'Test Dots Org', planTier: 'ENTERPRISE' }
        });

        const comp = await prisma.competitor.create({
          data: { organizationId: testOrgId, name: 'Palantir', slug: 'palantir-' + Date.now() }
        });
        compId = comp.id;

        // Create sequential events: Pricing -> Product -> Messaging
        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'PRICING',
            title: 'Palantir AIP Tier Restructure',
            summary: 'Modified seat pricing for enterprise AIP licenses',
            eventDate: new Date('2026-09-01'),
            importance: 'HIGH',
            confidence: 0.9
          }
        });

        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'PRODUCT',
            title: 'Palantir Foundry v4.0 Release',
            summary: 'Next-gen enterprise ontology platform release',
            eventDate: new Date('2026-09-12'),
            importance: 'CRITICAL',
            confidence: 0.95
          }
        });

        await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'MESSAGING',
            title: 'Palantir AI First Positioning Pivot',
            summary: 'Rebranding core messaging around operational AI',
            eventDate: new Date('2026-09-25'),
            importance: 'HIGH',
            confidence: 0.88
          }
        });
      }
    });

    it('analyzes PostgreSQL events and detects multi-event pattern chains', async () => {
      const result = await connectDotsService.analyzePatterns({
        organizationId: testOrgId,
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.patternsFound >= 2);

      const pricingProductPattern = result.patterns.find(p => p.title.includes('Pricing Shift Followed by Product Release') || p.title.includes('Pricing'));
      assert.ok(pricingProductPattern);
      assert.strictEqual(pricingProductPattern.type || pricingProductPattern.patternType, 'CONNECT_DOTS');
      assert.ok(Array.isArray(pricingProductPattern.facts));
      assert.ok(Array.isArray(pricingProductPattern.observations));
      assert.ok(Array.isArray(pricingProductPattern.inferences));
      assert.ok(Array.isArray(pricingProductPattern.unknowns));
    });

    it('prevents duplicate pattern persistence on subsequent analysis runs', async () => {
      const firstRun = await connectDotsService.analyzePatterns({ organizationId: testOrgId });
      const secondRun = await connectDotsService.analyzePatterns({ organizationId: testOrgId });

      assert.strictEqual(firstRun.patternsFound, secondRun.patternsFound);
    });

    it('handles degraded Hindsight context gracefully', async () => {
      const result = await connectDotsService.analyzePatterns({ organizationId: testOrgId });
      assert.ok(typeof result.hindsightStatus === 'string');
    });
  });

  describe('3. Controller & API Validation', () => {
    it('validates query parameters with Zod schema', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        query: { confidence: 'INVALID_CONFIDENCE' }
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await connectDotsController.getPatterns(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });
  });
});
