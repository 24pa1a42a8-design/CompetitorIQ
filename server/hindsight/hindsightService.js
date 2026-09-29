import { isHindsightConfigured, getBankId } from './hindsightClient.js';
import { retainCompetitorEvent } from './retainFlow.js';
import { recallCompetitor, recallCompetitorEvents, recallRelatedSignals } from './recallFlow.js';
import { reflectCompetitorStrategy, reflectCrossCompetitorPatterns } from './reflectFlow.js';

export const hindsightService = {
  isConfigured: isHindsightConfigured,
  getBankId,
  retain: retainCompetitorEvent,
  recall: recallCompetitor,
  recallEvents: recallCompetitorEvents,
  recallSignals: recallRelatedSignals,
  reflect: reflectCompetitorStrategy,
  reflectPatterns: reflectCrossCompetitorPatterns,
  getStats: async function () {
    const configured = isHindsightConfigured();
    return {
      status: configured ? 'Connected to Hindsight Engine' : 'Hindsight Not Configured',
      bankId: getBankId(),
      isConfigured: configured
    };
  }
};

export default hindsightService;
