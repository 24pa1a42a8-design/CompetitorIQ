import { HindsightClient } from '@vectorize-io/hindsight-client';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class HindsightAppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'HindsightAppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

let clientInstance = null;

export function isHindsightConfigured() {
  return Boolean(env.HINDSIGHT_API_KEY && env.HINDSIGHT_API_KEY.trim().length > 0);
}

export function getBankId() {
  return env.HINDSIGHT_BANK_ID && env.HINDSIGHT_BANK_ID.trim().length > 0
    ? env.HINDSIGHT_BANK_ID
    : 'competitorIQ';
}

export function getHindsightClient() {
  if (!isHindsightConfigured()) {
    throw new HindsightAppError(
      'HINDSIGHT_NOT_CONFIGURED',
      'Hindsight API credentials are not configured on the backend server.',
      503
    );
  }

  return new HindsightClient({
    apiKey: env.HINDSIGHT_API_KEY,
    baseUrl: env.HINDSIGHT_API_URL
  });
}

export function handleHindsightApiError(err) {
  if (err instanceof HindsightAppError) {
    throw err;
  }

  const message = err.message || 'Hindsight service operation failed';

  if (err.name === 'AbortError' || message.includes('timeout') || message.includes('ETIMEDOUT')) {
    throw new HindsightAppError('HINDSIGHT_TIMEOUT', 'Hindsight operation timed out.', 504);
  }

  if (message.includes('401') || message.includes('403') || message.includes('Unauthorized') || message.includes('Forbidden')) {
    throw new HindsightAppError('HINDSIGHT_AUTH_FAILED', 'Hindsight API authorization failed.', 401);
  }

  if (message.includes('400') || message.includes('Bad Request') || message.includes('invalid')) {
    throw new HindsightAppError('HINDSIGHT_INVALID_REQUEST', `Invalid request to Hindsight API: ${message}`, 400);
  }

  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND') || message.includes('fetch failed')) {
    throw new HindsightAppError('HINDSIGHT_UNAVAILABLE', 'Unable to reach Hindsight memory service.', 503);
  }

  throw new HindsightAppError('HINDSIGHT_REQUEST_FAILED', `Hindsight request failed: ${message}`, 500);
}
