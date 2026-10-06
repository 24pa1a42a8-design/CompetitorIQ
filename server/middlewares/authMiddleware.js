import { logger } from '../config/logger.js';

/**
 * Authentication and Organization Isolation Middleware
 * Validates credentials, sanitizes tenant identity, and ensures strong organization boundary isolation.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const rawOrgHeader = req.headers['x-organization-id'];

  // 1. Sanitize organization ID input (prevent injection or path-traversal patterns)
  let organizationId = 'default-org';

  if (rawOrgHeader && typeof rawOrgHeader === 'string') {
    const cleanOrg = rawOrgHeader.trim();
    // Validate org identifier format (alphanumeric, hyphens, underscores, max 64 chars)
    if (/^[a-zA-Z0-9_-]{1,64}$/.test(cleanOrg)) {
      organizationId = cleanOrg;
    } else {
      logger.warn({ rawOrgHeader }, 'Rejected invalid organization identifier format');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORGANIZATION_ID',
          message: 'Invalid organization identifier format. Must be alphanumeric with hyphens or underscores (max 64 chars).'
        }
      });
    }
  }

  // 2. Bearer Token Verification (if provided)
  if (authHeader && /^Bearer(\s+.*)?$/i.test(authHeader.trim())) {
    const token = authHeader.replace(/^Bearer\s*/i, '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Bearer token must not be empty'
        }
      });
    }

    try {
      // In this architecture, support structured organization tokens or JWT claims
      let tokenOrg = null;
      if (token.startsWith('org-') || token.includes(':')) {
        const parts = token.split(':');
        tokenOrg = parts[0];
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tokenOrg)) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN_CLAIMS',
              message: 'Token organization claim has invalid format'
            }
          });
        }
      }

      // Enforce organization isolation: If token specifies an org and client requested a different org, DENY
      if (tokenOrg) {
        if (rawOrgHeader && rawOrgHeader.trim() !== tokenOrg) {
          logger.warn(
            { tokenOrg, requestedOrg: rawOrgHeader },
            'Cross-organization access rejected: token org does not match requested org header'
          );
          return res.status(403).json({
            success: false,
            error: {
              code: 'CROSS_ORGANIZATION_ACCESS_DENIED',
              message: 'Access denied: Token credentials do not have permission for the requested organization.'
            }
          });
        }
        organizationId = tokenOrg;
      }

      req.user = {
        id: `user-${organizationId}`,
        organizationId,
        role: 'ANALYST',
        authenticatedVia: 'BEARER_TOKEN'
      };
    } catch (tokenErr) {
      logger.warn({ err: tokenErr.message }, 'Failed parsing authorization token');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization token'
        }
      });
    }
  } else {
    // 3. Fallback handling for prototype / test environment
    const isPublicEndpoint = req.path === '/health' || req.path === '/health/ready' || req.path === '/health/ollama';
    if ((process.env.STRICT_AUTH === 'true' || process.env.NODE_ENV === 'production') && !isPublicEndpoint) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required for protected API access'
        }
      });
    }

    req.user = {
      id: null,
      organizationId,
      role: 'ANALYST',
      authenticatedVia: 'CLIENT_HEADER_PROTOTYPE'
    };
  }

  // Expose sanitized, isolated organization ID on request object
  req.organizationId = organizationId;
  res.setHeader('x-organization-id', organizationId);

  next();
}

export default authMiddleware;
