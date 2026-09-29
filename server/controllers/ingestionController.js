import ingestionService from '../services/ingestionService.js';
import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { z } from 'zod';

export const ingestItemBodySchema = z.object({
  competitor: z.string().optional(),
  competitorId: z.string().optional(),
  competitorName: z.string().optional(),
  eventType: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  eventDate: z.string().optional(),
  importance: z.string().optional(),
  confidence: z.number().optional(),
  evidence: z.string().optional()
});

export const batchIngestBodySchema = z.object({
  items: z.array(ingestItemBodySchema).min(1, 'Batch items array cannot be empty')
});

export async function handleIngestItem(req, res, next) {
  try {
    const result = await ingestionService.processItem(req.body, {
      requestId: req.id
    });
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

export async function handleBatchIngest(req, res, next) {
  try {
    const result = await ingestionService.processBatch(req.body.items, {
      requestId: req.id
    });
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

export async function handleGetIngestedEvents(req, res, next) {
  try {
    const competitorId = req.query.competitorId;
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const eventType = req.query.eventType;
    const query = req.query.query;
    const organizationId = req.headers['x-organization-id'] || req.user?.organizationId || 'default-org';

    let events = [];
    if (competitorId && !query && !eventType) {
      events = await competitorEventRepository.findByCompetitor(competitorId, { limit });
    } else {
      events = await competitorEventRepository.searchEvents({
        organizationId,
        competitorId,
        eventType,
        query,
        limit,
        offset
      });
    }

    return res.status(200).json({
      success: true,
      data: events,
      events,
      count: events.length,
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
