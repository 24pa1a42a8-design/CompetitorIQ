import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../config/database.js';
import { checkHindsightHealth } from '../config/hindsight.js';
import { ollamaService } from '../services/ollamaService.js';
import { monitoringScheduler } from '../services/monitoringScheduler.js';

export async function getHealthStatus(req, res) {
  const dbStatus = await checkDatabaseHealth();
  const isConnected = dbStatus === 'ok';

  return res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    data: {
      status: isConnected ? 'ok' : 'degraded',
      database: isConnected ? 'connected' : 'disconnected',
      service: 'competitoriq-backend',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    },
    error: isConnected ? null : 'PostgreSQL database disconnected',
    meta: {
      requestId: req.id || undefined
    }
  });
}

export async function getReadinessStatus(req, res) {
  const [dbStatus, hindsightStatus, ollamaHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkHindsightHealth(),
    ollamaService.checkHealth()
  ]);

  const monitoringState = monitoringScheduler.getStatus();

  return res.status(200).json({
    success: true,
    data: {
      backend: 'ok',
      database: dbStatus,
      hindsight: hindsightStatus,
      ollama: ollamaHealth,
      monitoring: {
        status: monitoringState.isProcessing ? 'running' : 'idle',
        enabled: monitoringState.enabled,
        sourcesConfigured: monitoringState.sourcesConfigured,
        sourcesEnabled: monitoringState.sourcesEnabled,
        lastRunAt: monitoringState.metrics.lastRunAt,
        nextRunAt: monitoringState.metrics.nextRunAt
      }
    },
    error: null,
    meta: {
      requestId: req.id || undefined,
      timestamp: new Date().toISOString()
    }
  });
}

export async function getOllamaStatus(req, res) {
  const ollamaHealth = await ollamaService.checkHealth();
  return res.status(200).json({
    success: true,
    data: ollamaHealth,
    error: null,
    meta: {
      requestId: req.id || undefined,
      timestamp: new Date().toISOString()
    }
  });
}
