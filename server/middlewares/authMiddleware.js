import { logger } from '../config/logger.js';
import { verifyJwt } from '../utils/authUtils.js';

/**
 * Public Endpoints Allowed Without Authentication
 */
const PUBLIC_ENDPOINTS = [
  '/health',
  '/health/ready',
  '/health/ollama',
  '/auth/token',
  '/auth/login'
];

/**
 * Authentication & Organization Isolation Middleware
 * Verifies signed JWT token signatures, extracts verified user identity, and enforces organization boundaries.
 */
export function authMiddleware(req, res, next) {
  const reqPath = req.path || '';
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(p => reqPath === p || reqPath.startsWith(p));

  const authHeader = req.headers.authorization;
  const rawOrgHeader = req.headers['x-organization-id'];

  let token = null;
  if (authHeader && /^Bearer(\s+.*)?$/i.test(authHeader.trim())) {
    token = authHeader.replace(/^Bearer\s*/i, '').trim();
  }

  // 1. Verify token if present
  let verifiedPayload = null;
  if (token) {
    verifiedPayload = verifyJwt(token);
    if (!verifiedPayload) {
      logger.warn({ tokenSnippet: token.slice(0, 15) }, 'Rejected invalid or expired authorization token');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authorization token'
        }
      });
    }
  }

  // 2. Reject unauthenticated access for protected endpoints
  if (!verifiedPayload) {
    if (isPublicEndpoint) {
      // Set default tenant context for public health endpoints
      req.user = {
        id: 'anonymous',
        organizationId: 'default-org',
        role: 'ANONYMOUS'
      };
      req.organizationId = 'default-org';
      return next();
    }

    logger.warn({ path: req.path }, 'Rejected unauthenticated request to protected endpoint');
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required for protected API access'
      }
    });
  }

  // 3. Prevent privilege escalation / cross-tenant header tampering
  const tokenOrg = verifiedPayload.organizationId || 'default-org';
  if (rawOrgHeader && typeof rawOrgHeader === 'string' && rawOrgHeader.trim() !== tokenOrg) {
    logger.warn(
      { tokenOrg, requestedHeaderOrg: rawOrgHeader },
      'Cross-organization access attempt rejected: header org does not match verified token org claim'
    );
    return res.status(403).json({
      success: false,
      error: {
        code: 'CROSS_ORGANIZATION_ACCESS_DENIED',
        message: 'Access denied: Token credentials do not have permission for the requested organization.'
      }
    });
  }

  // 4. Attach verified user and isolated organization ID to request
  req.user = {
    id: verifiedPayload.id || `user-${tokenOrg}`,
    organizationId: tokenOrg,
    role: verifiedPayload.role || 'ANALYST',
    authenticatedVia: 'VERIFIED_JWT'
  };
  req.organizationId = tokenOrg;
  res.setHeader('x-organization-id', tokenOrg);

  next();
}

export default authMiddleware;
