import { z } from 'zod';
import competitorRepository from '../repositories/competitorRepository.js';

const createCompetitorSchema = z.object({
  name: z.string({ required_error: 'Competitor name is required' }).trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).optional(),
  website: z.string().url('Invalid website URL format').optional().or(z.literal('')),
  industry: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  logo: z.string().optional()
});

const updateCompetitorSchema = createCompetitorSchema.partial();

export const competitorController = {
  async getAll(req, res, next) {
    try {
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const competitors = await competitorRepository.findAllByOrganization(organizationId);

      return res.status(200).json({
        success: true,
        count: competitors.length,
        data: competitors
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      
      let competitor = await competitorRepository.findById(id, organizationId);
      if (!competitor) {
        competitor = await competitorRepository.findBySlug(organizationId, id);
      }

      if (!competitor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Competitor '${id}' not found.`
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: competitor
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const parsed = createCompetitorSchema.parse(req.body || {});

      const slug = parsed.slug || parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const competitor = await competitorRepository.create({
        organizationId,
        name: parsed.name,
        slug,
        website: parsed.website || null,
        industry: parsed.industry || null,
        description: parsed.description || null,
        logo: parsed.logo || null,
        status: 'ACTIVE'
      });

      return res.status(201).json({
        success: true,
        data: competitor
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid competitor creation payload',
            details: err.errors
          }
        });
      }
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId || req.user?.organizationId || 'default-org';
      const parsed = updateCompetitorSchema.parse(req.body || {});

      const updated = await competitorRepository.update(id, parsed, organizationId);

      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid competitor update payload',
            details: err.errors
          }
        });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: err.message
          }
        });
      }
      next(err);
    }
  }
};

export default competitorController;
