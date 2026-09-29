import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'HINDSIGHT_API_KEY',
      'LLM_API_KEY',
      'DATABASE_URL'
    ],
    remove: true
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
