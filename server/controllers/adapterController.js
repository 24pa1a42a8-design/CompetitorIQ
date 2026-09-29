import { z } from 'zod';
import adapterIngestionService from '../services/adapterIngestionService.js';
import adapterRegistry from '../adapters/adapterRegistry.js';
import { logger } from '../config/logger.js';

const triggerBodySchema = z.object({
  sourceId: z.string().optional(),
  url: z.string().url('Must be a valid URL string').optional(),
  competitorName: z.string().optional(),
  adapterType: z.enum(['news_press', 'product_release', 'pricing_page', 'careers_hiring']).optional()
}).refine(data => data.sourceId || data.url, {
  message: 'Either sourceId or a valid url must be provided.'
});

export const adapterController = {
  async trigger(req, res, next) {
    try {
      const parsed = triggerBodySchema.parse(req.body);
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';

      const target = parsed.sourceId ? parsed.sourceId : {
        id: `custom_${Date.now()}`,
        url: parsed.url,
        competitorName: parsed.competitorName || 'Competitor',
        adapterType: parsed.adapterType || 'news_press',
        publisher: 'Manual Ingestion Trigger'
      };

      logger.info({ target }, 'API request to trigger source adapter ingestion');

      const result = await adapterIngestionService.triggerSource(target, { organizationId });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: err.errors[0]?.message || 'Invalid adapter trigger input',
          details: err.errors
        });
      }
      next(err);
    }
  },

  async listSources(req, res) {
    const sources = adapterRegistry.listAvailableSources();
    const adapters = adapterRegistry.listRegisteredAdapters();

    return res.status(200).json({
      success: true,
      registeredAdapters: adapters,
      availableSources: sources
    });
  }
};

export default adapterController;
