import competitorRepository from '../repositories/competitorRepository.js';

export const competitorController = {
  async getAll(req, res, next) {
    try {
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';
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
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'] || 'default-org';
      
      let competitor = await competitorRepository.findById(id);
      if (!competitor) {
        competitor = await competitorRepository.findBySlug(organizationId, id);
      }

      if (!competitor) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Competitor '${id}' not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: competitor
      });
    } catch (err) {
      next(err);
    }
  }
};

export default competitorController;
