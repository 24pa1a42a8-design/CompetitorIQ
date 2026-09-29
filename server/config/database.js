import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

let prismaInstance = null;

export function getPrismaClient() {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    return null;
  }

  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  return prismaInstance;
}

export async function checkDatabaseHealth() {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    return 'not_configured';
  }

  try {
    const prisma = getPrismaClient();
    if (!prisma) {
      return 'not_configured';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Lightweight connection check query
    await prisma.$queryRaw`SELECT 1`;
    clearTimeout(timeoutId);

    return 'ok';
  } catch (err) {
    logger.warn({ err: err.message }, 'PostgreSQL database connectivity check failed');
    return 'error';
  }
}

export async function disconnectDatabase() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('PostgreSQL Prisma database client disconnected');
  }
}
