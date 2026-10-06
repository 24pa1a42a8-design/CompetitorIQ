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
  evidence: z.string().optional(),
  pricingSignal: z.object({
    previousPrice: z.number().optional(),
    newPrice: z.number(),
    currency: z.string().optional(),
    billingPeriod: z.string().optional(),
    tierName: z.string().optional(),
    effectiveDate: z.string().optional()
  }).optional(),
  productSignal: z.object({
    productName: z.string(),
    featureName: z.string().optional(),
    signalType: z.enum(['NEW_PRODUCT', 'NEW_FEATURE', 'PRODUCT_UPDATE', 'PRODUCT_DEPRECATION', 'OTHER']).optional(),
    effectiveDate: z.string().optional()
  }).optional(),
  hiringSignal: z.object({
    role: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    detectedCount: z.number().optional()
  }).optional(),
  messagingSignal: z.object({
    messageTheme: z.string().optional(),
    previousMessaging: z.string().optional(),
    newMessaging: z.string()
  }).optional(),
  fundingSignal: z.object({
    fundingType: z.string().optional(),
    amount: z.number(),
    currency: z.string().optional(),
    announcedDate: z.string().optional()
  }).optional()
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
    const startDate = req.query.startDate || req.query.from;
    const endDate = req.query.endDate || req.query.to;
    const organizationId = req.headers['x-organization-id'] || req.user?.organizationId || 'default-org';

    const events = await competitorEventRepository.searchEvents({
      organizationId,
      competitorId,
      eventType,
      query,
      startDate,
      endDate,
      limit,
      offset
    });

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

export async function handleGetEventById(req, res, next) {
  try {
    const { id } = req.params;
    const event = await competitorEventRepository.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID '${id}' not found.` },
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRefreshOfficialSources(req, res, next) {
  try {
    const organizationId = req.headers['x-organization-id'] || req.user?.organizationId || 'default-org';
    const targetCompetitor = (req.params?.slug || req.query?.competitorId || req.query?.competitor || req.body?.competitor || '').toLowerCase().trim();

    const { SOURCE_CONFIGS } = await import('../config/sourcesConfig.js');
    const { adapterIngestionService } = await import('../services/adapterIngestionService.js');

    let configs = Object.values(SOURCE_CONFIGS);
    if (targetCompetitor) {
      configs = configs.filter(cfg => {
        const nameMatch = (cfg.competitorName || '').toLowerCase();
        const slugMatch = nameMatch.replace(/[^a-z0-9]+/g, '-');
        return nameMatch.includes(targetCompetitor) || slugMatch === targetCompetitor || targetCompetitor.includes(slugMatch);
      });
    }

    let sourcesChecked = 0;
    let pagesRetrieved = 0;
    let newEvents = 0;
    let updatedEvents = 0;
    let duplicatesSkipped = 0;
    let failedSources = 0;

    for (const cfg of configs) {
      sourcesChecked++;
      try {
        const result = await adapterIngestionService.triggerSource(cfg.id, { organizationId });
        if (result.success) {
          pagesRetrieved++;
          if (result.ingestionBatch) {
            newEvents += result.ingestionBatch.processed || 0;
            duplicatesSkipped += result.ingestionBatch.duplicatesSkipped || 0;
          }
        } else {
          failedSources++;
        }
      } catch (e) {
        failedSources++;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        competitor: targetCompetitor || 'ALL',
        sourcesChecked,
        pagesRetrieved,
        newEvents,
        updatedEvents,
        duplicatesSkipped,
        failedSources,
        message: newEvents > 0 
          ? `Updated ${newEvents} new official records.`
          : 'No new official updates found.'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRefreshCompetitorSources(req, res, next) {
  return handleRefreshOfficialSources(req, res, next);
}

