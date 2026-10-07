/**
 * Robust Source Publication Date Extractor
 * Extracts authentic, verified publication dates from raw telemetry, metadata, RSS tags,
 * HTML headers, and text patterns.
 */

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export function extractPublicationDate(inputData = {}) {
  // 1. Try explicit raw date fields
  const candidates = [
    inputData.publishedAt,
    inputData.eventDate,
    inputData.publishedDate,
    inputData.pubDate,
    inputData.date,
    inputData.timestamp,
    inputData.published_time,
    inputData.issued
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    if (raw instanceof Date && !isNaN(raw.getTime())) {
      return raw;
    }
    if (typeof raw === 'number' && raw > 1000000000) {
      // Unix timestamp (sec or ms)
      const ts = raw < 10000000000 ? raw * 1000 : raw;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = new Date(raw.trim());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  // 2. Extract date patterns embedded in title, summary, or description
  const textBlob = `${inputData.title || ''} ${inputData.summary || ''} ${inputData.description || ''} ${inputData.url || ''} ${inputData.sourceUrl || ''}`;

  // Pattern A: "October 21, 2024" or "Oct 21 2024" or "October 2024"
  const monthDayYearRegex = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+([0-3]?\d)(?:st|nd|rd|th)?,?\s+(20\d\d)\b/i;
  const matchA = textBlob.match(monthDayYearRegex);
  if (matchA) {
    const monthIndex = MONTH_MAP[matchA[1].toLowerCase()];
    const day = parseInt(matchA[2], 10);
    const year = parseInt(matchA[3], 10);
    if (monthIndex !== undefined && day >= 1 && day <= 31 && year >= 2000) {
      return new Date(Date.UTC(year, monthIndex, day));
    }
  }

  // Pattern B: ISO date "2024-10-21" or "2026/09/15"
  const isoRegex = /\b(20\d\d)[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/;
  const matchB = textBlob.match(isoRegex);
  if (matchB) {
    const year = parseInt(matchB[1], 10);
    const monthIndex = parseInt(matchB[2], 10) - 1;
    const day = parseInt(matchB[3], 10);
    return new Date(Date.UTC(year, monthIndex, day));
  }

  // Pattern C: URL date path like "/2024/10/21/" or "/2024/09/"
  const urlDateRegex = /\/(20\d\d)\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\//;
  const matchC = (inputData.url || inputData.sourceUrl || '').match(urlDateRegex);
  if (matchC) {
    const year = parseInt(matchC[1], 10);
    const monthIndex = parseInt(matchC[2], 10) - 1;
    const day = parseInt(matchC[3], 10);
    return new Date(Date.UTC(year, monthIndex, day));
  }

  // If no authentic date can be extracted, return null (never default to new Date())
  return null;
}
