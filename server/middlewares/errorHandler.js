import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  logger.error({
    err: {
      code: errorCode,
      message: err.message,
      stack: err.stack
    },
    req: {
      method: req.method,
      url: req.url,
      id: req.id
    }
  }, 'Unhandled Exception');

  const isDev = env.NODE_ENV === 'development';
  const isUserError = statusCode >= 400 && statusCode < 500;

  const safeMessage = (isDev || isUserError) 
    ? (err.message || 'An unexpected error occurred on the server.')
    : 'Internal Server Error';

  const safeCode = (isDev || isUserError) ? errorCode : 'INTERNAL_SERVER_ERROR';

  const responsePayload = {
    success: false,
    data: null,
    error: {
      code: safeCode,
      message: safeMessage,
      ...(isDev && err.details ? { details: err.details } : {})
    },
    meta: {
      requestId: req.id || undefined,
      timestamp: new Date().toISOString()
    }
  };

  res.status(statusCode).json(responsePayload);
}
