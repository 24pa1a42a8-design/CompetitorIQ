import hindsightService from '../hindsight/hindsightService.js';
import { z } from 'zod';

export const retainBodySchema = z.object({
  competitorId: z.string().optional(),
  competitorName: z.string().optional(),
  eventId: z.string().optional(),
  eventType: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional()
});

export const recallBodySchema = z.object({
  query: z.string().min(1, 'Query string is required'),
  competitorId: z.string().optional(),
  limit: z.number().int().positive().optional().default(10)
});

export const reflectBodySchema = z.object({
  query: z.string().min(1, 'Query string is required')
});

export async function retainHandler(req, res, next) {
  try {
    const result = await hindsightService.retain(req.body);
    return res.status(201).json({
      success: true,
      data: result,
      error: null,
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function recallHandler(req, res, next) {
  try {
    const { query, competitorId, limit } = req.body;
    let result;
    if (competitorId) {
      result = await hindsightService.recallEvents(competitorId, query, { limit });
    } else {
      result = await hindsightService.recall(query, { limit });
    }

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function reflectHandler(req, res, next) {
  try {
    const { query } = req.body;
    const result = await hindsightService.reflect(query);
    return res.status(200).json({
      success: true,
      data: result,
      error: null,
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function statusHandler(req, res, next) {
  try {
    const configured = hindsightService.isConfigured();
    const bankId = hindsightService.getBankId();
    let creditLimitReached = false;
    let fallbackMode = false;

    try {
      const { memoryOperationRepository } = await import('../repositories/memoryOperationRepository.js');
      const recentOps = await memoryOperationRepository.findRecent({ limit: 15 });
      creditLimitReached = recentOps.some(op => 
        op.status === 'FAILED' && 
        (op.errorCode === 'INSUFFICIENT_CREDITS' ||
         op.errorMessage?.toLowerCase().includes('credit') ||
         op.errorMessage?.includes('402'))
      );
      if (creditLimitReached || !configured) {
        fallbackMode = true;
      }
    } catch {
      // ignore
    }

    const isDegraded = !configured || creditLimitReached;

    return res.status(200).json({
      success: true,
      data: {
        status: isDegraded ? 'degraded' : 'ok',
        bankId,
        isConfigured: configured,
        creditLimitReached,
        fallbackMode,
        message: creditLimitReached
          ? 'Hindsight Cloud credits insufficient — PostgreSQL database fallback active.'
          : configured
            ? 'Hindsight memory connected.'
            : 'Hindsight not configured — PostgreSQL database fallback active.'
      },
      error: null,
      meta: {
        requestId: req.id || undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getOperationsHandler(req, res, next) {
  try {
    const { memoryOperationRepository } = await import('../repositories/memoryOperationRepository.js');
    const operations = await memoryOperationRepository.findRecent({ limit: 20 });
    return res.status(200).json({
      success: true,
      data: operations,
      error: null
    });
  } catch (err) {
    next(err);
  }
}
