import { logger } from '../config/logger.js';

/**
 * Middleware to enforce ADMIN role authorization on administrative routes
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required for administrative route access.'
      }
    });
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn({ user: req.user, path: req.path }, 'Rejected non-admin request on administrative route');
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied: Administrative privileges required for this operation.'
      }
    });
  }

  next();
}

export default adminMiddleware;
