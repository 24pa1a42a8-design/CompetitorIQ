import { getHindsightClient, getBankId, handleHindsightApiError, HindsightAppError } from './hindsightClient.js';
import { logger } from '../config/logger.js';

export async function retainCompetitorEvent(event) {
  if (!event || typeof event !== 'object') {
    throw new HindsightAppError('HINDSIGHT_INVALID_REQUEST', 'Event payload must be a valid object.', 400);
  }

  const competitorId = (event.competitorId || event.entity || '').trim();
  const competitorName = (event.competitorName || event.entity || competitorId || 'Unknown Competitor').trim();
  const eventId = event.eventId || `evt-${Date.now()}`;
  const eventType = (event.eventType || event.category || 'GENERAL_SIGNAL').toUpperCase();
  const title = (event.title || event.summary || '').trim();
  const summary = (event.summary || event.description || title || '').trim();
  const description = (event.description || '').trim();
  const eventDate = event.eventDate || event.timestamp || new Date().toISOString();
  const source = event.source || 'Verified Competitive Intelligence Ingestion';
  const sourceUrl = event.sourceUrl || '';
  const importance = event.importance || event.impact || 80;
  const confidence = event.confidence || event.reliability || 'HIGH';

  if (!title || !summary) {
    throw new HindsightAppError(
      'HINDSIGHT_INVALID_REQUEST',
      'Event must contain a valid title and summary before retaining to Hindsight memory.',
      400
    );
  }

  // Content normalization into structured natural language for optimal semantic embedding
  const normalizedText = [
    `Competitive intelligence event for ${competitorName} (${competitorId || 'N/A'}).`,
    `Event Category: ${eventType}.`,
    `Title: ${title}.`,
    `Summary: ${summary}.`,
    description ? `Detailed Description: ${description}.` : '',
    `Event Date: ${eventDate}.`,
    `Source: ${source}${sourceUrl ? ` (${sourceUrl})` : ''}.`,
    `Context: Stored as verified intelligence in Hindsight vector bank.`
  ].filter(Boolean).join('\n');

  const metadata = {
    competitorId,
    competitorName,
    eventId,
    eventType,
    eventDate,
    source,
    sourceUrl,
    importance: Number(importance),
    confidence: String(confidence),
    collectedAt: new Date().toISOString()
  };

  const tags = [
    `competitor:${competitorName.toLowerCase().replace(/\s+/g, '-')}`,
    `type:${eventType.toLowerCase()}`,
    'competitoriq-intelligence'
  ];

  const bankId = getBankId();

  try {
    const client = getHindsightClient();
    
    logger.info(
      { bankId, competitorName, eventId, eventType },
      'Retaining normalized competitor signal into Hindsight memory'
    );

    const result = await client.retain(bankId, normalizedText, {
      metadata,
      tags,
      context: `Competitive intelligence record for ${competitorName}`
    });

    return {
      success: true,
      bankId,
      eventId,
      competitorId,
      competitorName,
      eventType,
      retainedAt: new Date().toISOString(),
      hindsightResult: result
    };
  } catch (err) {
    logger.error(
      { bankId, competitorName, eventId, err: err.message },
      'Failed to retain signal into Hindsight memory'
    );
    return handleHindsightApiError(err);
  }
}
