import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { monitoringScheduler } from './services/monitoringScheduler.js';

import { getPrismaClient, checkDatabaseHealth, disconnectDatabase } from './config/database.js';

let server;

async function startServer() {
  logger.info('Initializing CompetitorIQ Backend Startup Sequence...');

  // 1. Initialize Prisma singleton
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.$connect();
      logger.info('Prisma singleton client connected.');
    } catch (err) {
      logger.warn({ err: err.message }, 'Initial Prisma $connect warning, retrying connection...');
    }
  }

  // 2. Explicit Database Health Verification with exponential backoff
  let dbHealthy = false;
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const health = await checkDatabaseHealth();
    if (health === 'ok') {
      dbHealthy = true;
      logger.info('PostgreSQL database connected and verified successfully.');
      break;
    }
    logger.warn(`PostgreSQL connection check attempt ${attempt}/${maxAttempts} failed. Waiting before retry...`);
    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
  }

  if (!dbHealthy) {
    logger.error('CRITICAL: PostgreSQL database is unreachable after maximum retries. Starting server in degraded mode.');
  }

  // 3. Start Express HTTP Server only after DB readiness verification
  server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        environment: env.NODE_ENV,
        frontendUrl: env.FRONTEND_URL,
        databaseStatus: dbHealthy ? 'connected' : 'degraded'
      },
      `CompetitorIQ Backend Server listening on port ${env.PORT}`
    );

    // Initialize & start continuous competitor monitoring scheduler
    if (env.NODE_ENV !== 'test') {
      monitoringScheduler.start(5 * 60 * 1000); // 5-minute background tick check
    }
  });
}

startServer().catch(err => {
  logger.error({ err: err.message }, 'Fatal error during server startup sequence');
  process.exit(1);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Initiating graceful shutdown...`);
  monitoringScheduler.stop();
  await disconnectDatabase().catch(() => {});
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed successfully.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
