import { fetchPublicSource } from './httpFetcher.js';
import { parseSourceContent } from './htmlParser.js';
import { getVerifiedSnapshot } from './snapshots.js';
import { logger } from '../config/logger.js';

export class BaseSourceAdapter {
  constructor(name = 'BaseSourceAdapter', eventTypeHint = 'ANNOUNCEMENT') {
    this.name = name;
    this.eventTypeHint = eventTypeHint;
  }

  async fetch(url, options = {}) {
    return fetchPublicSource(url, options);
  }

  parse(contentString, options = {}) {
    return parseSourceContent(contentString, options);
  }

  async collect(sourceConfig, options = {}) {
    if (!sourceConfig || !sourceConfig.url) {
      throw new Error(`[${this.name}] Source configuration with URL is required.`);
    }

    logger.info({ adapter: this.name, url: sourceConfig.url, competitor: sourceConfig.competitorName }, 'Executing source adapter collection');

    // 1. Fetch step (if mock Content is passed in options for fixture testing, use it directly)
    let fetchResult;
    let fallbackUsed = false;

    if (options.mockContent) {
      fetchResult = {
        success: true,
        statusCode: 200,
        url: sourceConfig.url,
        content: options.mockContent,
        contentType: 'text/html',
        fetchedAt: new Date()
      };
    } else {
      fetchResult = await this.fetch(sourceConfig.url, {
        rateLimitMs: sourceConfig.rateLimitMs,
        allowedDomains: options.allowedDomains
      });
    }

    let contentToParse = fetchResult?.content || null;
    let contentType = fetchResult?.contentType || 'text/html';

    // 2. Hybrid Fallback Strategy (D-20): If live fetch fails/blocked or yields no content, use verified snapshot fallback
    if ((!fetchResult || !fetchResult.success || !contentToParse) && !options.disableSnapshotFallback) {
      const snapshot = getVerifiedSnapshot(sourceConfig);
      if (snapshot) {
        logger.info({ adapter: this.name, sourceId: sourceConfig.id, competitor: sourceConfig.competitorName }, 'Live fetch restricted or failed; using verified snapshot fallback');
        contentToParse = snapshot;
        contentType = snapshot.trim().startsWith('<') ? 'application/xml' : 'text/html';
        fallbackUsed = true;
      }
    }

    if (!contentToParse) {
      logger.warn({ adapter: this.name, url: sourceConfig.url, error: fetchResult?.error }, 'Source adapter fetch failed and no snapshot available');
      return {
        success: false,
        items: [],
        error: fetchResult?.error || 'Fetch failed and snapshot unavailable',
        fetchedAt: fetchResult?.fetchedAt || new Date()
      };
    }

    // 3. Parse step
    const parsed = this.parse(contentToParse, {
      sourceUrl: sourceConfig.url,
      defaultTitle: `${sourceConfig.competitorName} ${this.name} Telemetry`,
      contentType
    });

    // 4. Map into raw ingestion items for ingestionService
    const rawItems = (parsed.items || []).map(item => ({
      competitorName: sourceConfig.competitorName || 'Competitor',
      eventType: this.eventTypeHint,
      title: item.title,
      summary: item.summary,
      source: sourceConfig.publisher || sourceConfig.id || this.name,
      sourceUrl: item.sourceUrl || sourceConfig.url,
      publishedDate: item.publishedDate || fetchResult?.fetchedAt || new Date().toISOString(),
      imageUrl: item.imageUrl || null,
      evidence: item.evidence || item.summary || item.title,
      confidence: fallbackUsed ? 0.98 : 0.92
    }));

    return {
      success: true,
      count: rawItems.length,
      items: rawItems,
      fallbackUsed,
      fetchedAt: fetchResult?.fetchedAt || new Date()
    };
  }
}

export default BaseSourceAdapter;
