import { z } from 'zod';
import { monitoringScheduler } from '../services/monitoringScheduler.js';
import { logger } from '../config/logger.js';

const runSourceSchema = z.object({
  sourceId: z.string().optional(),
  force: z.boolean().optional()
});

const toggleSchema = z.object({
  enabled: z.boolean()
});

export const monitoringController = {
  async getStatus(req, res) {
    try {
      const status = monitoringScheduler.getStatus();
      return res.json({
        success: true,
        data: status
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to fetch monitoring status');
      return res.status(500).json({
        success: false,
        error: {
          code: 'MONITORING_STATUS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async runAll(req, res) {
    try {
      const body = runSourceSchema.parse(req.body || {});
      const organizationId = req.headers['x-organization-id'] || 'default-org';

      logger.info({ organizationId }, 'Manual execution trigger for all monitored competitor sources');

      const result = await monitoringScheduler.runAllNow({
        organizationId,
        force: body.force
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed manual monitoring run for all sources');
      return res.status(500).json({
        success: false,
        error: {
          code: 'MONITORING_RUN_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async runSingle(req, res) {
    try {
      const { sourceId } = req.params;
      const organizationId = req.headers['x-organization-id'] || 'default-org';

      const sourceState = monitoringScheduler.sources.get(sourceId);
      if (!sourceState) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SOURCE_NOT_FOUND',
            message: `Monitored source not found with ID '${sourceId}'`
          }
        });
      }

      logger.info({ sourceId, organizationId }, 'Manual execution trigger for single monitored source');

      const result = await monitoringScheduler.processSingleSource(sourceState, { organizationId });

      return res.json({
        success: true,
        data: {
          sourceId,
          result,
          status: monitoringScheduler.getStatus()
        }
      });
    } catch (err) {
      logger.error({ err: err.message, sourceId: req.params.sourceId }, 'Failed manual monitoring run for single source');
      return res.status(500).json({
        success: false,
        error: {
          code: 'MONITORING_RUN_SINGLE_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async toggle(req, res) {
    try {
      const body = toggleSchema.parse(req.body || {});
      const newState = monitoringScheduler.toggle(body.enabled);

      return res.json({
        success: true,
        data: {
          enabled: newState,
          status: monitoringScheduler.getStatus()
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid toggle monitoring request payload',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to toggle monitoring scheduler state');
      return res.status(500).json({
        success: false,
        error: {
          code: 'TOGGLE_MONITORING_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  }
};

export default monitoringController;
