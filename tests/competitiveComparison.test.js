import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { competitiveComparisonService } from '../server/services/competitiveComparisonService.js';
import { competitiveComparisonController } from '../server/controllers/competitiveComparisonController.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Competitive Comparison Engine Unit & Integration Tests', () => {

  const testOrgId = 'test-comp-org-' + Date.now();
  let comp1Id = null;
  let comp2Id = null;
  let comp3Id = null;

  before(async () => {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.organization.create({
        data: { id: testOrgId, name: 'Comparison Test Org', planTier: 'ENTERPRISE' }
      });

      const comp1 = await prisma.competitor.create({
        data: { organizationId: testOrgId, name: 'Snowflake', slug: 'snowflake-' + Date.now() }
      });
      comp1Id = comp1.id;

      const comp2 = await prisma.competitor.create({
        data: { organizationId: testOrgId, name: 'Databricks', slug: 'databricks-' + Date.now() }
      });
      comp2Id = comp2.id;

      const comp3 = await prisma.competitor.create({
        data: { organizationId: testOrgId, name: 'BigQuery', slug: 'bigquery-' + Date.now() }
      });
      comp3Id = comp3.id;

      // Ingest current period events for Snowflake (comp1)
      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          eventType: 'PRODUCT',
          title: 'Snowflake Cortex AI Launch',
          summary: 'Built-in LLM function release',
          eventDate: new Date('2026-09-10'),
          importance: 'CRITICAL',
          confidence: 0.95
        }
      });

      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          eventType: 'PRICING',
          title: 'Snowflake Credit Rate Adjustment',
          summary: 'Compute warehouse credit rate change',
          eventDate: new Date('2026-09-15'),
          importance: 'HIGH',
          confidence: 0.9
        }
      });

      // Ingest previous period event for Snowflake (to test trend comparison)
      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          eventType: 'PRODUCT',
          title: 'Snowflake Snowpark Python Update',
          summary: 'Previous period Python runtime enhancement',
          eventDate: new Date('2026-06-15'), // preceding 90d window
          importance: 'MEDIUM',
          confidence: 0.85
        }
      });

      // Ingest events for Databricks (comp2)
      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp2.id,
          eventType: 'HIRING',
          title: 'Databricks VP AI Recruitment',
          summary: 'Recruiting executive AI engineering director',
          eventDate: new Date('2026-09-12'),
          importance: 'HIGH',
          confidence: 0.9
        }
      });

      // comp3 (BigQuery) has NO events, to test "Insufficient evidence"
    }
  });

  describe('1. Side-by-Side Comparison & Category Aggregation', () => {
    it('executes two-competitor comparison accurately', async () => {
      const result = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        competitorIds: [comp1Id, comp2Id],
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.competitors.length, 2);

      const comp1Data = result.competitors.find(c => c.competitor.id === comp1Id);
      assert.ok(comp1Data);
      assert.strictEqual(comp1Data.hasSufficientEvidence, true);
      assert.strictEqual(comp1Data.metrics.productEvents, 1);
      assert.strictEqual(comp1Data.metrics.pricingEvents, 1);
      assert.strictEqual(comp1Data.metrics.totalEvents, 2);
    });

    it('executes three-competitor comparison including insufficient evidence handling', async () => {
      const result = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        competitorIds: [comp1Id, comp2Id, comp3Id],
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.competitors.length, 3);

      const comp3Data = result.competitors.find(c => c.competitor.id === comp3Id);
      assert.ok(comp3Data);
      assert.strictEqual(comp3Data.hasSufficientEvidence, false);
      assert.strictEqual(comp3Data.statusMessage, 'Insufficient evidence');
      assert.strictEqual(comp3Data.metrics.totalEvents, 0);
    });

    it('calculates period-over-period trend deltas correctly', async () => {
      const result = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        competitorIds: [comp1Id],
        windowDays: 90
      });

      const comp1Data = result.competitors[0];
      assert.ok(comp1Data.trends.product);
      assert.strictEqual(comp1Data.trends.product.current, 1);
      assert.strictEqual(comp1Data.trends.product.previous, 1);
      assert.ok(comp1Data.trends.product.observation.includes('Product event activity changed'));
    });
  });

  describe('2. Time Windows & Organization Isolation', () => {
    it('supports bounded time window selection (30, 60, 90, 180 days)', async () => {
      const result30 = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        windowDays: 30
      });
      assert.strictEqual(result30.windowDays, 30);

      const result180 = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        windowDays: 180
      });
      assert.strictEqual(result180.windowDays, 180);
    });

    it('enforces organization isolation strictly', async () => {
      const resultOrgA = await competitiveComparisonService.compareCompetitors({
        organizationId: testOrgId,
        windowDays: 90
      });
      const resultOrgB = await competitiveComparisonService.compareCompetitors({
        organizationId: 'isolated-non-existent-org',
        windowDays: 90
      });

      assert.ok(resultOrgA.competitors.length > 0);
      assert.strictEqual(resultOrgB.competitors.length, 0);
    });
  });

  describe('3. Controller & Zod API Validation', () => {
    it('validates windowDays query parameter with Zod schema', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        query: { windowDays: '45' } // invalid window (must be 30, 60, 90, 180)
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await competitiveComparisonController.compare(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });

    it('accepts comma-separated competitorIds query string', async () => {
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': testOrgId },
        query: { competitorIds: `${comp1Id},${comp2Id}`, windowDays: '90' }
      };
      const res = {
        json(j) { jsonBody = j; return this; }
      };

      await competitiveComparisonController.compare(req, res);
      assert.strictEqual(jsonBody.success, true);
      assert.strictEqual(jsonBody.data.competitors.length, 2);
    });
  });
});
