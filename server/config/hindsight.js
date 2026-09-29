import { env } from './env.js';
import { logger } from './logger.js';
import { isHindsightConfigured, getHindsightClient, getBankId } from '../hindsight/hindsightClient.js';

export async function checkHindsightHealth() {
  if (!isHindsightConfigured()) {
    return 'not_configured';
  }

  try {
    const client = getHindsightClient();
    const bankId = getBankId();

    // Perform lightweight read/profile call or ping
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      if (typeof client.getBankConfig === 'function') {
        await client.getBankConfig(bankId, { signal: controller.signal });
      } else {
        await fetch(`${env.HINDSIGHT_API_URL}/v1/default/banks`, {
          headers: { 'Authorization': `Bearer ${env.HINDSIGHT_API_KEY}` },
          signal: controller.signal
        });
      }
      clearTimeout(timeoutId);
      return 'ok';
    } catch (apiErr) {
      clearTimeout(timeoutId);
      const msg = apiErr.message || '';
      
      // If authentication failed or key is revoked, return 'error'
      if (msg.includes('Authentication failed') || msg.includes('revoked') || msg.includes('401') || msg.includes('403') || apiErr.statusCode === 401 || apiErr.statusCode === 403) {
        logger.warn({ err: msg }, 'Hindsight API key authentication failed or revoked');
        return 'error';
      }

      // If bank doesn't exist yet (404), the API key itself is authenticated & valid
      if (apiErr.statusCode === 404 || msg.includes('404') || msg.includes('not found')) {
        return 'ok';
      }

      logger.warn({ err: msg }, 'Hindsight health check failed');
      return 'error';
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Hindsight client initialization error during health check');
    return 'error';
  }
}
