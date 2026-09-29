import { SOURCE_CONFIGS } from '../config/sourcesConfig.js';
import adapterIngestionService from './adapterIngestionService.js';
import { logger } from '../config/logger.js';

export const DEFAULT_POLLING_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const MIN_POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class CompetitorMonitoringScheduler {
  constructor() {
    this.enabled = process.env.MONITORING_ENABLED === 'true';
    this.intervalId = null;
    this.isProcessing = false;
    this.activeSourceLocks = new Set();

    this.metrics = {
      totalRuns: 0,
      successfulChecks: 0,
      failedChecks: 0,
      eventsDiscovered: 0,
      duplicatesIgnored: 0,
      alertsGenerated: 0,
      lastRunAt: null,
      nextRunAt: null
    };

    this.sources = new Map();
    this.initializeSources();
  }

  initializeSources() {
    this.sources.clear();
    const sourceList = Object.values(SOURCE_CONFIGS);

    const now = new Date();
    for (const src of sourceList) {
      this.sources.set(src.id, {
        sourceId: src.id,
        competitorName: src.competitorName,
        adapterType: src.adapterType,
        url: src.url,
        publisher: src.publisher,
        enabled: true,
        pollingIntervalMs: src.pollingIntervalMs || DEFAULT_POLLING_INTERVAL_MS,
        lastCheckedAt: null,
        nextScheduledCheckAt: now,
        lastSuccessfulCheckAt: null,
        lastFailureAt: null,
        failureCount: 0,
        lastError: null
      });
    }
  }

  start(tickMs = 60 * 1000, immediateTick = process.env.NODE_ENV !== 'test') {
    if (this.intervalId) return;
    this.enabled = true;
    logger.info({ tickMs, sourcesCount: this.sources.size }, 'Starting Continuous Competitor Monitoring Scheduler');

    // Run immediate check pass asynchronously only if immediateTick is true
    if (immediateTick) {
      this.tick().catch(err => logger.error({ err: err.message }, 'Monitoring scheduler tick error'));
    }

    // Setup recurring interval loop
    this.intervalId = setInterval(() => {
      this.tick().catch(err => logger.error({ err: err.message }, 'Monitoring scheduler tick error'));
    }, tickMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.enabled = false;
    this.isProcessing = false;
    this.activeSourceLocks.clear();
    logger.info('Stopped Continuous Competitor Monitoring Scheduler');
  }

  toggle(enabledState) {
    if (enabledState) {
      this.start();
    } else {
      this.stop();
    }
    return this.enabled;
  }

  async tick() {
    if (!this.enabled || this.isProcessing) return;

    const now = new Date();
    const dueSources = [];

    for (const sourceState of this.sources.values()) {
      if (sourceState.enabled && (!sourceState.nextScheduledCheckAt || new Date(sourceState.nextScheduledCheckAt) <= now)) {
        if (!this.activeSourceLocks.has(sourceState.sourceId)) {
          dueSources.push(sourceState);
        }
      }
    }

    if (dueSources.length === 0) return;

    this.isProcessing = true;
    this.metrics.lastRunAt = now.toISOString();

    logger.info({ dueCount: dueSources.length }, 'Executing scheduled monitoring pass for due competitor sources');

    for (const sourceState of dueSources) {
      await this.processSingleSource(sourceState);
    }

    this.metrics.totalRuns += 1;
    this.metrics.nextRunAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();
    this.isProcessing = false;
  }

  async processSingleSource(sourceState, options = {}) {
    if (this.activeSourceLocks.has(sourceState.sourceId)) {
      logger.info({ sourceId: sourceState.sourceId }, 'Source check skipped; lock already active');
      return { skipped: true, reason: 'Source check currently running' };
    }

    this.activeSourceLocks.add(sourceState.sourceId);
    const now = new Date();
    sourceState.lastCheckedAt = now.toISOString();

    try {
      logger.info({ sourceId: sourceState.sourceId, url: sourceState.url }, 'Scheduler checking public competitor source');

      const result = await adapterIngestionService.triggerSource(sourceState.sourceId, {
        organizationId: options.organizationId || 'default-org',
        mockContent: options.mockContent
      });

      if (result && result.success) {
        sourceState.lastSuccessfulCheckAt = now.toISOString();
        sourceState.failureCount = 0;
        sourceState.lastError = null;

        const batch = result.ingestionBatch || {};
        const discovered = result.collectedCount || 0;
        const dups = result.duplicatesSkipped || batch.duplicatesSkipped || 0;
        const newEvents = Math.max(0, discovered - dups);

        this.metrics.successfulChecks += 1;
        this.metrics.eventsDiscovered += newEvents;
        this.metrics.duplicatesIgnored += dups;

        logger.info(
          { sourceId: sourceState.sourceId, newEvents, duplicates: dups },
          'Competitor source checked successfully'
        );
      } else {
        sourceState.lastFailureAt = now.toISOString();
        sourceState.failureCount += 1;
        sourceState.lastError = result.error || 'Check failed';
        this.metrics.failedChecks += 1;

        logger.warn(
          { sourceId: sourceState.sourceId, error: sourceState.lastError, failures: sourceState.failureCount },
          'Competitor source check returned non-success'
        );
      }
    } catch (err) {
      sourceState.lastFailureAt = now.toISOString();
      sourceState.failureCount += 1;
      sourceState.lastError = err.message || 'Unexpected source check error';
      this.metrics.failedChecks += 1;

      logger.warn(
        { sourceId: sourceState.sourceId, err: err.message, failures: sourceState.failureCount },
        'Competitor source check threw exception; scheduler isolated safely'
      );
    } finally {
      // Calculate next scheduled check time with bounded exponential backoff on failure
      const interval = Math.max(MIN_POLLING_INTERVAL_MS, sourceState.pollingIntervalMs);
      const backoffMultiplier = sourceState.failureCount > 0 ? Math.min(4, sourceState.failureCount) : 1;
      const nextTime = new Date(Date.now() + (interval * backoffMultiplier));
      sourceState.nextScheduledCheckAt = nextTime.toISOString();

      this.activeSourceLocks.delete(sourceState.sourceId);
    }

    return {
      success: sourceState.failureCount === 0,
      sourceState
    };
  }

  async runAllNow(options = {}) {
    const results = [];
    const sourceStates = Array.from(this.sources.values());

    for (const srcState of sourceStates) {
      if (srcState.enabled || options.force) {
        const res = await this.processSingleSource(srcState, options);
        results.push(res);
      }
    }

    return {
      success: true,
      totalExecuted: results.length,
      metrics: this.getStatus()
    };
  }

  getStatus() {
    return {
      enabled: this.enabled,
      isProcessing: this.isProcessing,
      activeLocksCount: this.activeSourceLocks.size,
      metrics: { ...this.metrics },
      sourcesConfigured: this.sources.size,
      sourcesEnabled: Array.from(this.sources.values()).filter(s => s.enabled).length,
      sources: Array.from(this.sources.values())
    };
  }
}

export const monitoringScheduler = new CompetitorMonitoringScheduler();
export default monitoringScheduler;
