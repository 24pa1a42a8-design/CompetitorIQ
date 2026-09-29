import { z } from 'zod';
import { strategicAnalysisService, SUPPORTED_ANALYSIS_TYPES, VALID_WINDOWS } from '../services/strategicAnalysisService.js';
import { logger } from '../config/logger.js';

const getAnalysesQuerySchema = z.object({
  competitorId: z.string().optional(),
  analysisType: z.enum([...SUPPORTED_ANALYSIS_TYPES, 'ALL']).optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

const analyzeDataSchema = z.object({
  competitorId: z.string().optional(),
  analysisType: z.enum([...SUPPORTED_ANALYSIS_TYPES, 'ALL']).optional(),
  windowDays: z.number().refine(val => VALID_WINDOWS.includes(val), {
    message: 'windowDays must be one of 30, 60, 90, or 180'
  }).optional()
});

export const strategicAnalysisController = {
  async getAnalyses(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const parsedQuery = getAnalysesQuerySchema.parse(req.query);

      const analyses = await strategicAnalysisService.getAnalyses(organizationId, parsedQuery);

      return res.json({
        success: true,
        data: analyses || [],
        total: analyses.length,
        limit: parsedQuery.limit || 50,
        offset: parsedQuery.offset || 0
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters for strategic analysis request',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to fetch strategic analyses');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_STRATEGIC_ANALYSIS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getAnalysisById(req, res) {
    try {
      const { id } = req.params;
      const analysis = await strategicAnalysisService.getAnalysisById(id);

      return res.json({
        success: true,
        data: analysis
      });
    } catch (err) {
      logger.error({ err: err.message, analysisId: req.params.id }, 'Failed to fetch strategic analysis by ID');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_ANALYSIS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async analyze(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const body = analyzeDataSchema.parse(req.body || {});

      const result = await strategicAnalysisService.analyzeStrategicData({
        organizationId,
        competitorId: body.competitorId,
        analysisType: body.analysisType,
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
            message: 'Invalid strategic analysis request payload',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to execute strategic analysis synthesis');
      return res.status(500).json({
        success: false,
        error: {
          code: 'ANALYZE_STRATEGY_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  }
};

export default strategicAnalysisController;
