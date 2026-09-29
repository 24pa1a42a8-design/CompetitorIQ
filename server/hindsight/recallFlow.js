import { getHindsightClient, getBankId, handleHindsightApiError, HindsightAppError } from './hindsightClient.js';
import { logger } from '../config/logger.js';

export async function recallCompetitor(queryText, options = {}) {
  if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
    throw new HindsightAppError('HINDSIGHT_INVALID_REQUEST', 'Query string must be provided for Hindsight recall.', 400);
  }

  const query = queryText.trim();
  const bankId = getBankId();
  const limit = options.limit || 10;

  try {
    const client = getHindsightClient();

    logger.info({ bankId, query, limit }, 'Executing semantic memory recall on Hindsight bank');

    const recallOptions = {
      budget: options.budget || 'mid',
      ...(options.tags ? { tags: options.tags } : {})
    };

    const response = await client.recall(bankId, query, recallOptions);

    const rawMemories = Array.isArray(response)
      ? response
      : (response?.memories || response?.results || response?.data || []);

    const memories = rawMemories.slice(0, limit).map((m, idx) => ({
      id: m.id || m.memoryId || m.document_id || `recalled-mem-${idx + 1}`,
      text: m.content || m.text || m.memory || m.summary || '',
      relevanceScore: typeof m.score === 'number' ? m.score : (typeof m.relevance === 'number' ? m.relevance : null),
      metadata: m.metadata || {},
      tags: m.tags || [],
      createdAt: m.timestamp || m.created_at || m.createdAt || null
    }));

    return {
      memories,
      count: memories.length,
      query,
      bankId,
      rawResponse: response
    };
  } catch (err) {
    logger.error({ bankId, query, err: err.message }, 'Hindsight recall operation failed');
    return handleHindsightApiError(err);
  }
}

export async function recallCompetitorEvents(competitorId, queryText, options = {}) {
  const competitorTag = `competitor:${competitorId.toLowerCase().trim().replace(/\s+/g, '-')}`;
  const compositeQuery = `${competitorId} ${queryText || ''}`.trim();
  return recallCompetitor(compositeQuery, {
    ...options,
    tags: [competitorTag]
  });
}

export async function recallRelatedSignals(queryText, options = {}) {
  return recallCompetitor(queryText, options);
}
