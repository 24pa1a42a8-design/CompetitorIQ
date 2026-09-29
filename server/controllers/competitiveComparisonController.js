import { z } from 'zod';
import { competitiveComparisonService, VALID_COMPARISON_WINDOWS } from '../services/competitiveComparisonService.js';
import { logger } from '../config/logger.js';

const compareQuerySchema = z.object({
  competitorIds: z.union([
    z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    z.array(z.string())
  ]).optional(),
  windowDays: z.string().regex(/^\d+$/).transform(Number).refine(val => VALID_COMPARISON_WINDOWS.includes(val), {
    message: 'windowDays must be one of 30, 60, 90, or 180'
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categories: z.union([
    z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    z.array(z.string())
  ]).optional()
});

export const competitiveComparisonController = {
  async compare(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const parsedQuery = compareQuerySchema.parse(req.query || {});

      const result = await competitiveComparisonService.compareCompetitors({
        organizationId,
        competitorIds: parsedQuery.competitorIds || [],
        windowDays: parsedQuery.windowDays || 90,
        categories: parsedQuery.categories || []
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid competitive comparison request query parameters',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to generate competitive comparison matrix');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'COMPARISON_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  }
};

export default competitiveComparisonController;
