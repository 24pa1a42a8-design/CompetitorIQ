import crypto from 'crypto';
import { classifyEvent } from './classifier.js';
import { resolveCompetitorFromSource } from './competitorResolver.js';
import { extractPublicationDate } from './dateExtractor.js';

export function generateContentHash(competitorId, title, summary, eventDate) {
  const dateStr = eventDate
    ? (eventDate instanceof Date ? eventDate : new Date(eventDate)).toISOString().substring(0, 10)
    : 'nodate';
  const normalizedString = `${competitorId.toLowerCase().trim()}:${title.toLowerCase().trim()}:${summary.toLowerCase().trim()}:${dateStr}`;
  return crypto.createHash('sha256').update(normalizedString).digest('hex');
}

export function sanitizeText(text = '') {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeIngestionItem(rawItem) {
  // Deterministically resolve competitor from source URL, publisher, and identity metadata
  const resolvedComp = resolveCompetitorFromSource(rawItem);

  const competitorId = resolvedComp ? resolvedComp.slug : (rawItem.competitorId || rawItem.competitor || 'general-competitor').toString().trim();
  const competitorName = resolvedComp ? resolvedComp.name : (rawItem.competitorName || rawItem.competitor || competitorId).toString().trim();
  const title = sanitizeText(rawItem.title || rawItem.summary || 'Competitor Intelligence Event');
  const summary = sanitizeText(rawItem.summary || rawItem.description || title);
  const description = sanitizeText(rawItem.description || '');
  const source = sanitizeText(rawItem.source || 'Public Web Telemetry');
  const sourceUrl = (rawItem.sourceUrl || rawItem.url || `https://intelligence.competitoriq.com/sources/${competitorId}`).trim();
  
  // Extract real source publication date
  const extractedDate = extractPublicationDate(rawItem);
  const eventDate = extractedDate || (rawItem.eventDate ? new Date(rawItem.eventDate) : null);
  const detectedAt = rawItem.detectedAt ? new Date(rawItem.detectedAt) : new Date();

  const rawType = (rawItem.eventType || '').toUpperCase().trim();
  const EVENT_TYPE_MAP = {
    PRICING: 'PRICING',
    PRICING_CHANGE: 'PRICING',
    PRICE: 'PRICING',
    PRODUCT: 'PRODUCT',
    PRODUCT_LAUNCH: 'PRODUCT',
    FEATURE: 'FEATURE',
    FEATURE_RELEASE: 'FEATURE',
    MESSAGING: 'MESSAGING',
    MESSAGING_CHANGE: 'MESSAGING',
    HIRING: 'HIRING',
    HIRING_SPIKE: 'HIRING',
    FUNDING: 'FUNDING',
    PARTNERSHIP: 'PARTNERSHIP',
    LEADERSHIP: 'LEADERSHIP',
    EXPANSION: 'EXPANSION',
    ANNOUNCEMENT: 'ANNOUNCEMENT'
  };

  const eventType = EVENT_TYPE_MAP[rawType] || classifyEvent(title, summary, description);
  const rawImportance = typeof rawItem.importance === 'string'
    ? rawItem.importance
    : (typeof rawItem.severity === 'string'
        ? rawItem.severity
        : (typeof rawItem.importance === 'number' && rawItem.importance >= 80 ? 'HIGH' : 'MEDIUM'));
  const importance = (rawImportance || 'MEDIUM').toUpperCase();
  const confidence = typeof rawItem.confidence === 'number' ? Math.min(1.0, Math.max(0.1, rawItem.confidence)) : 0.95;
  const evidenceExcerpt = sanitizeText(rawItem.evidence || rawItem.excerpt || summary);

  const imageUrl = rawItem.imageUrl || rawItem.image || null;
  const author = rawItem.author || null;
  const category = rawItem.category || null;
  const contentHash = generateContentHash(competitorId, title, summary, eventDate);

  return {
    competitorId,
    competitorName,
    eventType,
    title,
    summary,
    description,
    source,
    sourceUrl,
    imageUrl,
    author,
    category,
    eventDate,
    detectedAt,
    importance,
    confidence,
    evidenceExcerpt,
    contentHash
  };
}
