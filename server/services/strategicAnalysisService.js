import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { analysisRepository } from '../repositories/analysisRepository.js';
import { alertRepository } from '../repositories/alertRepository.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { logger } from '../config/logger.js';

export const SUPPORTED_ANALYSIS_TYPES = [
  'COMPETITIVE_MOMENTUM',
  'PRICING_STRATEGY',
  'PRODUCT_STRATEGY',
  'MARKET_EXPANSION',
  'HIRING_STRATEGY',
  'PARTNERSHIP_STRATEGY',
  'MESSAGING_POSITIONING',
  'COMPETITIVE_ESCALATION',
  'STRATEGIC_SEQUENCE',
  'EMERGING_TREND'
];

export const VALID_WINDOWS = [30, 60, 90, 180];

/**
 * Calculates deterministic momentum indicators and score (0 - 100)
 */
export function calculateCompetitiveMomentum(events, alerts, patterns, windowDays) {
  const totalEvents = events.length;
  if (totalEvents === 0) {
    return {
      score: 0,
      level: 'LOW_ACTIVITY',
      eventFrequency: 0,
      recentVsHistoricalRatio: 0,
      categoryConcentration: 0,
      importanceDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      alertCount: 0,
      patternCount: 0,
      explanation: 'No competitive events recorded within the specified time window.'
    };
  }

  const now = new Date();
  const cutoffRecent = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  const recentEvents = events.filter(e => new Date(e.eventDate) >= cutoffRecent);
  const historicalEvents = events.filter(e => new Date(e.eventDate) < cutoffRecent);

  const recentCount = recentEvents.length;
  const historicalCount = historicalEvents.length;
  const histDays = Math.max(1, windowDays - 30);

  const recentRate = recentCount / 30; // events/day
  const historicalRate = historicalCount / histDays; // events/day
  const recentVsHistoricalRatio = historicalRate > 0 
    ? Number((recentRate / historicalRate).toFixed(2))
    : (recentCount > 0 ? 2.0 : 1.0);

  // Category concentration
  const catCounts = {};
  events.forEach(e => {
    catCounts[e.eventType] = (catCounts[e.eventType] || 0) + 1;
  });
  const maxCatCount = Math.max(...Object.values(catCounts), 0);
  const categoryConcentration = Number((maxCatCount / totalEvents).toFixed(2));

  // Importance breakdown
  const importanceDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  events.forEach(e => {
    const imp = e.importance || 'MEDIUM';
    importanceDistribution[imp] = (importanceDistribution[imp] || 0) + 1;
  });

  const highCriticalCount = importanceDistribution.HIGH + importanceDistribution.CRITICAL;
  const alertCount = alerts.length;
  const patternCount = patterns.length;

  // Weighted score computation (0 to 100)
  // 1. Frequency (max 25 pts): 5+ events in window gives full points
  const frequencyPts = Math.min(25, Math.round((totalEvents / 6) * 25));

  // 2. Velocity Acceleration (max 25 pts): ratio >= 2 gives 25 pts, ratio=1 gives 12.5 pts
  const velocityPts = Math.min(25, Math.round(recentVsHistoricalRatio * 12.5));

  // 3. High/Critical Importance (max 20 pts)
  const importancePts = totalEvents > 0 ? Math.min(20, Math.round((highCriticalCount / totalEvents) * 20)) : 0;

  // 4. Alert Signals (max 15 pts)
  const alertPts = Math.min(15, alertCount * 5);

  // 5. Connected Patterns (max 15 pts)
  const patternPts = Math.min(15, patternCount * 5);

  const score = Math.min(100, frequencyPts + velocityPts + importancePts + alertPts + patternPts);

  let level = 'LOW_ACTIVITY';
  if (score >= 70) level = 'HIGH_ACCELERATION';
  else if (score >= 40) level = 'MODERATE_GROWTH';
  else if (score >= 20) level = 'STABLE';

  const explanation = `Momentum score ${score}/100 (${level}) computed deterministically from ${totalEvents} events across ${windowDays} days (Frequency: ${frequencyPts}/25, Velocity Ratio ${recentVsHistoricalRatio}x: ${velocityPts}/25, High Importance: ${importancePts}/20, Alerts: ${alertPts}/15, Connected Patterns: ${patternPts}/15).`;

  return {
    score,
    level,
    eventFrequency: Number((totalEvents / (windowDays / 30)).toFixed(2)),
    recentVsHistoricalRatio,
    categoryConcentration,
    importanceDistribution,
    alertCount,
    patternCount,
    explanation
  };
}

/**
 * Calculates deterministic confidence (HIGH, MEDIUM, LOW)
 */
export function calculateDeterministicConfidence({ events, evidenceCount, primarySourceCount, hasRepeatedSignals, importanceHighCount }) {
  if (!events || events.length === 0) return 'LOW';

  let points = 0;
  if (events.length >= 4) points += 3;
  else if (events.length >= 2) points += 2;
  else points += 1;

  if (primarySourceCount >= 2) points += 2;
  else if (primarySourceCount >= 1) points += 1;

  if (hasRepeatedSignals) points += 2;
  if (importanceHighCount >= 1) points += 1;

  if (points >= 6) return 'HIGH';
  if (points >= 3) return 'MEDIUM';
  return 'LOW';
}

export const strategicAnalysisService = {
  async analyzeStrategicData({ organizationId = 'default-org', competitorId = null, analysisType = null, windowDays = 90 }) {
    const validWindow = VALID_WINDOWS.includes(Number(windowDays)) ? Number(windowDays) : 90;
    
    logger.info({ organizationId, competitorId, analysisType, validWindow }, 'Starting strategic analysis generation');

    // 1. Load bounded events from PostgreSQL
    const now = new Date();
    const startDate = new Date(now.getTime() - (validWindow * 24 * 60 * 60 * 1000));

    const events = await competitorEventRepository.searchEvents({
      organizationId,
      competitorId: competitorId || undefined,
      limit: 100
    });

    const windowEvents = events.filter(e => new Date(e.eventDate) >= startDate);

    if (windowEvents.length === 0) {
      return {
        success: true,
        analysesGenerated: 0,
        analyses: [],
        message: `Insufficient evidence stored in PostgreSQL database within the ${validWindow}-day window.`
      };
    }

    // Group window events by competitor
    const competitorGroups = {};
    windowEvents.forEach(e => {
      const cId = e.competitorId || 'unknown';
      if (!competitorGroups[cId]) {
        competitorGroups[cId] = { competitor: e.competitor, events: [] };
      }
      competitorGroups[cId].events.push(e);
    });

    // 2. Fetch relevant Alerts and Connect-the-Dots Patterns for context
    const allAlerts = await alertRepository.findByOrganization(organizationId, {
      competitorId: competitorId || undefined,
      limit: 100
    }).catch(() => []);

    const allPatterns = await analysisRepository.findByOrganization(organizationId, {
      type: 'CONNECT_DOTS',
      competitorId: competitorId || undefined,
      limit: 100
    }).catch(() => []);

    // 3. Attempt Hindsight Memory Recall / Reflection safely
    let hindsightStatus = 'NOT_ATTEMPTED';
    let hindsightMemoryNotes = [];

    try {
      const recallQuery = `Strategic competitor trajectory patterns over ${validWindow} days`;
      const recallPromise = hindsightService.recall(recallQuery, 3);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Hindsight recall timeout after 1.5s')), 1500));
      const recallRes = await Promise.race([recallPromise, timeoutPromise]);
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
        'Hindsight memory context recall unavailable for strategic analysis; grounding strictly in PostgreSQL factual events'
      );
    }

    const generatedAnalyses = [];

    // 4. Generate Strategic Intelligence for each competitor
    for (const cId of Object.keys(competitorGroups)) {
      const group = competitorGroups[cId];
      const compName = group.competitor?.name || 'Competitor';
      const cEvents = group.events;
      const cAlerts = allAlerts.filter(a => a.competitorId === cId);
      const cPatterns = allPatterns.filter(p => p.competitorId === cId);

      // Determine types to generate
      let typesToEvaluate = SUPPORTED_ANALYSIS_TYPES;
      if (analysisType && analysisType !== 'ALL' && SUPPORTED_ANALYSIS_TYPES.includes(analysisType)) {
        typesToEvaluate = [analysisType];
      }

      for (const type of typesToEvaluate) {
        const analysisResult = this.generateSingleAnalysis({
          organizationId,
          competitorId: cId,
          competitorName: compName,
          analysisType: type,
          events: cEvents,
          alerts: cAlerts,
          patterns: cPatterns,
          windowDays: validWindow,
          hindsightStatus,
          hindsightMemoryNotes
        });

        if (analysisResult) {
          // Check for existing recent analysis to prevent duplicates
          const existing = await analysisRepository.findExistingPattern(
            organizationId,
            cId,
            analysisResult.title
          );

          if (existing) {
            generatedAnalyses.push({
              ...existing,
              analysisType: type,
              hindsightStatus,
              supportingEvents: analysisResult.supportingEvents,
              momentumMetrics: analysisResult.momentumMetrics
            });
          } else {
            const created = await analysisRepository.create({
              organizationId,
              competitorId: cId,
              type: 'STRATEGIC',
              title: analysisResult.title,
              summary: analysisResult.summary,
              facts: analysisResult.facts,
              observations: analysisResult.observations,
              inferences: {
                inferences: analysisResult.inferences,
                implications: analysisResult.implications,
                analysisType: type,
                windowDays: validWindow,
                momentumMetrics: analysisResult.momentumMetrics
              },
              unknowns: analysisResult.unknowns,
              confidence: analysisResult.confidence
            });

            generatedAnalyses.push({
              ...created,
              analysisType: type,
              implications: analysisResult.implications,
              inferencesList: analysisResult.inferences,
              hindsightStatus,
              supportingEvents: analysisResult.supportingEvents,
              momentumMetrics: analysisResult.momentumMetrics
            });
          }
        }
      }
    }

    return {
      success: true,
      analysesGenerated: generatedAnalyses.length,
      windowDays: validWindow,
      hindsightStatus,
      analyses: generatedAnalyses
    };
  },

  generateSingleAnalysis({ organizationId, competitorId, competitorName, analysisType, events, alerts, patterns, windowDays, hindsightStatus, hindsightMemoryNotes }) {
    // Filter events relevant to this analysis type
    let relevantEvents = [];
    switch (analysisType) {
      case 'PRICING_STRATEGY':
        relevantEvents = events.filter(e => e.eventType === 'PRICING');
        break;
      case 'PRODUCT_STRATEGY':
        relevantEvents = events.filter(e => e.eventType === 'PRODUCT' || e.eventType === 'FEATURE');
        break;
      case 'HIRING_STRATEGY':
        relevantEvents = events.filter(e => e.eventType === 'HIRING');
        break;
      case 'MARKET_EXPANSION':
        relevantEvents = events.filter(e => e.eventType === 'EXPANSION' || e.eventType === 'FUNDING');
        break;
      case 'PARTNERSHIP_STRATEGY':
        relevantEvents = events.filter(e => e.eventType === 'PARTNERSHIP');
        break;
      case 'MESSAGING_POSITIONING':
        relevantEvents = events.filter(e => e.eventType === 'MESSAGING');
        break;
      case 'COMPETITIVE_ESCALATION':
        relevantEvents = events.filter(e => e.importance === 'HIGH' || e.importance === 'CRITICAL' || alerts.length >= 2);
        break;
      case 'STRATEGIC_SEQUENCE':
        relevantEvents = events.filter(e => patterns.length > 0 || events.length >= 3);
        break;
      case 'EMERGING_TREND':
        relevantEvents = events.filter(e => e.eventType !== 'OTHER');
        break;
      case 'COMPETITIVE_MOMENTUM':
      default:
        relevantEvents = events;
        break;
    }

    // Require at least 1 relevant event for specialized types, or 2 for momentum/sequence
    if (relevantEvents.length === 0) return null;
    if (['STRATEGIC_SEQUENCE', 'COMPETITIVE_MOMENTUM'].includes(analysisType) && events.length < 2) return null;

    // Calculate Momentum Indicators
    const momentum = calculateCompetitiveMomentum(events, alerts, patterns, windowDays);

    // Bounded historical comparison (Recent 30 days vs Previous period in window)
    const now = new Date();
    const cutoff30 = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentRelEvents = relevantEvents.filter(e => new Date(e.eventDate) >= cutoff30);
    const prevRelEvents = relevantEvents.filter(e => new Date(e.eventDate) < cutoff30);
    const histDays = Math.max(1, windowDays - 30);

    // Primary source evidence count
    let primarySourceCount = 0;
    let totalEvidenceCount = 0;
    relevantEvents.forEach(e => {
      const evs = e.evidence || [];
      totalEvidenceCount += evs.length;
      primarySourceCount += evs.filter(ev => ev.evidenceType === 'PRIMARY_SOURCE').length;
    });

    const highImpCount = relevantEvents.filter(e => e.importance === 'HIGH' || e.importance === 'CRITICAL').length;
    const confidence = calculateDeterministicConfidence({
      events: relevantEvents,
      evidenceCount: totalEvidenceCount,
      primarySourceCount,
      hasRepeatedSignals: relevantEvents.length >= 3 || patterns.length >= 1,
      importanceHighCount: highImpCount
    });

    // 5-Part Separation Construction
    const title = `${competitorName}: ${analysisType.replace(/_/g, ' ')} Intelligence (${windowDays}d Window)`;

    const facts = relevantEvents.map(e => 
      `${competitorName} recorded ${e.eventType} event "${e.title}" on ${new Date(e.eventDate).toLocaleDateString()} (Importance: ${e.importance}).`
    );

    const observations = [
      `In the recent 30-day period, ${recentRelEvents.length} ${analysisType.toLowerCase().replace('_', ' ')} signal(s) were observed, compared to ${prevRelEvents.length} in the preceding ${histDays}-day window.`,
      `Overall competitive momentum score is rated at ${momentum.score}/100 (${momentum.level}).`,
      `Dominant event category concentration is ${(momentum.categoryConcentration * 100).toFixed(0)}%.`
    ];

    if (alerts.length > 0) {
      observations.push(`${alerts.length} automated competitive alert(s) were triggered for ${competitorName} during this window.`);
    }

    if (patterns.length > 0) {
      observations.push(`${patterns.length} multi-event Connect-the-Dots pattern(s) were detected involving ${competitorName}.`);
    }

    const inferences = [
      analysisType === 'PRICING_STRATEGY'
        ? `${competitorName}'s recent pricing updates suggest an intentional realignment of commercial tiers to capture market share or optimize ARPU.`
        : analysisType === 'PRODUCT_STRATEGY'
        ? `${competitorName}'s product development velocity indicates prioritized feature deployment aimed at expanding product capabilities.`
        : analysisType === 'HIRING_STRATEGY'
        ? `Recruitment signals indicate target investment in key functional teams ahead of product expansion.`
        : analysisType === 'MARKET_EXPANSION'
        ? `Capital or regional moves suggest active geographic or market segment expansion initiatives.`
        : analysisType === 'COMPETITIVE_ESCALATION'
        ? `Aggressive multi-category events suggest escalating market competition and proactive positioning moves.`
        : `${competitorName} is actively maintaining strategic velocity across key commercial and product vectors.`
    ];

    const implications = [
      `Potential Business Implication: Competitive response planning recommended for sales enablement and product strategy teams regarding ${competitorName}'s latest activity.`,
      `Potential Commercial Impact: Monitor win/loss feedback for pricing and capability pushback from prospective customers.`
    ];

    const unknowns = [
      `Public event telemetry cannot confirm internal board-level timelines or R&D budget allocations for ${competitorName}.`,
      `Customer adoption rates and net revenue impacts resulting from these moves remain unverified without internal revenue telemetry.`
    ];

    const summary = `${competitorName} exhibits ${momentum.level} momentum (${momentum.score}/100) with ${relevantEvents.length} verified ${analysisType.replace(/_/g, ' ')} signals over the last ${windowDays} days.`;

    return {
      title,
      summary,
      analysisType,
      facts,
      observations,
      inferences,
      implications,
      unknowns,
      confidence,
      supportingEvents: relevantEvents,
      momentumMetrics: momentum
    };
  },

  async getAnalyses(organizationId, filters = {}) {
    const rawAnalyses = await analysisRepository.findByOrganization(organizationId, {
      type: 'STRATEGIC',
      ...filters
    });

    // Format & unpack inferences JSON if needed
    const formatted = rawAnalyses.map(a => {
      let inferencesPayload = a.inferences || {};
      let inferencesList = [];
      let implications = [];
      let analysisType = 'COMPETITIVE_MOMENTUM';
      let momentumMetrics = null;

      if (Array.isArray(inferencesPayload)) {
        inferencesList = inferencesPayload;
      } else if (typeof inferencesPayload === 'object' && inferencesPayload !== null) {
        inferencesList = inferencesPayload.inferences || [];
        implications = inferencesPayload.implications || [];
        analysisType = inferencesPayload.analysisType || 'COMPETITIVE_MOMENTUM';
        momentumMetrics = inferencesPayload.momentumMetrics || null;
      }

      // Infer type from title if not explicitly set
      if (analysisType === 'COMPETITIVE_MOMENTUM' && a.title) {
        for (const typeCandidate of SUPPORTED_ANALYSIS_TYPES) {
          if (a.title.includes(typeCandidate.replace(/_/g, ' '))) {
            analysisType = typeCandidate;
            break;
          }
        }
      }

      return {
        ...a,
        analysisType,
        inferencesList,
        implications,
        momentumMetrics
      };
    });

    if (filters.analysisType && filters.analysisType !== 'ALL') {
      return formatted.filter(a => a.analysisType === filters.analysisType);
    }

    return formatted;
  },

  async getAnalysisById(id) {
    const analysis = await analysisRepository.findById(id);
    if (!analysis) {
      const error = new Error(`Strategic analysis record not found with ID ${id}`);
      error.status = 404;
      throw error;
    }

    let inferencesPayload = analysis.inferences || {};
    let inferencesList = [];
    let implications = [];
    let analysisType = 'COMPETITIVE_MOMENTUM';
    let momentumMetrics = null;

    if (Array.isArray(inferencesPayload)) {
      inferencesList = inferencesPayload;
    } else if (typeof inferencesPayload === 'object' && inferencesPayload !== null) {
      inferencesList = inferencesPayload.inferences || [];
      implications = inferencesPayload.implications || [];
      analysisType = inferencesPayload.analysisType || 'COMPETITIVE_MOMENTUM';
      momentumMetrics = inferencesPayload.momentumMetrics || null;
    }

    return {
      ...analysis,
      analysisType,
      inferencesList,
      implications,
      momentumMetrics
    };
  }
};

export default strategicAnalysisService;
