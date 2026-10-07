import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis;

export function getPrismaClient() {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    return null;
  }

  if (!globalForPrisma.__prismaClientSingleton) {
    globalForPrisma.__prismaClientSingleton = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  return globalForPrisma.__prismaClientSingleton;
}

export async function executeWithDbRetry(fn, maxRetries = 4, delayMs = 300) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const msg = err.message || '';
      const code = err.code || '';
      const isTransient =
        code === 'P1001' ||
        code === 'P2024' ||
        code === 'P1017' ||
        msg.includes("Can't reach database server") ||
        msg.includes("Connection pool timeout") ||
        msg.includes("connection pool") ||
        msg.includes("Server has closed the connection") ||
        msg.includes("closed the connection") ||
        msg.includes("Engine is not yet connected") ||
        msg.includes("not yet connected") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("10054");

      if (attempt > maxRetries || !isTransient) {
        throw err;
      }

      try {
        const prisma = getPrismaClient();
        if (prisma) {
          if (code === 'P1017' || msg.includes('Server has closed the connection') || msg.includes('10054')) {
            await prisma.$disconnect().catch(() => {});
          }
          await prisma.$connect().catch(() => {});
        }
      } catch (_) {}

      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}

export async function checkDatabaseHealth() {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    return 'not_configured';
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const prisma = getPrismaClient();
      if (!prisma) {
        return 'not_configured';
      }

      await prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err) {
      if (attempt === 3) {
        logger.warn({ err: err.message }, 'PostgreSQL database connectivity check failed');
        return 'error';
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }
}

export async function disconnectDatabase() {
  if (globalForPrisma.__prismaClientSingleton) {
    await globalForPrisma.__prismaClientSingleton.$disconnect();
    globalForPrisma.__prismaClientSingleton = null;
    logger.info('PostgreSQL Prisma database client disconnected');
  }
}

