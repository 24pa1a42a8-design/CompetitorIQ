import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { httpLogger } from './middlewares/loggerMiddleware.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { apiLimiter, ingestionLimiter, agentLimiter } from './middlewares/rateLimitMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import hindsightRoutes from './routes/hindsightRoutes.js';
import ingestionRoutes from './routes/ingestionRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import competitorRoutes from './routes/competitorRoutes.js';
import adapterRoutes from './routes/adapterRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import connectDotsRoutes from './routes/connectDotsRoutes.js';
import strategicAnalysisRoutes from './routes/strategicAnalysisRoutes.js';
import competitiveComparisonRoutes from './routes/competitiveComparisonRoutes.js';
import executiveReportRoutes from './routes/executiveReportRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

const app = express();

// Security headers (configure CSP to allow Vite dev resources)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration (supports env.FRONTEND_URL, localhost, 127.0.0.1 on all ports)
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-organization-id'],
  credentials: true
}));

// Body parsers with payload limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging, Rate Limiting & Organization Isolation
app.use(httpLogger);
app.use(globalRateLimiter);
app.use('/api', apiLimiter);
app.use('/api', authMiddleware);

// Specialized rate limiters
app.use('/api/ingestion', ingestionLimiter);
app.use('/api/agent', agentLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/hindsight', hindsightRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/adapters', adapterRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', alertRoutes);
app.use('/api/v1/notifications', alertRoutes);
app.use('/api/events', (req, res, next) => {
  req.url = '/events' + (req.url === '/' ? '' : req.url);
  return ingestionRoutes(req, res, next);
});
app.use('/api/v1/events', (req, res, next) => {
  req.url = '/events' + (req.url === '/' ? '' : req.url);
  return ingestionRoutes(req, res, next);
});
app.use('/api/connect-dots', connectDotsRoutes);
app.use('/api/strategic-analysis', strategicAnalysisRoutes);
app.use('/api/competitive-comparison', competitiveComparisonRoutes);
app.use('/api/executive-reports', executiveReportRoutes);
app.use('/api/monitoring', monitoringRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`
    },
    meta: {
      requestId: req.id || undefined,
      timestamp: new Date().toISOString()
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
