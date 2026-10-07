import rateLimit from 'express-rate-limit';

const isTestOrLocal = (req) => {
  if (process.env.NODE_ENV === 'test' || Boolean(process.env.TEST_MODE)) return true;
  const ip = req?.ip || req?.socket?.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrLocal,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again after 15 minutes.'
      },
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrLocal,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded for API endpoint. Please slow down.'
      },
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  }
});

