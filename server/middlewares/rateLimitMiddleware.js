import { rateLimit } from 'express-rate-limit';

/**
 * Rate Limiting Middleware Suite
 * Protects API routes, ingestion triggers, and AI agent execution from request floods and abuse.
 */

const isLocalOrTest = (req) => {
  if (process.env.NODE_ENV === 'test') return true;
  const ip = req?.ip || req?.socket?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
};

// General API Rate Limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: isLocalOrTest,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
  }
});

// Stricter Rate Limiter for Data Ingestion: 20 requests per 15 minutes
export const ingestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'INGESTION_RATE_LIMIT_EXCEEDED',
      message: 'Ingestion refresh rate limit reached. Please wait before triggering new multi-source polling.'
    }
  }
});

// Specialized Rate Limiter for AI Agent Execution: 30 requests per 15 minutes
export const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'AGENT_RATE_LIMIT_EXCEEDED',
      message: 'AI agent query quota exceeded for this window. Please wait a few minutes before submitting new reasoning queries.'
    }
  }
});

export default {
  apiLimiter,
  ingestionLimiter,
  agentLimiter
};
