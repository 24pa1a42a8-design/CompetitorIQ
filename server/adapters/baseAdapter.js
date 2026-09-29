import { fetchPublicSource } from './httpFetcher.js';
import { parseSourceContent } from './htmlParser.js';
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

    if (!fetchResult.success) {
      logger.warn({ adapter: this.name, url: sourceConfig.url, error: fetchResult.error }, 'Source adapter fetch failed or restricted');
      return {
        success: false,
        items: [],
        error: fetchResult.error || 'Fetch failed',
        fetchedAt: fetchResult.fetchedAt
      };
    }

    // 2. Parse step
    const parsed = this.parse(fetchResult.content, {
      sourceUrl: sourceConfig.url,
      defaultTitle: `${sourceConfig.competitorName} ${this.name} Telemetry`,
      contentType: fetchResult.contentType
    });

    // 3. Map into raw ingestion items for ingestionService
    const rawItems = (parsed.items || []).map(item => ({
      competitorName: sourceConfig.competitorName || 'Competitor',
      eventType: this.eventTypeHint,
      title: item.title,
      summary: item.summary,
      source: sourceConfig.publisher || sourceConfig.id || this.name,
      sourceUrl: item.sourceUrl || sourceConfig.url,
      publishedDate: item.publishedDate || fetchResult.fetchedAt,
      evidence: item.evidence || item.summary || item.title,
      confidence: 0.92
    }));

    return {
      success: true,
      count: rawItems.length,
      items: rawItems,
      fetchedAt: fetchResult.fetchedAt
    };
  }
}

export default BaseSourceAdapter;
