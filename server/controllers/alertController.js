import { z } from 'zod';
import { alertService } from '../services/alertService.js';
import { competitorEventRepository } from '../repositories/competitorEventRepository.js';
import { logger } from '../config/logger.js';

const getAlertsQuerySchema = z.object({
  competitorId: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum([
    'PRICE_CHANGE',
    'NEW_PRODUCT',
    'NEW_FEATURE',
    'HIRING_SPIKE',
    'MESSAGING_CHANGE',
    'FUNDING',
    'PARTNERSHIP',
    'COMPETITOR_ACTIVITY_SPIKE',
    'IMPORTANT_PATTERN'
  ]).optional(),
  status: z.enum(['UNREAD', 'READ', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

const updateAlertStatusSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'ACKNOWLEDGED', 'RESOLVED'])
});

const evaluateAlertsSchema = z.object({
  eventId: z.string().optional()
});

export const alertController = {
  async getAlerts(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const parsedQuery = getAlertsQuerySchema.parse(req.query);

      const alerts = await alertService.getAlerts(organizationId, parsedQuery);

      return res.json({
        success: true,
        data: Array.isArray(alerts) ? alerts : (alerts.alerts || []),
        total: Array.isArray(alerts) ? alerts.length : (alerts.total || 0),
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
      logger.error({ err: err.message }, 'Failed to fetch competitive alerts');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_ALERTS_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getAlertById(req, res) {
    try {
      const { id } = req.params;
      const alert = await alertService.getAlertById(id);

      return res.json({
        success: true,
        data: alert
      });
    } catch (err) {
      logger.error({ err: err.message, alertId: req.params.id }, 'Failed to fetch alert by ID');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_ALERT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async getUnreadCount(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const count = await alertService.getUnreadCount(organizationId);
      return res.json({
        success: true,
        count,
        unreadCount: count
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to fetch unread alert count');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'GET_UNREAD_COUNT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const result = await alertService.markAllAsRead(organizationId);
      return res.json({
        success: true,
        data: result,
        message: 'All notifications marked as read'
      });
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to mark all alerts as read');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'MARK_ALL_READ_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async updateAlertStatus(req, res) {
    try {
      const { id } = req.params;
      const status = req.body?.status || (req.path.endsWith('/read') ? 'READ' : null);
      const parsed = updateAlertStatusSchema.parse({ status });

      const updatedAlert = await alertService.updateAlertStatus(id, parsed.status);

      return res.json({
        success: true,
        data: updatedAlert
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status parameter',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message, alertId: req.params.id }, 'Failed to update alert status');
      return res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'UPDATE_ALERT_FAILED',
          message: err.message || 'Internal server error'
        }
      });
    }
  },

  async evaluateAlerts(req, res) {
    try {
      const organizationId = req.headers['x-organization-id'] || 'default-org';
      const { eventId } = evaluateAlertsSchema.parse(req.body || {});

      if (eventId) {
        const event = await competitorEventRepository.findById(eventId);
        if (!event) {
          return res.status(404).json({
            success: false,
            error: { code: 'EVENT_NOT_FOUND', message: `Event not found with ID ${eventId}` }
          });
        }
        const result = await alertService.evaluateAndCreateAlert({
          organizationId,
          eventRecord: event,
          competitorRecord: event.competitor
        });
        return res.json({ success: true, data: result });
      }

      // Evaluate recent events for organization
      const events = await competitorEventRepository.findByOrganization(organizationId, { limit: 20 });
      const results = [];
      for (const event of events) {
        const resAlert = await alertService.evaluateAndCreateAlert({
          organizationId,
          eventRecord: event,
          competitorRecord: event.competitor
        });
        results.push(resAlert);
      }

      return res.json({
        success: true,
        evaluatedCount: events.length,
        alertsCreated: results.filter(r => r.alertCreated).length,
        results
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: err.errors
          }
        });
      }
      logger.error({ err: err.message }, 'Failed to evaluate alerts');
      return res.status(500).json({
        success: false,
        error: { code: 'EVALUATE_ALERTS_FAILED', message: err.message || 'Internal server error' }
      });
    }
  }
};

export default alertController;
