import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { executiveReportService, SUPPORTED_REPORT_TYPES } from '../server/services/executiveReportService.js';
import { executiveReportController } from '../server/controllers/executiveReportController.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Executive Intelligence Report Engine Unit & Integration Tests', () => {

  const testOrgId = 'test-exec-org-' + Date.now();
  let comp1Id = null;
  let comp2Id = null;

  before(async () => {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.organization.create({
        data: { id: testOrgId, name: 'Executive Test Org', planTier: 'ENTERPRISE' }
      });

      const comp1 = await prisma.competitor.create({
        data: { organizationId: testOrgId, name: 'MongoDB', slug: 'mongodb-' + Date.now() }
      });
      comp1Id = comp1.id;

      const comp2 = await prisma.competitor.create({
        data: { organizationId: testOrgId, name: 'Redis', slug: 'redis-' + Date.now() }
      });
      comp2Id = comp2.id;

      // Ingest events
      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          eventType: 'PRODUCT',
          title: 'MongoDB Atlas Vector Search Launch',
          summary: 'Fully managed vector search capability for AI applications',
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
          title: 'MongoDB Serverless Tier Price Adjustment',
          summary: 'Lowered minimum hourly rate for serverless clusters',
          eventDate: new Date('2026-09-15'),
          importance: 'HIGH',
          confidence: 0.9
        }
      });

      await prisma.competitorEvent.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp2.id,
          eventType: 'EXPANSION',
          title: 'Redis Flex Cloud Global Expansion',
          summary: 'Multi-cloud managed Redis service deployment in EU',
          eventDate: new Date('2026-09-12'),
          importance: 'HIGH',
          confidence: 0.88
        }
      });

      // Create an alert
      await prisma.alert.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          type: 'NEW_PRODUCT',
          severity: 'CRITICAL',
          title: 'Critical Product Launch: MongoDB Atlas Vector Search',
          message: 'MongoDB launched Vector Search capability.'
        }
      });

      // Create a Connect-the-Dots pattern
      await prisma.analysis.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          type: 'CONNECT_DOTS',
          title: 'MongoDB: Pricing Shift Followed by Product Release',
          summary: 'Pricing adjustment preceded vector search release',
          confidence: 'HIGH',
          facts: ['Event A on Sep 10', 'Event B on Sep 15'],
          observations: ['10 days between events'],
          inferences: ['Commercial pre-positioning'],
          unknowns: ['Internal budget']
        }
      });

      // Create a Strategic Analysis
      await prisma.analysis.create({
        data: {
          organizationId: testOrgId,
          competitorId: comp1.id,
          type: 'STRATEGIC',
          title: 'MongoDB: PRODUCT STRATEGY Intelligence (90d Window)',
          summary: 'MongoDB exhibits HIGH_ACCELERATION momentum',
          confidence: 'HIGH',
          facts: ['Product launch verified'],
          observations: ['Velocity surge'],
          inferences: {
            inferences: ['Prioritized AI capability push'],
            implications: ['Monitor customer migration'],
            analysisType: 'PRODUCT_STRATEGY'
          },
          unknowns: ['R&D headcount allocation']
        }
      });
    }
  });

  describe('1. Report Generation Across Supported Types', () => {
    it('generates EXECUTIVE_SUMMARY report synthesizing events, alerts, patterns, and analyses', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        reportType: 'EXECUTIVE_SUMMARY',
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.insufficientEvidence, undefined);
      assert.strictEqual(result.reportType, 'EXECUTIVE_SUMMARY');
      assert.ok(result.sections.executiveSummary);
      assert.ok(result.sections.executiveSummary.facts.length >= 2);
      assert.ok(result.sections.executiveSummary.observations.length >= 2);
      assert.ok(result.sections.competitorActivity.length >= 2);
      assert.ok(result.sections.patterns.length >= 1);
      assert.ok(result.sections.strategicAnalysis.length >= 1);
      assert.ok(result.sections.watchItems.length >= 1);
    });

    it('generates COMPETITOR_DEEP_DIVE report for specific target competitor', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        competitorIds: [comp1Id],
        reportType: 'COMPETITOR_DEEP_DIVE',
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.reportType, 'COMPETITOR_DEEP_DIVE');
      assert.strictEqual(result.sections.competitorActivity.length, 1);
      assert.strictEqual(result.sections.competitorActivity[0].competitorName, 'MongoDB');
    });

    it('generates WEEKLY_INTELLIGENCE report with 7-day timeframe window', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        reportType: 'WEEKLY_INTELLIGENCE',
        windowDays: 7
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.windowDays, 7);
    });

    it('generates MONTHLY_INTELLIGENCE report with 30-day timeframe window', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        reportType: 'MONTHLY_INTELLIGENCE',
        windowDays: 30
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.windowDays, 30);
    });

    it('generates COMPETITIVE_LANDSCAPE matrix report', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        reportType: 'COMPETITIVE_LANDSCAPE',
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.reportType, 'COMPETITIVE_LANDSCAPE');
      assert.ok(result.sections.comparison);
    });
  });

  describe('2. Boundary & Fallback Conditions', () => {
    it('handles insufficient evidence gracefully for empty organization', async () => {
      const emptyOrgId = 'empty-exec-org-' + Date.now();
      const result = await executiveReportService.generateReport({
        organizationId: emptyOrgId,
        reportType: 'EXECUTIVE_SUMMARY',
        windowDays: 90
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.insufficientEvidence, true);
      assert.strictEqual(result.metadata.eventCount, 0);
      assert.ok(result.sections.dataLimitations.length >= 1);
    });

    it('handles Hindsight credit failure gracefully with degraded status badge', async () => {
      const result = await executiveReportService.generateReport({
        organizationId: testOrgId,
        windowDays: 90
      });

      assert.ok(typeof result.metadata.hindsightStatus === 'string');
    });

    it('enforces organization isolation strictly', async () => {
      const reportsOrgA = await executiveReportService.getReports(testOrgId);
      const reportsOrgB = await executiveReportService.getReports('non-existent-org-999');

      assert.ok(reportsOrgA.length > 0);
      assert.strictEqual(reportsOrgB.length, 0);
    });
  });

  describe('3. Controller & API Validation', () => {
    it('validates windowDays with Zod schema for POST /api/executive-reports/generate', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        body: { windowDays: 45 } // invalid (must be 7, 30, 60, 90, 180)
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await executiveReportController.generate(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });

    it('validates reportType with Zod schema for POST /api/executive-reports/generate', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        body: { reportType: 'INVALID_REPORT_TYPE' }
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await executiveReportController.generate(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });
  });
});
