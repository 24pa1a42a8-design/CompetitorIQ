import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getPrismaClient } from '../server/config/database.js';
import { monitoringScheduler } from '../server/services/monitoringScheduler.js';
import adapterIngestionService from '../server/services/adapterIngestionService.js';
import { alertService } from '../server/services/alertService.js';
import { connectDotsService } from '../server/services/connectDotsService.js';
import { strategicAnalysisService } from '../server/services/strategicAnalysisService.js';
import { competitiveComparisonService } from '../server/services/competitiveComparisonService.js';
import { executiveReportService } from '../server/services/executiveReportService.js';
import agentService from '../server/services/agentService.js';

describe('CompetitorIQ Complete End-to-End System Pipeline Tests', () => {
  const testOrgId = `e2e-org-${Date.now()}`;
  let prisma = null;
  let oracleId = null;
  let event1Id = null;
  let event2Id = null;

  before(async () => {
    monitoringScheduler.stop();
    prisma = getPrismaClient();

    // Ensure Organization and Competitor exist in database for E2E test
    const org = await prisma.organization.upsert({
      where: { id: testOrgId },
      update: {},
      create: { id: testOrgId, name: 'E2E Testing Org', planTier: 'ENTERPRISE' }
    });

    const oracle = await prisma.competitor.upsert({
      where: { organizationId_slug: { organizationId: testOrgId, slug: 'oracle' } },
      update: {},
      create: {
        organizationId: testOrgId,
        name: 'Oracle',
        slug: 'oracle',
        website: 'https://oracle.com',
        description: 'Enterprise Cloud & Database',
        industry: 'Cloud Infrastructure'
      }
    });

    oracleId = oracle.id;
  });

  afterEach(() => {
    monitoringScheduler.stop();
  });

  it('1. Public Source Ingestion & Normalization: Ingests mock news page signal into PostgreSQL', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Oracle Press Releases</title></head>
        <body>
          <h1>Oracle Sashes Enterprise Cloud Database Prices by 25 Percent</h1>
          <p>Oracle announced a major 25 percent price cut across all Autonomous Cloud Database tiers on September 28, 2026.</p>
        </body>
      </html>
    `;

    const result = await adapterIngestionService.triggerSource('oracle_press', {
      organizationId: testOrgId,
      mockContent: mockHtml
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.collectedCount >= 1);

    const event = await prisma.competitorEvent.findFirst({
      where: { organizationId: testOrgId },
      include: { evidence: true, competitor: true }
    });

    assert.ok(event);
    assert.ok(event.title.includes('Oracle'));
    assert.ok(event.evidence.length >= 1);
    oracleId = event.competitorId;
    event1Id = event.id;
  });

  it('2. Alert Engine: Evaluates ingested event and generates persistent competitive alert', async () => {
    await prisma.competitorEvent.update({
      where: { id: event1Id },
      data: { eventType: 'PRICING', importance: 'HIGH' }
    });

    const event = await prisma.competitorEvent.findUnique({
      where: { id: event1Id },
      include: { competitor: true }
    });
    assert.ok(event);

    const alertResult = await alertService.evaluateAndCreateAlert({
      organizationId: testOrgId,
      eventRecord: event,
      competitorRecord: event.competitor
    });
    assert.ok(alertResult);
    assert.strictEqual(alertResult.alertCreated, true);

    const alertInDb = await prisma.alert.findFirst({
      where: { organizationId: testOrgId }
    });
    assert.ok(alertInDb);
  });

  it('3. Ingests second related signal to enable cross-event intelligence analysis', async () => {
    const mockHtml2 = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Oracle Unveils Next-Gen AI Database Compute Clusters</h1>
          <p>Oracle launched high-density AI compute database instances globally on September 29, 2026.</p>
        </body>
      </html>
    `;

    const result = await adapterIngestionService.triggerSource('oracle_press', {
      organizationId: testOrgId,
      mockContent: mockHtml2
    });

    assert.strictEqual(result.success, true);

    const events = await prisma.competitorEvent.findMany({
      where: { organizationId: testOrgId }
    });

    assert.ok(events.length >= 2);
    event2Id = events[1].id;
  });

  it('4. Connect-the-Dots Engine: Detects cross-event strategic pattern across historical events', async () => {
    const analysisResult = await connectDotsService.analyzePatterns({
      organizationId: testOrgId,
      windowDays: 90
    });

    assert.strictEqual(analysisResult.success, true);
    assert.ok(Array.isArray(analysisResult.patterns));
  });

  it('5. Strategic Analysis Engine: Synthesizes Fact, Observation, Inference, and Implication framework', async () => {
    const stratResult = await strategicAnalysisService.analyzeStrategicData({
      organizationId: testOrgId,
      competitorId: oracleId,
      windowDays: 90
    });

    assert.strictEqual(stratResult.success, true);
    assert.ok(Array.isArray(stratResult.analyses));
  });

  it('6. Competitive Comparison Engine: Compares competitors backed by evidence ground truth', async () => {
    const compResult = await competitiveComparisonService.compareCompetitors({
      organizationId: testOrgId,
      competitorIds: [oracleId],
      windowDays: 90
    });

    assert.strictEqual(compResult.success, true);
    assert.ok(compResult.competitors.length >= 1);
  });

  it('7. Executive Intelligence Report System: Generates structured C-level executive report', async () => {
    const execResult = await executiveReportService.generateReport({
      organizationId: testOrgId,
      reportType: 'EXECUTIVE_SUMMARY'
    });

    assert.strictEqual(execResult.success, true);
    assert.ok(execResult.sections);
    assert.ok(execResult.sections.executiveSummary);
    assert.ok(execResult.sections.competitorActivity.length >= 1);
  });

  it('8. Competitor Intelligence AI Agent: Answers strategic user queries with grounded evidence links', async () => {
    const agentRes = await agentService.executeQuery('What price cuts or cloud announcements has Oracle made recently?', {
      organizationId: testOrgId
    });

    assert.ok(agentRes);
    assert.ok(agentRes.answer);
    assert.ok(Array.isArray(agentRes.evidence));
    assert.ok(agentRes.evidence.length >= 1);
  });

  it('9. Data Integrity & Safe Degradation: Handles missing evidence without fabricating data', async () => {
    const emptyOrgId = `empty-org-${Date.now()}`;
    
    const emptyReport = await executiveReportService.generateReport({
      organizationId: emptyOrgId,
      reportType: 'EXECUTIVE_SUMMARY'
    });

    assert.strictEqual(emptyReport.success, true);
    assert.strictEqual(emptyReport.insufficientEvidence, true);
    assert.strictEqual(emptyReport.metadata.eventCount, 0);
  });
});
