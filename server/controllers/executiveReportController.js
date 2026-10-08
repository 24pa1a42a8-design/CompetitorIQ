import { z } from 'zod';
import { executiveReportService, SUPPORTED_REPORT_TYPES, VALID_REPORT_WINDOWS } from '../services/executiveReportService.js';
import { logger } from '../config/logger.js';

const getReportsQuerySchema = z.object({
  competitorId: z.string().optional(),
  reportType: z.enum([...SUPPORTED_REPORT_TYPES, 'ALL']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

const generateReportSchema = z.object({
  competitorIds: z.union([
    z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    z.array(z.string())
  ]).optional(),
  reportType: z.enum(SUPPORTED_REPORT_TYPES).optional(),
  windowDays: z.number().refine(val => VALID_REPORT_WINDOWS.includes(val), {
    message: 'windowDays must be one of 7, 30, 60, 90, or 180'
  }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const executiveReportController = {
  async getLatestReport(req, res) {
    try {
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const reportType = req.query.reportType || 'EXECUTIVE_SUMMARY';
      const windowDays = req.query.windowDays ? Number(req.query.windowDays) : 90;
      const competitorIds = req.query.competitorIds ? String(req.query.competitorIds).split(',').map(s => s.trim()).filter(Boolean) : [];

      const result = await executiveReportService.getLatestReport({
        organizationId,
        reportType,
        windowDays,
        competitorIds
      });

      return res.json(result);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to fetch latest executive report');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_LATEST_REPORT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getReports(req, res) {
    try {
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const parsedQuery = getReportsQuerySchema.parse(req.query || {});

      const reports = await executiveReportService.getReports(organizationId, parsedQuery);

      return res.json({
        success: true,
        data: reports || [],
        total: reports.length,
        limit: parsedQuery.limit || 50,
        offset: parsedQuery.offset || 0
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters for executive reports request',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to fetch executive reports');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_REPORTS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const report = await executiveReportService.getReportById(id, organizationId);

      return res.json({
        success: true,
        data: report
      });
    } catch (err) {
      logger.error({ err: err.message, reportId: req.params.id }, 'Failed to fetch executive report by ID');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_REPORT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async generate(req, res) {
    try {
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const body = generateReportSchema.parse(req.body || {});

      const forceRefresh = Boolean(req.body?.forceRefresh || req.query?.forceRefresh);
      const result = await executiveReportService.generateReport({
        organizationId,
        competitorIds: body.competitorIds || [],
        reportType: body.reportType || 'EXECUTIVE_SUMMARY',
        windowDays: body.windowDays || 90,
        forceRefresh
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
            message: 'Invalid generate report payload',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to generate executive intelligence report');
      return res.status(500).json({
        success: false,
        error: {
          code: 'GENERATE_REPORT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  }
};

export default executiveReportController;
