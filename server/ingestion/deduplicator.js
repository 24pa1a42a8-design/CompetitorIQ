import { getPrismaClient } from '../config/database.js';

const localHashCache = new Set();

export async function isDuplicateEvent(normalizedItem, options = {}) {
  const { contentHash, sourceUrl, title } = normalizedItem;
  const orgId = options.organizationId || normalizedItem.organizationId || null;
  const cacheKey = orgId ? `${orgId}:${contentHash}` : contentHash;

  // 1. Check local hash cache (fast in-memory lookup)
  if (localHashCache.has(cacheKey)) {
    return { isDuplicate: true, reason: 'HASH_MATCH_LOCAL_CACHE' };
  }

  // 2. Check PostgreSQL database if connected
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const orConditions = [{ contentHash }];
      if (title && title.length > 5) {
        orConditions.push({ title });
      }
      if (sourceUrl && sourceUrl !== '#' && !sourceUrl.includes('intelligence.competitoriq.com') && title) {
        orConditions.push({
          AND: [
            { source: { url: sourceUrl } },
            { title: title }
          ]
        });
      }

      const whereClause = { OR: orConditions };
      if (orgId) {
        whereClause.organizationId = orgId;
      }

      const existingEvent = await prisma.competitorEvent.findFirst({
        where: whereClause,
        include: { source: true, competitor: true }
      });

      if (existingEvent) {
        localHashCache.add(cacheKey);
        const reason = existingEvent.contentHash === contentHash 
          ? 'HASH_MATCH_DATABASE' 
          : (existingEvent.title === title ? 'TITLE_MATCH_DATABASE' : 'CANONICAL_URL_MATCH');
        return { isDuplicate: true, reason, existingEvent };
      }
    } catch (err) {
      // Database check fallback
    }
  }

  return { isDuplicate: false };
}

export function recordEventHash(contentHash, orgId = null) {
  if (contentHash) {
    const cacheKey = orgId ? `${orgId}:${contentHash}` : contentHash;
    localHashCache.add(cacheKey);
  }
}

export default {
  isDuplicateEvent,
  recordEventHash
};
