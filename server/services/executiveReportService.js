import { getPrismaClient } from '../config/database.js';
import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { alertRepository } from '../repositories/alertRepository.js';
import { analysisRepository } from '../repositories/analysisRepository.js';
import { connectDotsService } from './connectDotsService.js';
import { strategicAnalysisService } from './strategicAnalysisService.js';
import { competitiveComparisonService } from './competitiveComparisonService.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { logger } from '../config/logger.js';

export const SUPPORTED_REPORT_TYPES = [
  'EXECUTIVE_SUMMARY',
  'COMPETITOR_DEEP_DIVE',
  'WEEKLY_INTELLIGENCE',
  'MONTHLY_INTELLIGENCE',
  'COMPETITIVE_LANDSCAPE'
];

export const VALID_REPORT_WINDOWS = [7, 30, 60, 90, 180];

export const executiveReportService = {
  async generateReport({ organizationId = 'default-org', competitorIds = [], reportType = 'EXECUTIVE_SUMMARY', windowDays = 90 }) {
    const validWindow = VALID_REPORT_WINDOWS.includes(Number(windowDays)) ? Number(windowDays) : 90;
    const validReportType = SUPPORTED_REPORT_TYPES.includes(reportType) ? reportType : 'EXECUTIVE_SUMMARY';

    logger.info({ organizationId, competitorIds, reportType: validReportType, windowDays: validWindow }, 'Generating Executive Intelligence Report');

    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error('Database is not configured.');
    }

    // 1. Fetch organization competitors
    let competitorWhere = { organizationId };
    if (Array.isArray(competitorIds) && competitorIds.length > 0) {
      const validIds = competitorIds.filter(id => typeof id === 'string' && id.trim().length > 0);
      if (validIds.length > 0) {
        competitorWhere.id = { in: validIds };
      }
    }

    const competitors = await prisma.competitor.findMany({
      where: competitorWhere,
      orderBy: { name: 'asc' }
    });

    const targetCompIds = competitors.map(c => c.id);
    const now = new Date();
    const startDate = new Date(now.getTime() - (validWindow * 24 * 60 * 60 * 1000));
    const previousStartDate = new Date(startDate.getTime() - (validWindow * 24 * 60 * 60 * 1000));

    // 2. Fetch bounded events from PostgreSQL
    const events = await competitorEventRepository.searchEvents({
      organizationId,
      limit: 150
    });

    const windowEvents = events.filter(e => {
      const inWindow = new Date(e.eventDate) >= startDate;
      const compMatch = targetCompIds.length === 0 || targetCompIds.includes(e.competitorId);
      return inWindow && compMatch;
    });

    // Handle Insufficient Evidence
    if (windowEvents.length === 0) {
      return {
        success: true,
        insufficientEvidence: true,
        reportType: validReportType,
        windowDays: validWindow,
        timeframe: { startDate: startDate.toISOString(), endDate: now.toISOString() },
        competitorsIncluded: competitors.map(c => c.name),
        metadata: {
          generatedAt: now.toISOString(),
          eventCount: 0,
          alertCount: 0,
          patternCount: 0,
          strategicAnalysisCount: 0,
          hindsightStatus: 'NOT_ATTEMPTED'
        },
        sections: {
          executiveSummary: {
            title: 'A. Executive Summary',
            facts: [],
            observations: ['Insufficient competitive events recorded in database during this window.'],
            inferences: []
          },
          competitorActivity: [],
          keySignals: [],
          patterns: [],
          strategicAnalysis: [],
          comparison: null,
          watchItems: [],
          dataLimitations: [
            `No verified events recorded for selected competitors in the ${validWindow}-day window.`,
            'Public event ingestion recommended before compiling executive intelligence reports.'
          ]
        },
        message: `Insufficient evidence in database for ${validReportType} across ${validWindow} days.`
      };
    }

    // 3. Fetch alerts, Connect-the-Dots patterns, Strategic Analyses, and Comparison metrics
    const alerts = await alertRepository.findByOrganization(organizationId, { limit: 100 }).catch(() => []);
    const windowAlerts = alerts.filter(a => new Date(a.createdAt) >= startDate && (targetCompIds.length === 0 || targetCompIds.includes(a.competitorId)));

    const comparisonResult = await competitiveComparisonService.compareCompetitors({
      organizationId,
      competitorIds: targetCompIds,
      windowDays: validWindow
    }).catch(() => null);

    const strategicAnalyses = await strategicAnalysisService.getAnalyses(organizationId, { limit: 50 }).catch(() => []);
    const windowStrategicAnalyses = strategicAnalyses.filter(a => new Date(a.createdAt) >= startDate);

    const patterns = await connectDotsService.getPatterns(organizationId, { limit: 50 }).catch(() => []);

    // 4. Hindsight Historical Memory Integration (Safe Fallback)
    let hindsightStatus = 'NOT_ATTEMPTED';
    let hindsightMemoryNotes = [];

    try {
      const compNames = competitors.map(c => c.name).join(', ') || 'All Competitors';
      const reflectQuery = `Executive strategic intelligence reflection for ${compNames} over past ${validWindow} days`;
      const recallRes = await hindsightService.recall(reflectQuery, 4);
      if (recallRes && recallRes.memories && recallRes.memories.length > 0) {
        hindsightStatus = 'AVAILABLE';
        hindsightMemoryNotes = recallRes.memories.map(m => m.summary || m.memoryText || m.text);
      } else {
        hindsightStatus = 'NO_RELEVANT_MEMORIES';
      }
    } catch (hindsightErr) {
      const isCreditError = (hindsightErr.message || '').toLowerCase().includes('credit');
      hindsightStatus = isCreditError ? 'UNAVAILABLE_INSUFFICIENT_CREDITS' : 'UNAVAILABLE_SERVICE_ERROR';
      logger.info(
        { err: hindsightErr.message, hindsightStatus },
        'Hindsight memory context recall unavailable for executive report; grounding strictly in PostgreSQL factual events'
      );
    }

    // 5. Construct Report Sections A through H
    const reportTitle = `${validReportType.replace(/_/g, ' ')}: ${competitors.map(c => c.name).join(', ') || 'Market Overview'} (${validWindow}d Window)`;

    // Section A: Executive Summary
    const executiveSummary = {
      title: 'A. Executive Summary',
      facts: windowEvents.slice(0, 5).map(e => 
        `${e.competitor?.name || 'Competitor'} recorded ${e.eventType} event "${e.title}" on ${new Date(e.eventDate).toLocaleDateString()}.`
      ),
      observations: [
        `Detected ${windowEvents.length} verified competitive event(s) across ${competitors.length || 1} competitor(s) over the last ${validWindow} days.`,
        `Automated alert engine triggered ${windowAlerts.length} total alert(s) (${windowAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length} High/Critical).`,
        `Identified ${patterns.length} multi-event Connect-the-Dots pattern(s) and ${windowStrategicAnalyses.length} strategic pattern signal(s).`
      ],
      inferences: [
        `Market activity indicates prioritized product velocity and commercial positioning adjustments across tracked competitor entities.`
      ]
    };

    // Section B: Competitor Activity Breakdown
    const competitorActivity = competitors.map(comp => {
      const cEvts = windowEvents.filter(e => e.competitorId === comp.id);
      const cAlerts = windowAlerts.filter(a => a.competitorId === comp.id);
      const highAlerts = cAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');

      const cats = {};
      cEvts.forEach(e => {
        cats[e.eventType] = (cats[e.eventType] || 0) + 1;
      });

      return {
        competitorId: comp.id,
        competitorName: comp.name,
        totalEvents: cEvts.length,
        categoryBreakdown: cats,
        recentEventsCount: cEvts.filter(e => new Date(e.eventDate) >= new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))).length,
        highCriticalAlertsCount: highAlerts.length,
        notableEvents: cEvts.slice(0, 3).map(e => ({
          id: e.id,
          title: e.title,
          summary: e.summary,
          eventType: e.eventType,
          eventDate: e.eventDate
        }))
      };
    });

    // Section C: Key Competitive Signals
    const keySignals = [
      {
        category: 'PRICING_SIGNALS',
        events: windowEvents.filter(e => e.eventType === 'PRICING').map(e => ({
          title: e.title,
          summary: e.summary,
          competitorName: e.competitor?.name,
          date: new Date(e.eventDate).toLocaleDateString()
        }))
      },
      {
        category: 'PRODUCT_SIGNALS',
        events: windowEvents.filter(e => e.eventType === 'PRODUCT' || e.eventType === 'FEATURE').map(e => ({
          title: e.title,
          summary: e.summary,
          competitorName: e.competitor?.name,
          date: new Date(e.eventDate).toLocaleDateString()
        }))
      },
      {
        category: 'HIRING_SIGNALS',
        events: windowEvents.filter(e => e.eventType === 'HIRING').map(e => ({
          title: e.title,
          summary: e.summary,
          competitorName: e.competitor?.name,
          date: new Date(e.eventDate).toLocaleDateString()
        }))
      },
      {
        category: 'EXPANSION_SIGNALS',
        events: windowEvents.filter(e => e.eventType === 'EXPANSION' || e.eventType === 'FUNDING').map(e => ({
          title: e.title,
          summary: e.summary,
          competitorName: e.competitor?.name,
          date: new Date(e.eventDate).toLocaleDateString()
        }))
      }
    ];

    // Section D: Connect-the-Dots Patterns
    const formattedPatterns = patterns.map(p => ({
      id: p.id,
      patternTitle: p.title,
      summary: p.summary,
      confidence: p.confidence,
      facts: p.facts || [],
      observations: p.observations || [],
      inferences: p.inferences || [],
      unknowns: p.unknowns || [],
      createdAt: p.createdAt
    }));

    // Section E: Strategic Analysis
    const formattedStrategic = windowStrategicAnalyses.map(s => ({
      id: s.id,
      title: s.title,
      analysisType: s.analysisType || 'STRATEGIC',
      confidence: s.confidence,
      facts: s.facts || [],
      observations: s.observations || [],
      inferences: s.inferencesList || [],
      implications: s.implications || [],
      unknowns: s.unknowns || []
    }));

    // Section G: Watch Items (Empirical Signals)
    const watchItems = [];
    if (comparisonResult && comparisonResult.competitors) {
      comparisonResult.competitors.forEach(cRes => {
        if (cRes.hasSufficientEvidence && cRes.trends) {
          const pTrend = cRes.trends.product;
          if (pTrend && pTrend.delta > 0) {
            watchItems.push({
              competitorName: cRes.competitor.name,
              category: 'PRODUCT_VELOCITY',
              observation: `${cRes.competitor.name} product event activity changed from ${pTrend.previous} to ${pTrend.current} (+${pTrend.delta} events).`,
              watchFocus: `Monitor user reviews and adoption feedback for ${cRes.competitor.name}'s latest product features.`
            });
          }
          const prTrend = cRes.trends.pricing;
          if (prTrend && prTrend.current > 0) {
            watchItems.push({
              competitorName: cRes.competitor.name,
              category: 'PRICING_MOVEMENT',
              observation: `${cRes.competitor.name} registered ${prTrend.current} pricing update event(s) in this period.`,
              watchFocus: `Track enterprise deal win/loss feedback regarding ${cRes.competitor.name}'s commercial tier adjustments.`
            });
          }
        }
      });
    }

    if (watchItems.length === 0) {
      watchItems.push({
        competitorName: 'Market Broad',
        category: 'EVENT_FREQUENCY',
        observation: `Recorded ${windowEvents.length} total events during ${validWindow}-day window.`,
        watchFocus: 'Maintain standard telemetry ingestion to detect upcoming feature announcements.'
      });
    }

    // Section H: Data Limitations
    const dataLimitations = [
      `Report scope is strictly bounded to the selected ${validWindow}-day timeframe (${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}).`,
      `Public telemetry cannot verify internal R&D roadmap budgets or unreleased board-level strategic initiatives.`,
      `Hindsight Memory Layer Status: ${hindsightStatus}.`
    ];

    const reportPayload = {
      title: reportTitle,
      reportType: validReportType,
      windowDays: validWindow,
      timeframe: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      competitorsIncluded: competitors.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
      metadata: {
        generatedAt: now.toISOString(),
        eventCount: windowEvents.length,
        alertCount: windowAlerts.length,
        patternCount: formattedPatterns.length,
        strategicAnalysisCount: formattedStrategic.length,
        hindsightStatus
      },
      sections: {
        executiveSummary,
        competitorActivity,
        keySignals,
        patterns: formattedPatterns,
        strategicAnalysis: formattedStrategic,
        comparison: comparisonResult,
        watchItems,
        dataLimitations
      },
      supportingEvents: windowEvents.map(e => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        eventType: e.eventType,
        eventDate: e.eventDate,
        competitorName: e.competitor?.name,
        source: e.source ? { title: e.source.title, url: e.source.url, publisher: e.source.publisher } : null,
        evidenceExcerpt: (e.evidence && e.evidence[0]) ? e.evidence[0].excerpt : null
      }))
    };

    // 6. Persist Executive Report into Analysis Table (type: EXECUTIVE) avoiding rapid duplicates
    const existingReport = await analysisRepository.findExistingPattern(
      organizationId,
      targetCompIds[0] || null,
      reportTitle
    );

    let persistedId = null;
    if (existingReport) {
      persistedId = existingReport.id;
    } else {
      const created = await analysisRepository.create({
        organizationId,
        competitorId: targetCompIds[0] || null,
        type: 'EXECUTIVE',
        title: reportTitle,
        summary: executiveSummary.observations.join(' '),
        facts: executiveSummary.facts,
        observations: executiveSummary.observations,
        inferences: {
          reportType: validReportType,
          windowDays: validWindow,
          timeframe: reportPayload.timeframe,
          sections: reportPayload.sections,
          metadata: reportPayload.metadata
        },
        unknowns: dataLimitations,
        confidence: 'HIGH'
      });
      persistedId = created.id;
    }

    return {
      success: true,
      id: persistedId,
      ...reportPayload
    };
  },

  async getReports(organizationId, filters = {}) {
    const rawAnalyses = await analysisRepository.findByOrganization(organizationId, {
      type: 'EXECUTIVE',
      ...filters
    });

    return rawAnalyses.map(a => {
      const payload = a.inferences || {};
      return {
        id: a.id,
        title: a.title,
        reportType: payload.reportType || 'EXECUTIVE_SUMMARY',
        windowDays: payload.windowDays || 90,
        summary: a.summary,
        confidence: a.confidence,
        sections: payload.sections || {},
        metadata: payload.metadata || {},
        createdAt: a.createdAt
      };
    });
  },

  async getReportById(id) {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      const error = new Error(`Executive Report record not found with ID ${id}`);
      error.status = 404;
      throw error;
    }

    const payload = analysis.inferences || {};
    return {
      id: analysis.id,
      title: analysis.title,
      reportType: payload.reportType || 'EXECUTIVE_SUMMARY',
      windowDays: payload.windowDays || 90,
      summary: analysis.summary,
      confidence: analysis.confidence,
      sections: payload.sections || {},
      metadata: payload.metadata || {},
      createdAt: analysis.createdAt
    };
  }
};

export default executiveReportService;
