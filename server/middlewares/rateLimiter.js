import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
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
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
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
