import { getPrismaClient } from '../config/database.js';

const localHashCache = new Set();

export async function isDuplicateEvent(normalizedItem) {
  const { competitorId, contentHash, sourceUrl, eventDate } = normalizedItem;

  // 1. Check local hash cache (fast in-memory lookup)
  if (localHashCache.has(contentHash)) {
    return { isDuplicate: true, reason: 'HASH_MATCH_LOCAL_CACHE' };
  }

  // 2. Check PostgreSQL database if connected
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const existingHashEvent = await prisma.competitorEvent.findFirst({
        where: {
          competitorId,
          contentHash
        }
      });

      if (existingHashEvent) {
        localHashCache.add(contentHash);
        return { isDuplicate: true, reason: 'HASH_MATCH_DATABASE', existingEvent: existingHashEvent };
      }
    } catch (err) {
      // Database check failed or unconfigured, fallback safely
    }
  }

  return { isDuplicate: false };
}

export function recordEventHash(contentHash) {
  if (contentHash) {
    localHashCache.add(contentHash);
  }
}
