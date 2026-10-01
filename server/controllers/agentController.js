import { z } from 'zod';
import agentService from '../services/agentService.js';
import conversationRepository from '../repositories/conversationRepository.js';
import { logger } from '../config/logger.js';

const queryBodySchema = z.object({
  query: z.string({ required_error: 'Query string is required.' })
    .trim()
    .min(1, 'Query cannot be empty.')
    .max(4000, 'Query cannot exceed 4000 characters.'),
  competitorId: z.string().optional(),
  conversationId: z.string().optional(),
  mode: z.enum(['RECALL', 'REFLECT', 'AUTO']).optional(),
  timeoutMs: z.number().int().positive().optional()
});

export const agentController = {
  async query(req, res, next) {
    try {
      const parsed = queryBodySchema.parse(req.body);
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';
      const userId = req.user?.id || null;
      const requestId = req.id || `req-${Date.now()}`;

      logger.info({ organizationId, query: parsed.query }, 'Executing AI Competitor Intelligence Agent query');

      const result = await agentService.executeQuery(parsed.query, {
        competitorId: parsed.competitorId,
        conversationId: parsed.conversationId,
        mode: parsed.mode,
        timeoutMs: parsed.timeoutMs,
        organizationId,
        userId,
        requestId
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: err.errors?.[0]?.message || err.issues?.[0]?.message || err.message || 'Invalid input data',
          details: err.errors || err.issues || []
        });
      }
      if (err.message && (err.message.includes('required') || err.message.includes('exceed') || err.message.includes('character'))) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: err.message
        });
      }
      next(err);
    }
  },

  async getConversations(req, res, next) {
    try {
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';
      const conversations = await conversationRepository.findConversationsByOrg(organizationId);

      return res.status(200).json({
        success: true,
        count: conversations.length,
        data: conversations
      });
    } catch (err) {
      next(err);
    }
  },

  async getConversationMessages(req, res, next) {
    try {
      const { id } = req.params;
      const conversation = await conversationRepository.findConversationById(id);

      if (!conversation) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `AgentConversation with ID '${id}' not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (err) {
      next(err);
    }
  }
};

export default agentController;
