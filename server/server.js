import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { monitoringScheduler } from './services/monitoringScheduler.js';

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
      frontendUrl: env.FRONTEND_URL
    },
    `CompetitorIQ Backend Server listening on port ${env.PORT}`
  );

  // Initialize & start continuous competitor monitoring scheduler
  if (env.NODE_ENV !== 'test') {
    monitoringScheduler.start(5 * 60 * 1000); // 5-minute background tick check
  }
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Initiating graceful shutdown...`);
  monitoringScheduler.stop();
  server.close(() => {
    logger.info('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
