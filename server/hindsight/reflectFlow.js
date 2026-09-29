import { getHindsightClient, getBankId, handleHindsightApiError, HindsightAppError } from './hindsightClient.js';
import { recallCompetitor } from './recallFlow.js';
import { logger } from '../config/logger.js';

export async function reflectCompetitorStrategy(queryText, options = {}) {
  if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
    throw new HindsightAppError('HINDSIGHT_INVALID_REQUEST', 'Query string must be provided for Hindsight reflect.', 400);
  }

  const query = queryText.trim();
  const bankId = getBankId();

  try {
    const client = getHindsightClient();

    logger.info({ bankId, query }, 'Executing strategic pattern reflection across Hindsight memory');

    // First recall relevant memories to assess evidence sufficiency
    const recallResult = await recallCompetitor(query, { limit: 15 });
    const memories = recallResult.memories || [];

    if (memories.length === 0) {
      return {
        query,
        bankId,
        insufficientEvidence: true,
        summary: 'Insufficient historical memory evidence in Hindsight bank to formulate strategic reflections for this query.',
        facts: [],
        observations: [],
        inferences: [],
        unknowns: [
          `No retained signals found matching '${query}'`
        ],
        confidenceScore: '0%'
      };
    }

    // Call official Hindsight reflect API
    const reflectOptions = {
      context: options.context || 'CompetitorIQ Strategic Reasoning Engine',
      budget: options.budget || 'low'
    };

    const response = await client.reflect(bankId, query, reflectOptions);

    const answerText = typeof response === 'string'
      ? response
      : (response?.content || response?.response || response?.text || response?.summary || JSON.stringify(response));

    // Structure response into rigorous analytical categories
    const facts = memories.map(m => m.text).slice(0, 5);
    const observations = [
      `Identified ${memories.length} historical memory signals relevant to query context.`,
      answerText
    ];
    const inferences = [
      `Strategic trajectory indicates ongoing competitive positioning adjustments based on ${memories.length} cross-correlated signals.`
    ];
    const unknowns = memories.length < 3
      ? ['Limited memory sample size — additional signal retention recommended for higher confidence inferences.']
      : [];

    return {
      query,
      bankId,
      insufficientEvidence: false,
      summary: answerText,
      facts,
      observations,
      inferences,
      unknowns,
      confidenceScore: memories.length >= 5 ? '95%' : `${Math.min(90, memories.length * 18)}%`,
      connectedMemoriesCount: memories.length,
      rawResponse: response
    };
  } catch (err) {
    logger.error({ bankId, query, err: err.message }, 'Hindsight reflect operation failed');
    return handleHindsightApiError(err);
  }
}

export async function reflectCrossCompetitorPatterns(queryText, options = {}) {
  return reflectCompetitorStrategy(queryText, options);
}
