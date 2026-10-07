/**
 * In-Memory Executive Report Cache & Single-Flight Request Guard
 * High-performance, fail-safe TTL caching with stale-while-revalidate support.
 */

class ReportCache {
  constructor(defaultTtlMs = 60000) {
    this.cache = new Map();
    this.inFlight = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  makeKey(organizationId, reportType, windowDays, competitorIds = []) {
    const compKey = Array.isArray(competitorIds) && competitorIds.length > 0 
      ? competitorIds.sort().join(',') 
      : 'all';
    return `report:${organizationId || 'default'}:${reportType || 'EXECUTIVE_SUMMARY'}:${windowDays || 90}:${compKey}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.defaultTtlMs;
    return {
      data: entry.data,
      isExpired,
      cachedAt: entry.timestamp
    };
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }

  /**
   * Execute generator with single-flight request guard and cache
   */
  async getOrGenerate(organizationId, reportType, windowDays, competitorIds, generatorFn, forceRefresh = false) {
    const key = this.makeKey(organizationId, reportType, windowDays, competitorIds);

    const cached = this.get(key);

    // Stale-while-revalidate: if a valid or stale cached report exists, return immediately!
    if (cached && cached.data) {
      if (forceRefresh || cached.isExpired) {
        // Asynchronously refresh in background
        if (!this.inFlight.has(key)) {
          const bgPromise = (async () => {
            try {
              const freshData = await generatorFn();
              if (freshData && freshData.success) {
                this.set(key, freshData);
              }
              return freshData;
            } catch (err) {
              return cached.data;
            } finally {
              this.inFlight.delete(key);
            }
          })();
          this.inFlight.set(key, bgPromise);
        }
      }
      return cached.data;
    }

    // If single flight request already in progress, return existing promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    // Cold start generation (no previous cache)
    const promise = (async () => {
      try {
        const freshData = await generatorFn();
        if (freshData && freshData.success) {
          this.set(key, freshData);
        }
        return freshData;
      } catch (err) {
        if (cached && cached.data) {
          return cached.data;
        }
        throw err;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }
}

export const reportCache = new ReportCache(60000);
