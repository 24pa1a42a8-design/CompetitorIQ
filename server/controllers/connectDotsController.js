import { z } from 'zod';
import { connectDotsService } from '../services/connectDotsService.js';
import { logger } from '../config/logger.js';

const getPatternsQuerySchema = z.object({
  competitorId: z.string().optional(),
  patternType: z.string().optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

const analyzePatternsSchema = z.object({
  competitorId: z.string().optional(),
  windowDays: z.number().int().min(1).max(365).optional()
});

export const connectDotsController = {
  async getPatterns(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const parsedQuery = getPatternsQuerySchema.parse(req.query);

      const patterns = await connectDotsService.getPatterns(organizationId, parsedQuery);

      return res.json({
        success: true,
        data: patterns || [],
        total: patterns.length,
        limit: parsedQuery.limit || 50,
        offset: parsedQuery.offset || 0
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request query parameters',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to fetch Connect-the-Dots patterns');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_PATTERNS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getPatternById(req, res) {
    try {
      const { id } = req.params;
      const pattern = await connectDotsService.getPatternById(id);

      return res.json({
        success: true,
        data: pattern
      });
    } catch (err) {
      logger.error({ err: err.message, patternId: req.params.id }, 'Failed to fetch pattern by ID');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_PATTERN_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async analyze(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const body = analyzePatternsSchema.parse(req.body || {});

      const result = await connectDotsService.analyzePatterns({
        organizationId,
        competitorId: body.competitorId,
        windowDays: body.windowDays || 90
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
            message: 'Invalid analyze request payload',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to execute Connect-the-Dots analysis');
      return res.status(500).json({
        success: false,
        error: {
          code: 'ANALYZE_PATTERNS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  }
};

export default connectDotsController;
