import { URL } from 'node:url';
import { ALLOWED_DOMAINS } from '../config/sourcesConfig.js';

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i
];

export function validateSourceUrl(urlString, options = {}) {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('URL string is required for SSRF validation.');
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    throw new Error(`Invalid URL format: '${urlString}'`);
  }

  // 1. Validate Scheme
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Forbidden URL protocol '${parsed.protocol}'. Only http: and https: are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Disallow Private / Internal IP Addresses and Localhost
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(`Security Violation: Access to private or internal address '${hostname}' is prohibited (SSRF Defense).`);
    }
  }

  // 3. Domain Whitelist Verification (if strictly enforced or configured)
  const allowedList = options.allowedDomains || ALLOWED_DOMAINS;
  if (allowedList && allowedList.length > 0) {
    const isAllowed = allowedList.some(domain => {
      const d = domain.toLowerCase();
      return hostname === d || hostname.endsWith(`.${d}`);
    });

    if (!isAllowed) {
      throw new Error(`Domain Restriction: '${hostname}' is not in the configured allowed public domain whitelist.`);
    }
  }

  return {
    valid: true,
    url: parsed.href,
    hostname,
    protocol: parsed.protocol
  };
}

export default validateSourceUrl;
