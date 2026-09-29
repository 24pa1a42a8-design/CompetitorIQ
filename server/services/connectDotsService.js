import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { analysisRepository } from '../repositories/analysisRepository.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { logger } from '../config/logger.js';

export const PATTERN_RULES = [
  {
    patternType: 'PRICING_TO_PRODUCT',
    name: 'Pricing Strategy → Product Launch Sequence',
    matches(evtA, evtB, daysDiff) {
      return evtA.eventType === 'PRICING' && 
             (evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 30;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const confidence = daysDiff <= 14 && (evtA.confidence || 0.8) >= 0.85 ? 'HIGH' : 'MEDIUM';
      return {
        patternType: 'PRICING_TO_PRODUCT',
        title: `${compName}: Pricing Shift Followed by Product Release`,
        summary: `${compName} adjusted pricing structure on ${new Date(evtA.eventDate).toLocaleDateString()}, followed ${daysDiff} days later by a product announcement.`,
        confidence,
        facts: [
          `${compName} published a PRICING event ("${evtA.title}") on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} published a PRODUCT event ("${evtB.title}") on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Product release occurred ${daysDiff} day(s) after the pricing update.`,
          `Both events occurred within a 30-day tactical window.`
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
    patternType: 'PRODUCT_TO_MESSAGING',
    name: 'Product Release → Positioning Shift',
    matches(evtA, evtB, daysDiff) {
      return (evtA.eventType === 'PRODUCT' || evtA.eventType === 'FEATURE') && 
             evtB.eventType === 'MESSAGING' &&
             daysDiff >= 0 && daysDiff <= 45;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const confidence = daysDiff <= 14 ? 'HIGH' : 'MEDIUM';
      return {
        patternType: 'PRODUCT_TO_MESSAGING',
        title: `${compName}: Product Launch Followed by Positioning Shift`,
        summary: `${compName} launched "${evtA.title}", followed ${daysDiff} days later by a market messaging update.`,
        confidence,
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
  },
  {
    patternType: 'HIRING_TO_PRODUCT',
    name: 'Recruitment Surge → Capability Launch',
    matches(evtA, evtB, daysDiff) {
      return evtA.eventType === 'HIRING' && 
             (evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 60;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const confidence = (evtA.importance === 'HIGH' || evtA.importance === 'CRITICAL') ? 'HIGH' : 'MEDIUM';
      return {
        patternType: 'HIRING_TO_PRODUCT',
        title: `${compName}: Hiring Activity Precedes Product Launch`,
        summary: `${compName} registered hiring activity ("${evtA.title}"), followed ${daysDiff} days later by product launch ("${evtB.title}").`,
        confidence,
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
    patternType: 'FUNDING_TO_EXPANSION',
    name: 'Capital Injection → Market Expansion',
    matches(evtA, evtB, daysDiff) {
      return evtA.eventType === 'FUNDING' && 
             (evtB.eventType === 'EXPANSION' || evtB.eventType === 'PRODUCT' || evtB.eventType === 'ANNOUNCEMENT') &&
             daysDiff >= 0 && daysDiff <= 90;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const confidence = 'HIGH';
      return {
        patternType: 'FUNDING_TO_EXPANSION',
        title: `${compName}: Capital Investment Followed by Expansion`,
        summary: `${compName} secured funding ("${evtA.title}"), followed ${daysDiff} days later by expansion activity ("${evtB.title}").`,
        confidence,
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
          ` telemetry cannot establish what percentage of funds were earmarked directly for this expansion.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  },
  {
    patternType: 'PARTNERSHIP_TO_PRODUCT',
    name: 'Strategic Partnership → Ecosystem Capability',
    matches(evtA, evtB, daysDiff) {
      return evtA.eventType === 'PARTNERSHIP' && 
             (evtB.eventType === 'PRODUCT' || evtB.eventType === 'FEATURE') &&
             daysDiff >= 0 && daysDiff <= 60;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      const confidence = 'HIGH';
      return {
        patternType: 'PARTNERSHIP_TO_PRODUCT',
        title: `${compName}: Strategic Partnership Precedes Product Feature`,
        summary: `${compName} formed partnership ("${evtA.title}"), followed ${daysDiff} days later by product capability ("${evtB.title}").`,
        confidence,
        facts: [
          `${compName} announced PARTNERSHIP "${evtA.title}" on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} launched PRODUCT feature "${evtB.title}" on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Product capability was announced ${daysDiff} day(s) after partner alignment.`
        ],
        inferences: [
          `The partnership likely provided joint technology or integration access required for the product release.`
        ],
        unknowns: [
          `Evidence does not verify if integration engineering was co-developed prior to public partner announcement.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  },
  {
    patternType: 'LEADERSHIP_TO_MESSAGING',
    name: 'Leadership Transition → Strategic Pivot',
    matches(evtA, evtB, daysDiff) {
      return evtA.eventType === 'LEADERSHIP' && 
             (evtB.eventType === 'MESSAGING' || evtB.eventType === 'EXPANSION') &&
             daysDiff >= 0 && daysDiff <= 60;
    },
    evaluate(compName, evtA, evtB, daysDiff) {
      return {
        patternType: 'LEADERSHIP_TO_MESSAGING',
        title: `${compName}: Executive Change Followed by Messaging Pivot`,
        summary: `${compName} registered executive leadership change ("${evtA.title}"), followed ${daysDiff} days later by positioning shift ("${evtB.title}").`,
        confidence: 'HIGH',
        facts: [
          `${compName} announced LEADERSHIP change "${evtA.title}" on ${new Date(evtA.eventDate).toLocaleDateString()}.`,
          `${compName} updated MESSAGING positioning "${evtB.title}" on ${new Date(evtB.eventDate).toLocaleDateString()}.`
        ],
        observations: [
          `Positioning shift occurred ${daysDiff} day(s) after executive transition.`
        ],
        inferences: [
          `New executive leadership appears to be steering strategic messaging and commercial orientation.`
        ],
        unknowns: [
          `Source telemetry does not confirm whether positioning update was drafted prior to new leader's appointment.`
        ],
        supportingEventIds: [evtA.id, evtB.id],
        events: [evtA, evtB]
      };
    }
  }
];

export const connectDotsService = {
  async analyzePatterns({ organizationId = 'default-org', competitorId = null, windowDays = 90 }) {
    logger.info({ organizationId, competitorId, windowDays }, 'Beginning Connect-the-Dots multi-event pattern analysis');

    // 1. Fetch historical events from PostgreSQL database
    const events = await competitorEventRepository.searchEvents({
      organizationId,
      competitorId: competitorId || undefined,
      limit: 100
    });

    if (!events || events.length === 0) {
      return {
        success: true,
        patternsFound: 0,
        patterns: [],
        message: 'No events found in PostgreSQL database for relationship analysis.'
      };
    }

    // 2. Group events by competitor
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

    // 3. Evaluate relationships chronologically for each competitor
    for (const cId of Object.keys(groupedByComp)) {
      const compGroup = groupedByComp[cId];
      const compName = compGroup.competitor?.name || 'Competitor';
      
      // Sort chronologically ascending
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

      // Check for REPEATED_SIGNAL pattern (>= 3 events of same category within windowDays)
      const typeCounts = {};
      for (const evt of compEvents) {
        typeCounts[evt.eventType] = (typeCounts[evt.eventType] || []);
        typeCounts[evt.eventType].push(evt);
      }

      for (const [type, typeEvts] of Object.entries(typeCounts)) {
        if (typeEvts.length >= 3) {
          const firstEvt = typeEvts[0];
          const lastEvt = typeEvts[typeEvts.length - 1];
          const daysSpan = Math.round((new Date(lastEvt.eventDate) - new Date(firstEvt.eventDate)) / (1000 * 60 * 60 * 24));
          
          if (daysSpan <= windowDays) {
            detectedPatterns.push({
              patternType: 'REPEATED_SIGNAL',
              title: `${compName}: Repeated ${type} Activity Cluster (${typeEvts.length} Events)`,
              summary: `${compName} recorded ${typeEvts.length} separate ${type} events within a ${daysSpan}-day period.`,
              confidence: 'HIGH',
              facts: typeEvts.map(e => `${compName} posted ${type} event "${e.title}" on ${new Date(e.eventDate).toLocaleDateString()}.`),
              observations: [
                `Cluster of ${typeEvts.length} ${type} events detected within ${daysSpan} days.`
              ],
              inferences: [
                `Repeated category activity signals a concentrated strategic push in ${type.toLowerCase()} domain.`
              ],
              unknowns: [
                `Specific internal roadmap budget allocations for this cluster remain unverified.`
              ],
              organizationId,
              competitorId: cId,
              supportingEventIds: typeEvts.map(e => e.id),
              events: typeEvts
            });
          }
        }
      }
    }

    // 4. Optional Hindsight Memory Context (Degrades safely if credits unavailable)
    let hindsightStatus = 'NOT_ATTEMPTED';
    let hindsightNotes = null;

    try {
      const recallRes = await hindsightService.recall('Cross-event strategic patterns and competitor sequences', 3);
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
        'Hindsight memory context recall unavailable for Connect-the-Dots analysis; using PostgreSQL evidence truth'
      );
    }

    // 5. Persist unique detected patterns into PostgreSQL Analysis table
    const persistedPatterns = [];

    for (const pattern of detectedPatterns) {
      const existing = await analysisRepository.findExistingPattern(
        organizationId,
        pattern.competitorId,
        pattern.title
      );

      if (existing) {
        persistedPatterns.push({
          ...existing,
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
          patternType: pattern.patternType,
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
    const rawAnalyses = await analysisRepository.findByOrganization(organizationId, {
      type: 'CONNECT_DOTS',
      ...filters
    });

    return rawAnalyses;
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
