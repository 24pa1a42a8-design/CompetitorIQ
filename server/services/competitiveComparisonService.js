import { getPrismaClient } from '../config/database.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { calculateCompetitiveMomentum } from './strategicAnalysisService.js';
import { logger } from '../config/logger.js';

export const VALID_COMPARISON_WINDOWS = [30, 60, 90, 180];

export const competitiveComparisonService = {
  async compareCompetitors({ organizationId = 'default-org', competitorIds = [], windowDays = 90, categories = [] }) {
    const validWindow = VALID_COMPARISON_WINDOWS.includes(Number(windowDays)) ? Number(windowDays) : 90;

    logger.info({ organizationId, competitorIds, validWindow }, 'Starting competitive comparison analysis');

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

    if (competitors.length === 0) {
      return {
        success: true,
        windowDays: validWindow,
        timeframe: {
          startDate: new Date(Date.now() - (validWindow * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: new Date().toISOString()
        },
        competitors: [],
        hindsightStatus: 'NOT_ATTEMPTED',
        message: 'No competitors found matching the specified criteria.'
      };
    }

    const targetCompIds = competitors.map(c => c.id);

    // 2. Define bounded date ranges (Current Window vs Previous Window)
    const now = new Date();
    const currentStart = new Date(now.getTime() - (validWindow * 24 * 60 * 60 * 1000));
    const previousStart = new Date(currentStart.getTime() - (validWindow * 24 * 60 * 60 * 1000));

    // 3. Single bulk database query for all relevant competitor events
    const allEvents = await prisma.competitorEvent.findMany({
      where: {
        organizationId,
        competitorId: { in: targetCompIds },
        eventDate: { gte: previousStart }
      },
      orderBy: { eventDate: 'desc' },
      include: {
        competitor: true,
        source: true,
        evidence: true,
        pricingSignals: true,
        productSignals: true,
        messagingSignals: true,
        hiringSignals: true,
        fundingSignals: true
      }
    });

    // 4. Single bulk database query for all alerts in current window
    const allAlerts = await prisma.alert.findMany({
      where: {
        organizationId,
        competitorId: { in: targetCompIds },
        createdAt: { gte: currentStart }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 5. Single bulk database query for all persisted analyses in current window
    const allAnalyses = await prisma.analysis.findMany({
      where: {
        organizationId,
        competitorId: { in: targetCompIds },
        createdAt: { gte: currentStart }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 6. Optional Hindsight Memory Lookup (Gracefully degrades if credits fail)
    let hindsightStatus = 'NOT_ATTEMPTED';
    let hindsightNotes = [];

    try {
      const compNames = competitors.map(c => c.name).join(', ');
      const recallQuery = `Competitive comparison matrix for ${compNames} over ${validWindow} days`;
      const recallRes = await hindsightService.recall(recallQuery, 3);
      if (recallRes && recallRes.memories && recallRes.memories.length > 0) {
        hindsightStatus = 'AVAILABLE';
        hindsightNotes = recallRes.memories.map(m => m.summary || m.memoryText || m.text);
      } else {
        hindsightStatus = 'NO_RELEVANT_MEMORIES';
      }
    } catch (hindsightErr) {
      const isCreditError = (hindsightErr.message || '').toLowerCase().includes('credit');
      hindsightStatus = isCreditError ? 'UNAVAILABLE_INSUFFICIENT_CREDITS' : 'UNAVAILABLE_SERVICE_ERROR';
      logger.info(
        { err: hindsightErr.message, hindsightStatus },
        'Hindsight recall memory unavailable for comparison matrix; using PostgreSQL evidence ground truth'
      );
    }

    // 7. Aggregate per-competitor metrics & side-by-side comparison data
    const comparisonResults = competitors.map(competitor => {
      const cEvents = allEvents.filter(e => e.competitorId === competitor.id);
      
      const currentEvents = cEvents.filter(e => new Date(e.eventDate) >= currentStart);
      const previousEvents = cEvents.filter(e => new Date(e.eventDate) >= previousStart && new Date(e.eventDate) < currentStart);

      const cAlerts = allAlerts.filter(a => a.competitorId === competitor.id);
      const cAnalyses = allAnalyses.filter(a => a.competitorId === competitor.id);
      const cPatterns = cAnalyses.filter(a => a.type === 'CONNECT_DOTS');
      const cStrategicAnalyses = cAnalyses.filter(a => a.type === 'STRATEGIC');

      // Handle Insufficient Evidence case
      if (currentEvents.length === 0) {
        return {
          competitor: {
            id: competitor.id,
            name: competitor.name,
            slug: competitor.slug,
            website: competitor.website,
            description: competitor.description,
            industry: competitor.industry
          },
          hasSufficientEvidence: false,
          statusMessage: 'Insufficient evidence',
          metrics: {
            totalEvents: 0,
            eventFrequency: 0,
            eventsPerCategory: {},
            pricingEvents: 0,
            productEvents: 0,
            hiringEvents: 0,
            partnershipEvents: 0,
            expansionEvents: 0,
            messagingEvents: 0,
            fundingEvents: 0,
            alertsCount: 0,
            highCriticalAlertsCount: 0,
            connectDotsPatternsCount: 0,
            strategicAnalysesCount: 0,
            momentumLevel: 'LOW_ACTIVITY',
            momentumScore: 0
          },
          trends: {},
          alerts: { total: 0, highCriticalCount: 0, items: [] },
          patterns: [],
          strategicSignals: [],
          supportingEvents: []
        };
      }

      // Calculate Category Breakdown for Current Period
      const eventsPerCategory = {
        PRODUCT: 0,
        PRICING: 0,
        HIRING: 0,
        EXPANSION: 0,
        PARTNERSHIP: 0,
        MESSAGING: 0,
        FUNDING: 0,
        LEADERSHIP: 0,
        ANNOUNCEMENT: 0,
        OTHER: 0
      };

      currentEvents.forEach(e => {
        const cat = e.eventType || 'OTHER';
        eventsPerCategory[cat] = (eventsPerCategory[cat] || 0) + 1;
      });

      const productEvents = eventsPerCategory.PRODUCT + (eventsPerCategory.FEATURE || 0);
      const pricingEvents = eventsPerCategory.PRICING;
      const hiringEvents = eventsPerCategory.HIRING;
      const expansionEvents = eventsPerCategory.EXPANSION;
      const partnershipEvents = eventsPerCategory.PARTNERSHIP;
      const messagingEvents = eventsPerCategory.MESSAGING;
      const fundingEvents = eventsPerCategory.FUNDING;

      // Calculate Category Breakdown for Previous Period
      const prevEventsPerCategory = {};
      previousEvents.forEach(e => {
        const cat = e.eventType || 'OTHER';
        prevEventsPerCategory[cat] = (prevEventsPerCategory[cat] || 0) + 1;
      });

      const prevProductEvents = (prevEventsPerCategory.PRODUCT || 0) + (prevEventsPerCategory.FEATURE || 0);
      const prevPricingEvents = prevEventsPerCategory.PRICING || 0;
      const prevHiringEvents = prevEventsPerCategory.HIRING || 0;
      const prevExpansionEvents = prevEventsPerCategory.EXPANSION || 0;
      const prevPartnershipEvents = prevEventsPerCategory.PARTNERSHIP || 0;
      const prevMessagingEvents = prevEventsPerCategory.MESSAGING || 0;

      // Helper to compute period-over-period trend delta
      const computeTrend = (currentVal, prevVal, categoryLabel) => {
        const delta = currentVal - prevVal;
        const pctChange = prevVal > 0 ? Math.round((delta / prevVal) * 100) : (currentVal > 0 ? 100 : 0);
        
        let observation = `${categoryLabel} event activity changed from ${prevVal} in preceding period to ${currentVal} in current period.`;
        if (delta > 0) {
          observation = `${categoryLabel} event activity increased from ${prevVal} to ${currentVal} (+${delta} events, +${pctChange}%).`;
        } else if (delta < 0) {
          observation = `${categoryLabel} event activity decreased from ${prevVal} to ${currentVal} (${delta} events, ${pctChange}%).`;
        }

        return {
          current: currentVal,
          previous: prevVal,
          delta,
          pctChange,
          observation
        };
      };

      const trends = {
        totalEvents: computeTrend(currentEvents.length, previousEvents.length, 'Total'),
        product: computeTrend(productEvents, prevProductEvents, 'Product'),
        pricing: computeTrend(pricingEvents, prevPricingEvents, 'Pricing'),
        hiring: computeTrend(hiringEvents, prevHiringEvents, 'Hiring'),
        expansion: computeTrend(expansionEvents, prevExpansionEvents, 'Expansion'),
        partnership: computeTrend(partnershipEvents, prevPartnershipEvents, 'Partnership'),
        messaging: computeTrend(messagingEvents, prevMessagingEvents, 'Messaging')
      };

      // Momentum calculation
      const momentum = calculateCompetitiveMomentum(currentEvents, cAlerts, cPatterns, validWindow);

      const highCriticalAlertsCount = cAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length;

      // Format supporting events with primary evidence excerpt
      const formattedSupportingEvents = currentEvents.map(e => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        description: e.description,
        eventType: e.eventType,
        eventDate: e.eventDate,
        importance: e.importance,
        confidence: e.confidence,
        source: e.source ? { title: e.source.title, url: e.source.url, publisher: e.source.publisher } : null,
        evidence: (e.evidence || []).map(ev => ({ excerpt: ev.excerpt, evidenceType: ev.evidenceType }))
      }));

      return {
        competitor: {
          id: competitor.id,
          name: competitor.name,
          slug: competitor.slug,
          website: competitor.website,
          description: competitor.description,
          industry: competitor.industry
        },
        hasSufficientEvidence: true,
        statusMessage: 'Verified evidence available',
        metrics: {
          totalEvents: currentEvents.length,
          eventFrequency: Number((currentEvents.length / (validWindow / 30)).toFixed(2)),
          eventsPerCategory,
          pricingEvents,
          productEvents,
          hiringEvents,
          partnershipEvents,
          expansionEvents,
          messagingEvents,
          fundingEvents,
          alertsCount: cAlerts.length,
          highCriticalAlertsCount,
          connectDotsPatternsCount: cPatterns.length,
          strategicAnalysesCount: cStrategicAnalyses.length,
          momentumLevel: momentum.level,
          momentumScore: momentum.score
        },
        trends,
        alerts: {
          total: cAlerts.length,
          highCriticalCount: highCriticalAlertsCount,
          items: cAlerts.slice(0, 10).map(a => ({
            id: a.id,
            type: a.type,
            severity: a.severity,
            title: a.title,
            message: a.message,
            createdAt: a.createdAt
          }))
        },
        patterns: cPatterns.map(p => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          confidence: p.confidence,
          createdAt: p.createdAt
        })),
        strategicSignals: cStrategicAnalyses.map(s => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
          confidence: s.confidence,
          createdAt: s.createdAt
        })),
        supportingEvents: formattedSupportingEvents
      };
    });

    return {
      success: true,
      windowDays: validWindow,
      timeframe: {
        startDate: currentStart.toISOString(),
        endDate: now.toISOString(),
        previousStartDate: previousStart.toISOString(),
        previousEndDate: currentStart.toISOString()
      },
      competitors: comparisonResults,
      hindsightStatus,
      hindsightNotes
    };
  }
};

export default competitiveComparisonService;
