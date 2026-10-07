import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { analysisRepository } from '../repositories/analysisRepository.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { logger } from '../config/logger.js';

function calculateEvidenceConfidence(evtA, evtB, daysDiff) {
  let score = 50;

  const urlA = (evtA?.source?.url || '').toLowerCase();
  const urlB = (evtB?.source?.url || '').toLowerCase();
  const officialDomains = ['microsoft.com', 'aws.amazon.com', 'cloud.google.com', 'oracle.com', 'salesforce.com', 'ibm.com'];
  const isOfficialA = officialDomains.some(d => urlA.includes(d));
  const isOfficialB = officialDomains.some(d => urlB.includes(d));

  if (isOfficialA && isOfficialB) {
    score += 25;
  } else if (isOfficialA || isOfficialB) {
    score += 15;
  }

  if (evtA?.competitorId && evtA?.competitorId === evtB?.competitorId) {
    score += 15;
  }

  if (daysDiff <= 14) {
    score += 15;
  } else if (daysDiff <= 30) {
    score += 10;
  }

  if (evtA?.importance === 'HIGH' || evtA?.importance === 'CRITICAL' || evtB?.importance === 'HIGH' || evtB?.importance === 'CRITICAL') {
    score += 10;
  }

  let confidenceLevel = 'LOW';
  if (score >= 85) confidenceLevel = 'HIGH';
  else if (score >= 65) confidenceLevel = 'MEDIUM';

  return { confidence: confidenceLevel, confidenceScore: score };
}

export const PATTERN_RULES = [
  {
    patternType: 'PRICING_PRODUCT',
    name: 'Pricing Strategy → Product Launch Sequence',
    matches(evtA, evtB, daysDiff) {
      return evtA.id !== evtB.id &&
             evtA.eventType === 'PRICING' && 
             (evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 60;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const { confidence, confidenceScore } = calculateEvidenceConfidence(evtA, evtB, daysDiff);
      return {
        patternType: 'PRICING_PRODUCT',
        title: `${compName}: Pricing Shift Followed by Product Release`,
        summary: `${compName} adjusted pricing structure on ${new Date(evtA.eventDate).toLocaleDateString()}, followed ${daysDiff} days later by a product announcement.`,
        confidence,
        confidenceScore,
        facts: [
          `${compName} published a PRICING event ("${evtA.title}") on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} published a PRODUCT event ("${evtB.title}") on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Product release occurred ${daysDiff} day(s) after the pricing update.`,
          `Both events occurred within a 60-day window.`
        ],
        inferences: [
          `The pricing modification may have been structured to establish commercial positioning ahead of the product launch.`
        ],
        unknowns: [
          `Available evidence does not establish whether internal product development directly forced the pricing update.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  },
  {
    patternType: 'HIRING_PRODUCT',
    name: 'Recruitment Surge → Capability Launch',
    matches(evtA, evtB, daysDiff) {
      return evtA.id !== evtB.id &&
             evtA.eventType === 'HIRING' && 
             (evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 90;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const { confidence, confidenceScore } = calculateEvidenceConfidence(evtA, evtB, daysDiff);
      return {
        patternType: 'HIRING_PRODUCT',
        title: `${compName}: Hiring Activity Precedes Product Launch`,
        summary: `${compName} registered hiring activity ("${evtA.title}"), followed ${daysDiff} days later by product launch ("${evtB.title}").`,
        confidence,
        confidenceScore,
        facts: [
          `${compName} published HIRING signal "${evtA.title}" on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} launched PRODUCT feature "${evtB.title}" on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Product launch followed recruitment activity within ${daysDiff} days.`
        ],
        inferences: [
          `Targeted talent acquisition may have accelerated or supported final release readiness.`
        ],
        unknowns: [
          `Available telemetry does not confirm if specific hired individuals contributed directly to this release build.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  },
  {
    patternType: 'FUNDING_EXPANSION',
    name: 'Capital Injection → Market Expansion',
    matches(evtA, evtB, daysDiff) {
      return evtA.id !== evtB.id &&
             evtA.eventType === 'FUNDING' && 
             (evtB.eventType === 'EXPANSION' || evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 180;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const { confidence, confidenceScore } = calculateEvidenceConfidence(evtA, evtB, daysDiff);
      return {
        patternType: 'FUNDING_EXPANSION',
        title: `${compName}: Capital Investment Followed by Expansion`,
        summary: `${compName} secured funding ("${evtA.title}"), followed ${daysDiff} days later by expansion activity ("${evtB.title}").`,
        confidence,
        confidenceScore,
        facts: [
          `${compName} announced FUNDING event "${evtA.title}" on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} initiated EXPANSION move "${evtB.title}" on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Expansion announcement occurred ${daysDiff} day(s) after capital acquisition.`
        ],
        inferences: [
          `Capital injection provided liquidity or strategic backing to execute expansion initiatives.`
        ],
        unknowns: [
          `Source telemetry cannot establish what percentage of funds were earmarked directly for this expansion.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  },
  {
    patternType: 'PRODUCT_TO_MESSAGING',
    name: 'Product Release → Positioning Shift',
    matches(evtA, evtB, daysDiff) {
      return evtA.id !== evtB.id &&
             (evtA.eventType === 'PRODUCT' || evtA.eventType === 'FEATURE') && 
             evtB.eventType === 'MESSAGING' &&
             daysDiff >= 0 && daysDiff <= 45;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const { confidence, confidenceScore } = calculateEvidenceConfidence(evtA, evtB, daysDiff);
      return {
        patternType: 'PRODUCT_TO_MESSAGING',
        title: `${compName}: Product Launch Followed by Positioning Shift`,
        summary: `${compName} launched "${evtA.title}", followed ${daysDiff} days later by a market messaging update.`,
        confidence,
        confidenceScore,
        facts: [
          `${compName} launched product feature "${evtA.title}" on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} updated market messaging ("${evtB.title}") on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Messaging update occurred ${daysDiff} day(s) after product launch.`
        ],
        inferences: [
          `The positioning change appears designed to align competitive narrative with new product capabilities.`
        ],
        unknowns: [
          `Evidence does not verify if market feedback from the product launch prompted the messaging update.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  }
];

export const connectDotsService = {
  async analyzePatterns({ organizationId = 'default-org', competitorId = null, windowDays = 180 }) {
    logger.info({ organizationId, competitorId, windowDays }, 'Beginning Connect-the-Dots multi-event pattern analysis');

    console.log('[HISTORICAL_ANALYSIS] started');

    // Fetch historical events from PostgreSQL database
    const events = await competitorEventRepository.searchEvents({
      organizationId,
      competitorId: competitorId || undefined,
      limit: 5000
    });

    const eventCounts = { PRODUCT: 0, PRICING: 0, HIRING: 0, FUNDING: 0, EXPANSION: 0, FEATURE: 0 };
    const uniqueCompetitors = new Set();
    const uniqueSources = new Set();

    for (const evt of events) {
      if (evt.eventType && eventCounts[evt.eventType] !== undefined) {
        eventCounts[evt.eventType]++;
      }
      if (evt.competitorId) uniqueCompetitors.add(evt.competitorId);
      if (evt.sourceId || evt.source?.url) uniqueSources.add(evt.sourceId || evt.source?.url);
    }

    console.log(`[HISTORICAL_ANALYSIS] competitors loaded: ${uniqueCompetitors.size}`);
    console.log(`[HISTORICAL_ANALYSIS] sources loaded: ${uniqueSources.size}`);
    console.log(`[HISTORICAL_ANALYSIS] product events: ${eventCounts.PRODUCT}`);
    console.log(`[HISTORICAL_ANALYSIS] pricing events: ${eventCounts.PRICING}`);
    console.log(`[HISTORICAL_ANALYSIS] hiring events: ${eventCounts.HIRING}`);
    console.log(`[HISTORICAL_ANALYSIS] funding events: ${eventCounts.FUNDING}`);
    console.log(`[HISTORICAL_ANALYSIS] expansion events: ${eventCounts.EXPANSION}`);

    if (!events || events.length === 0) {
      console.log('[HISTORICAL_ANALYSIS] patterns generated: 0');
      console.log('[HISTORICAL_ANALYSIS] completed');
      return {
        success: true,
        patternsFound: 0,
        patterns: [],
        message: 'No events found in PostgreSQL database for relationship analysis.'
      };
    }

    // Group events by competitor
    const groupedByComp = {};
    for (const evt of events) {
      const cId = evt.competitorId || 'unknown';
      if (!groupedByComp[cId]) {
        groupedByComp[cId] = {
          competitor: evt.competitor,
          events: []
        };
      }
      groupedByComp[cId].events.push(evt);
    }

    const detectedPatterns = [];

    // Evaluate relationships chronologically for each competitor
    for (const cId of Object.keys(groupedByComp)) {
      const compGroup = groupedByComp[cId];
      const compName = compGroup.competitor?.name || 'Competitor';
      
      const compEvents = compGroup.events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      // Scan event pairs
      for (let i = 0; i < compEvents.length; i++) {
        for (let j = i + 1; j < compEvents.length; j++) {
          const evtA = compEvents[i];
          const evtB = compEvents[j];

          const timeDiffMs = new Date(evtB.eventDate).getTime() - new Date(evtA.eventDate).getTime();
          const daysDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

          if (daysDiff < 0 || daysDiff > windowDays) continue;

          for (const rule of PATTERN_RULES) {
            if (rule.matches(evtA, evtB, daysDiff)) {
              const patternData = rule.evaluate(compName, evtA, evtB, daysDiff);
              detectedPatterns.push({
                ...patternData,
                organizationId,
                competitorId: cId
              });
            }
          }
        }
      }
    }

    console.log(`[HISTORICAL_ANALYSIS] patterns generated: ${detectedPatterns.length}`);
    console.log('[HISTORICAL_ANALYSIS] completed');

    // Hindsight recall (non-blocking fallback to ensure ultra-fast response without HTTP timeouts)
    let hindsightStatus = 'POSTGRESQL_EVIDENCE_PRIMARY';
    let hindsightNotes = null;

    // Persist unique detected patterns into PostgreSQL Analysis table
    const persistedPatterns = [];

    for (const pattern of detectedPatterns) {
      const existing = await analysisRepository.findExistingPattern(
        organizationId,
        pattern.competitorId,
        pattern.title
      );

      const patternType = pattern.patternType || (
        pattern.title?.includes('Pricing') ? 'PRICING_PRODUCT' :
        pattern.title?.includes('Hiring') ? 'HIRING_PRODUCT' :
        (pattern.title?.includes('Capital') || pattern.title?.includes('Expansion')) ? 'FUNDING_EXPANSION' :
        'REPEATED_SIGNAL'
      );

      if (existing) {
        persistedPatterns.push({
          ...existing,
          patternType,
          confidence: pattern.confidence,
          confidenceScore: pattern.confidenceScore,
          hindsightStatus,
          hindsightNotes,
          events: pattern.events
        });
      } else {
        const created = await analysisRepository.create({
          organizationId,
          competitorId: pattern.competitorId,
          type: 'CONNECT_DOTS',
          title: pattern.title,
          summary: pattern.summary,
          confidence: pattern.confidence,
          facts: pattern.facts,
          observations: pattern.observations,
          inferences: pattern.inferences,
          unknowns: pattern.unknowns
        });

        persistedPatterns.push({
          ...created,
          patternType,
          confidence: pattern.confidence,
          confidenceScore: pattern.confidenceScore,
          hindsightStatus,
          hindsightNotes,
          events: pattern.events
        });
      }
    }

    return {
      success: true,
      patternsFound: persistedPatterns.length,
      patterns: persistedPatterns,
      hindsightStatus
    };
  },

  async getPatterns(organizationId, filters = {}) {
    let rawPatterns = await analysisRepository.findByOrganization(organizationId, {
      type: 'CONNECT_DOTS',
      competitorId: filters.competitorId,
      confidence: filters.confidence
    });

    if (rawPatterns.length === 0 && !filters.competitorId && !filters.confidence && !filters.patternType) {
      const analysisResult = await this.analyzePatterns({
        organizationId,
        windowDays: 180
      });
      rawPatterns = analysisResult.patterns || [];
    }

    const PATTERN_LABELS = {
      PRICING_PRODUCT: 'Pricing → Product',
      HIRING_PRODUCT: 'Hiring → Product',
      FUNDING_EXPANSION: 'Funding → Expansion',
      PRODUCT_TO_MESSAGING: 'Product → Messaging'
    };

    let patterns = rawPatterns.map(p => {
      const title = p.title || '';
      const patternType = p.patternType || (
        title.includes('Pricing') ? 'PRICING_PRODUCT' :
        title.includes('Hiring') ? 'HIRING_PRODUCT' :
        (title.includes('Capital') || title.includes('Expansion') || title.includes('Funding')) ? 'FUNDING_EXPANSION' :
        'REPEATED_SIGNAL'
      );
      return {
        ...p,
        patternType,
        displayLabel: PATTERN_LABELS[patternType] || 'Pattern Relationship',
        confidence: p.confidence || 'HIGH'
      };
    });

    if (filters.confidence && filters.confidence !== 'ALL') {
      const confReq = filters.confidence.toUpperCase();
      patterns = patterns.filter(p => (p.confidence || '').toUpperCase() === confReq);
    }

    if (filters.patternType && filters.patternType !== 'ALL') {
      const reqType = filters.patternType.toUpperCase();
      patterns = patterns.filter(p => (p.patternType || '').toUpperCase() === reqType);
    }

    return patterns;
  },

  async getPatternById(id) {
    const pattern = await analysisRepository.findById(id);
    if (!pattern) {
      const error = new Error(`Connect-the-Dots pattern analysis not found with ID ${id}`);
      error.status = 404;
      throw error;
    }
    return pattern;
  }
};

export default connectDotsService;
