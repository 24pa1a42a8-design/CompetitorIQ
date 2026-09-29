import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';

  logger.error({
    err: {
      code: errorCode,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined
    },
    req: {
      method: req.method,
      url: req.url,
      id: req.id
    }
  }, 'Unhandled Exception');

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: message,
      ...(err.details ? { details: err.details } : {})
    },
    meta: {
      requestId: req.id || undefined,
      timestamp: new Date().toISOString()
    }
  });
}
