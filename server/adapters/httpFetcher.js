import { validateSourceUrl } from './ssrfValidator.js';
import { logger } from '../config/logger.js';

// Domain-level rate limit tracker
const domainLastFetchMap = new Map();

export async function fetchPublicSource(targetUrl, options = {}) {
  // 1. SSRF Security Validation
  const validated = validateSourceUrl(targetUrl, {
    allowedDomains: options.allowedDomains
  });

  const url = validated.url;
  const hostname = validated.hostname;

  // 2. Domain-Level Rate Limiting
  const rateLimitMs = options.rateLimitMs || 1000;
  const lastFetch = domainLastFetchMap.get(hostname) || 0;
  const now = Date.now();
  const timeElapsed = now - lastFetch;

  if (timeElapsed < rateLimitMs) {
    const delay = rateLimitMs - timeElapsed;
    logger.debug({ hostname, delay }, 'Enforcing domain rate limit delay');
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  domainLastFetchMap.set(hostname, Date.now());

  // 3. HTTP Request Setup
  const timeoutMs = options.timeoutMs || 10000;
  const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : 2;
  const userAgent = options.userAgent || 'CompetitorIQ-Intelligence-Bot/1.0 (+https://competitoriq.com/bot)';

  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(options.headers || {})
  };

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      logger.info({ url, attempt, maxRetries }, 'Fetching public competitor source page');

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timer);

      // Handle HTTP status codes
      if (!response.ok) {
        // Do not retry client errors (401, 403, 404, 429)
        if (response.status >= 400 && response.status < 500) {
          logger.warn({ url, status: response.status }, 'Source access restricted or not found (respecting access control)');
          return {
            success: false,
            statusCode: response.status,
            url,
            content: '',
            contentType: response.headers.get('content-type') || '',
            fetchedAt: new Date(),
            error: `HTTP ${response.status}: Access restricted or not found`
          };
        }

        // Server error (5xx) -> allow retry
        throw new Error(`HTTP ${response.status}: Server Error`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      return {
        success: true,
        statusCode: response.status,
        url,
        content: text,
        contentType,
        fetchedAt: new Date(),
        error: null
      };

    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      const isAbort = err.name === 'AbortError';
      const isRetryable = isAbort || err.message?.includes('Server Error') || err.code === 'ECONNRESET';

      if (attempt <= maxRetries && isRetryable) {
        const backoffMs = Math.pow(2, attempt) * 500; // Exponential backoff: 1s, 2s...
        logger.warn({ url, attempt, backoffMs, err: err.message }, 'Fetch attempt failed; retrying with backoff');
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        break;
      }
    }
  }

  logger.error({ url, err: lastError?.message }, 'Failed to fetch public source after maximum retries');

  return {
    success: false,
    statusCode: 0,
    url,
    content: '',
    contentType: '',
    fetchedAt: new Date(),
    error: lastError?.message || 'Fetch request failed'
  };
}

export default fetchPublicSource;
