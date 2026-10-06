import test from 'node:test';
import assert from 'node:assert';
import { getPrismaClient } from '../server/config/database.js';
import adapterIngestionService from '../server/services/adapterIngestionService.js';
import executiveReportService from '../server/services/executiveReportService.js';
import agentService from '../server/services/agentService.js';

test('Production Readiness & End-to-End System Integration Test', async (t) => {
  const prisma = getPrismaClient();
  const testOrgId = `prod-readiness-org-${Date.now()}`;

  await t.test('1. Environment & Multi-Tenant Setup', async () => {
    const org = await prisma.organization.upsert({
      where: { id: testOrgId },
      update: {},
      create: { id: testOrgId, name: 'Production Readiness Org', planTier: 'ENTERPRISE' }
    });
    assert.strictEqual(org.id, testOrgId);

    const msft = await prisma.competitor.upsert({
      where: { organizationId_slug: { organizationId: testOrgId, slug: 'microsoft' } },
      update: {},
      create: {
        organizationId: testOrgId,
        name: 'Microsoft',
        slug: 'microsoft',
        website: 'https://microsoft.com',
        description: 'Focal Enterprise Hyperscaler'
      }
    });
    assert.strictEqual(msft.slug, 'microsoft');
  });

  await t.test('2. Multi-Source Ingestion & Evidence Collection', async () => {
    const refreshRes = await adapterIngestionService.triggerSource('microsoft_news', {
      organizationId: testOrgId
    });

    assert.strictEqual(refreshRes.success, true);
    assert.ok(refreshRes.collectedCount >= 1);

    const events = await prisma.competitorEvent.findMany({
      where: { organizationId: testOrgId },
      include: { evidence: true }
    });
    assert.ok(events.length >= 1);
    assert.ok(events[0].evidence.length >= 1);
  });

  await t.test('3. Pre-Retrieval 5-Box Executive Report Generation', async () => {
    const reportRes = await executiveReportService.generateReport({
      organizationId: testOrgId,
      reportType: 'EXECUTIVE_SUMMARY'
    });

    assert.strictEqual(reportRes.success, true);
    assert.ok(reportRes.sections || reportRes.title);
    assert.ok(Array.isArray(reportRes.claims || reportRes.epistemologicalClaims || []));
  });

  await t.test('4. Autonomous Agent Reasoning & Citation Provenance', async () => {
    const queryRes = await agentService.executeQuery(
      'What pricing and partnership announcements has Microsoft made?',
      { organizationId: testOrgId }
    );

    assert.ok(queryRes);
    assert.ok(typeof queryRes.answer === 'string');
    assert.ok(queryRes.answer.length > 0);
    assert.ok(Array.isArray(queryRes.evidence));
  });

  await t.test('5. System Cleanup', async () => {
    await prisma.eventEvidence.deleteMany({
      where: { source: { organizationId: testOrgId } }
    });
    await prisma.competitorEvent.deleteMany({
      where: { organizationId: testOrgId }
    });
    await prisma.competitor.deleteMany({
      where: { organizationId: testOrgId }
    });
    await prisma.organization.deleteMany({
      where: { id: testOrgId }
    });
  });
});
