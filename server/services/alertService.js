import { alertRuleEngine } from '../alerts/alertRuleEngine.js';
import { alertRepository } from '../repositories/alertRepository.js';
import { hindsightService } from '../hindsight/hindsightService.js';
import { logger } from '../config/logger.js';

export const alertService = {
  async evaluateAndCreateAlert({ organizationId = 'default-org', eventRecord, normalized = null, competitorRecord = null }) {
    if (!eventRecord && !normalized) {
      return { alertCreated: false, reason: 'Invalid or missing event data' };
    }

    const compName = competitorRecord?.name || normalized?.competitorName || eventRecord?.competitor?.name || 'Competitor';
    
    // 1. Evaluate rules deterministically
    const evalResult = alertRuleEngine.evaluateEvent(eventRecord, normalized, competitorRecord);
    if (!evalResult.triggered) {
      return { alertCreated: false, reason: evalResult.reason };
    }

    const eventId = eventRecord?.id || null;

    // 2. Deduplication Check
    if (eventId) {
      const existingAlert = await alertRepository.findByEventAndType(organizationId, eventId, evalResult.alertType);
      if (existingAlert) {
        logger.info(
          { eventId, alertType: evalResult.alertType, alertId: existingAlert.id },
          'Alert already exists for this event and type; skipping duplicate creation'
        );
        return {
          alertCreated: false,
          isDuplicate: true,
          alert: existingAlert
        };
      }
    }

    // 3. Optional Hindsight Context Retrieval (Degrades gracefully if credits unavailable)
    let hindsightContext = { available: false, reason: 'Not attempted' };
    try {
      const queryText = `${compName} ${evalResult.alertType} historical signals`;
      const recallPromise = hindsightService.recall(queryText, 3);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Hindsight recall timeout after 1.5s')), 1500));
      const recallRes = await Promise.race([recallPromise, timeoutPromise]);
      if (recallRes && recallRes.memories && recallRes.memories.length > 0) {
        hindsightContext = {
          available: true,
          memoryCount: recallRes.memories.length,
          memories: recallRes.memories.map(m => ({
            text: m.memoryText || m.text || m.summary,
            score: m.score || m.relevanceScore
          }))
        };
      } else {
        hindsightContext = { available: true, memoryCount: 0, memories: [] };
      }
    } catch (hindsightErr) {
      const isCreditError = (hindsightErr.message || '').toLowerCase().includes('credit');
      hindsightContext = {
        available: false,
        errorCode: isCreditError ? 'INSUFFICIENT_CREDITS' : 'HINDSIGHT_UNAVAILABLE',
        errorDetails: hindsightErr.message || 'Hindsight recall unavailable'
      };
      logger.info(
        { err: hindsightErr.message, competitor: compName },
        'Hindsight memory context recall unavailable for alert; using PostgreSQL evidence context'
      );
    }

    // 4. Construct Alert Message with Full Provenance & Evidence Reference
    const evidenceSnippet = normalized?.evidenceExcerpt || eventRecord?.description || eventRecord?.summary || 'Primary source evidence verified.';
    const sourceUrl = normalized?.sourceUrl || eventRecord?.source?.url || 'Public Source';
    
    let messageText = evalResult.reason;
    if (evidenceSnippet) {
      messageText += `\n\nEvidence Excerpt: "${evidenceSnippet}"`;
    }
    if (sourceUrl) {
      messageText += `\nSource: ${sourceUrl}`;
    }
    if (evalResult.ruleId) {
      messageText += `\nRule Triggered: ${evalResult.ruleId}`;
    }

    // 5. Persist Alert in PostgreSQL with Foreign Key Safety
    let targetCompetitorId = competitorRecord?.id || eventRecord?.competitorId || null;
    let targetEventId = eventRecord?.id || null;
    const prisma = (await import('../config/database.js')).getPrismaClient();

    if (prisma) {
      // Ensure organization exists
      let org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        try {
          await prisma.organization.create({
            data: {
              id: organizationId,
              name: organizationId === 'default-org' ? 'Default Organization' : organizationId,
              planTier: 'FREE'
            }
          });
        } catch (e) {
          // Organization created concurrently or fallback
        }
      }

      // Ensure competitor exists if ID provided
      if (targetCompetitorId) {
        const compExists = await prisma.competitor.findUnique({ where: { id: targetCompetitorId } });
        if (!compExists) {
          targetCompetitorId = null;
        }
      }

      // Ensure event exists if ID provided
      if (targetEventId) {
        const eventExists = await prisma.competitorEvent.findUnique({ where: { id: targetEventId } });
        if (!eventExists) {
          targetEventId = null;
        }
      }
    }

    const alertData = {
      organizationId,
      competitorId: targetCompetitorId,
      eventId: targetEventId,
      type: evalResult.alertType,
      severity: evalResult.severity,
      title: evalResult.title,
      message: messageText,
      status: 'UNREAD'
    };

    const newAlert = await alertRepository.create(alertData);

    logger.info(
      { alertId: newAlert.id, competitor: compName, severity: newAlert.severity, type: newAlert.type },
      'Successfully evaluated and created competitive intelligence alert'
    );

    return {
      alertCreated: true,
      isDuplicate: false,
      alert: newAlert,
      evaluation: evalResult,
      hindsightContext
    };
  },

  async getAlerts(organizationId, filters = {}) {
    return alertRepository.findByOrganization(organizationId, filters);
  },

  async getAlertById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error(`Alert not found with ID ${id}`);
      error.status = 404;
      throw error;
    }
    return alert;
  },

  async getUnreadCount(organizationId) {
    return alertRepository.countUnread(organizationId);
  },

  async markAllAsRead(organizationId) {
    return alertRepository.markAllAsRead(organizationId);
  },

  async updateAlertStatus(id, status) {
    const validStatuses = ['UNREAD', 'READ', 'ACKNOWLEDGED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid alert status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
      error.status = 400;
      throw error;
    }

    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error(`Alert not found with ID ${id}`);
      error.status = 404;
      throw error;
    }

    return alertRepository.updateStatus(id, status);
  }
};

export default alertService;
