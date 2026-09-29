import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { alertRuleEngine } from '../server/alerts/alertRuleEngine.js';
import { alertService } from '../server/services/alertService.js';
import { alertRepository } from '../server/repositories/alertRepository.js';
import { alertController } from '../server/controllers/alertController.js';
import { getPrismaClient } from '../server/config/database.js';

describe('Competitive Intelligence Alert Engine Unit Tests', () => {

  describe('1. Rule Matching & Deterministic Severity Calculation', () => {
    it('evaluates pricing alert with critical severity for major price hike', () => {
      const event = {
        eventType: 'PRICING',
        title: 'Price Hike: Enterprise Tier Up 25%',
        summary: 'Major tier increase on all enterprise licenses',
        importance: 'CRITICAL',
        confidence: 0.95
      };
      const evalResult = alertRuleEngine.evaluateEvent(event, null, { name: 'Snowflake Inc' });
      assert.strictEqual(evalResult.triggered, true);
      assert.strictEqual(evalResult.alertType, 'PRICE_CHANGE');
      assert.strictEqual(evalResult.severity, 'CRITICAL');
      assert.ok(evalResult.reason.includes('Snowflake Inc'));
    });

    it('evaluates product launch alert with high severity', () => {
      const event = {
        eventType: 'PRODUCT',
        title: 'Launch ofwatsonx Granite 3.0 Platform',
        summary: 'New enterprise AI model suite',
        importance: 'HIGH',
        confidence: 0.9
      };
      const evalResult = alertRuleEngine.evaluateEvent(event, null, { name: 'IBM' });
      assert.strictEqual(evalResult.triggered, true);
      assert.strictEqual(evalResult.alertType, 'NEW_PRODUCT');
      assert.strictEqual(evalResult.severity, 'HIGH');
    });

    it('evaluates hiring alert with executive role matching', () => {
      const event = {
        eventType: 'HIRING',
        title: 'Hiring VP of AI Engineering & R&D Expansion',
        summary: 'Recruiting executive leadership in San Francisco',
        importance: 'HIGH',
        confidence: 0.85
      };
      const evalResult = alertRuleEngine.evaluateEvent(event, null, { name: 'Databricks' });
      assert.strictEqual(evalResult.triggered, true);
      assert.strictEqual(evalResult.alertType, 'HIRING_SPIKE');
      assert.strictEqual(evalResult.severity, 'HIGH');
    });

    it('evaluates partnership alert with hyperscaler strategic deal', () => {
      const event = {
        eventType: 'PARTNERSHIP',
        title: 'Strategic Alliance with AWS Cloud',
        summary: 'Multi-year exclusive cloud integration partnership',
        importance: 'HIGH',
        confidence: 0.92
      };
      const evalResult = alertRuleEngine.evaluateEvent(event, null, { name: 'Palantir' });
      assert.strictEqual(evalResult.triggered, true);
      assert.strictEqual(evalResult.alertType, 'PARTNERSHIP');
      assert.strictEqual(evalResult.severity, 'CRITICAL');
    });

    it('handles invalid event input gracefully', () => {
      const evalResult = alertRuleEngine.evaluateEvent(null, null, null);
      assert.strictEqual(evalResult.triggered, false);
      assert.ok(evalResult.reason.includes('Invalid'));
    });
  });

  describe('2. Alert Persistence, Deduplication & Status Updates', () => {
    const testOrgId = 'test-alert-org-' + Date.now();
    let createdAlertId = null;
    let mockEventId = null;

    before(async () => {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.organization.create({
          data: { id: testOrgId, name: 'Test Alert Org', planTier: 'PRO' }
        });
        const comp = await prisma.competitor.create({
          data: { organizationId: testOrgId, name: 'Oracle', slug: 'oracle-' + Date.now() }
        });
        const evt = await prisma.competitorEvent.create({
          data: {
            organizationId: testOrgId,
            competitorId: comp.id,
            eventType: 'PRICING',
            title: 'Test Pricing Alert Event',
            summary: 'Pricing change created for testing',
            importance: 'HIGH',
            confidence: 0.9
          }
        });
        mockEventId = evt.id;
      }
    });

    it('persists a new alert into database', async () => {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const event = await prisma.competitorEvent.findUnique({ where: { id: mockEventId }, include: { competitor: true } });

      const result = await alertService.evaluateAndCreateAlert({
        organizationId: testOrgId,
        eventRecord: event,
        competitorRecord: event.competitor
      });

      assert.strictEqual(result.alertCreated, true);
      assert.strictEqual(result.isDuplicate, false);
      assert.ok(result.alert.id);
      assert.strictEqual(result.alert.type, 'PRICE_CHANGE');
      assert.strictEqual(result.alert.status, 'UNREAD');

      createdAlertId = result.alert.id;
    });

    it('prevents duplicate alert creation for the same event and type', async () => {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const event = await prisma.competitorEvent.findUnique({ where: { id: mockEventId }, include: { competitor: true } });

      const dupResult = await alertService.evaluateAndCreateAlert({
        organizationId: testOrgId,
        eventRecord: event,
        competitorRecord: event.competitor
      });

      assert.strictEqual(dupResult.alertCreated, false);
      assert.strictEqual(dupResult.isDuplicate, true);
      assert.strictEqual(dupResult.alert.id, createdAlertId);
    });

    it('updates alert status from UNREAD to ACKNOWLEDGED and RESOLVED', async () => {
      const prisma = getPrismaClient();
      if (!prisma || !createdAlertId) return;

      const ackResult = await alertService.updateAlertStatus(createdAlertId, 'ACKNOWLEDGED');
      assert.strictEqual(ackResult.status, 'ACKNOWLEDGED');

      const resResult = await alertService.updateAlertStatus(createdAlertId, 'RESOLVED');
      assert.strictEqual(resResult.status, 'RESOLVED');
    });

    it('handles missing evidence gracefully during alert evaluation', async () => {
      const eventWithoutEvidence = {
        id: 'no-evidence-evt-' + Date.now(),
        eventType: 'PRODUCT',
        title: 'Unverified Product Signal',
        summary: 'No primary evidence excerpt provided',
        importance: 'MEDIUM',
        confidence: 0.5
      };

      const result = await alertService.evaluateAndCreateAlert({
        organizationId: testOrgId,
        eventRecord: eventWithoutEvidence,
        competitorRecord: { id: 'c1', name: 'MockComp' }
      });

      assert.strictEqual(result.alertCreated, true);
      assert.ok(result.alert.message.includes('Unverified Product Signal') || result.alert.message.includes('Primary source evidence verified'));
    });
  });

  describe('3. Degraded Hindsight Context & API Validation', () => {
    it('handles insufficient Hindsight credits without breaking alert creation', async () => {
      const mockEvent = {
        id: 'hindsight-credit-evt-' + Date.now(),
        eventType: 'FUNDING',
        title: 'Series C $75M Funding',
        summary: 'Massive capital expansion',
        importance: 'CRITICAL',
        confidence: 0.95
      };

      const res = await alertService.evaluateAndCreateAlert({
        organizationId: 'test-org-hindsight',
        eventRecord: mockEvent,
        competitorRecord: { id: 'c2', name: 'Figma' }
      });

      assert.strictEqual(res.alertCreated, true);
      // Hindsight recall may degrade safely if credit unavailable
      assert.ok(typeof res.hindsightContext.available === 'boolean');
      assert.ok(res.alert.id);
    });

    it('validates controller query params and status body via Zod', async () => {
      let statusSent = null;
      let jsonBody = null;

      const req = {
        headers: { 'x-organization-id': 'test-org' },
        query: { severity: 'INVALID_SEVERITY' }
      };
      const res = {
        status(s) { statusSent = s; return this; },
        json(j) { jsonBody = j; return this; }
      };

      await alertController.getAlerts(req, res);
      assert.strictEqual(statusSent, 400);
      assert.strictEqual(jsonBody.error.code, 'VALIDATION_ERROR');
    });
  });
});
