import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

export const httpLogger = pinoHttp({
  logger,
  genReqId: function (req) {
    return req.headers['x-request-id'] || crypto.randomUUID();
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  }
});
