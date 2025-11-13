import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createLearnersRouter(dependencies) {
  const { learnerRepository } = dependencies;

  /**
   * POST /api/v1/learners
   * Create a new learner
   */
  router.post('/', async (req, res) => {
    try {
      const { user_id, company_id, company_name, user_name, decision_maker_policy, decision_maker_id } = req.body;

      // Validate required fields
      if (!company_id || !company_name || !user_name || !decision_maker_policy) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'company_id, company_name, user_name, and decision_maker_policy are required'
        });
      }

      // Validate decision_maker_policy
      if (!['auto', 'manual'].includes(decision_maker_policy)) {
        return res.status(400).json({
          error: 'Invalid decision_maker_policy',
          message: 'decision_maker_policy must be "auto" or "manual"'
        });
      }

      const learner = await learnerRepository.createLearner({
        user_id,
        company_id,
        company_name,
        user_name,
        decision_maker_policy,
        decision_maker_id
      });

      res.status(201).json({
        message: 'Learner created successfully',
        learner
      });
    } catch (error) {
      console.error('Error creating learner:', error);
      res.status(500).json({
        error: 'Failed to create learner',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/learners/:userId
   * Get learner by user_id
   */
  router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const learner = await learnerRepository.getLearnerById(userId);

      if (!learner) {
        return res.status(404).json({
          error: 'Learner not found',
          message: `No learner found with user_id: ${userId}`
        });
      }

      res.json({ learner });
    } catch (error) {
      console.error('Error fetching learner:', error);
      res.status(500).json({
        error: 'Failed to fetch learner',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/learners/company/:companyId
   * Get all learners by company_id
   */
  router.get('/company/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const learners = await learnerRepository.getLearnersByCompany(companyId);

      res.json({
        company_id: companyId,
        count: learners.length,
        learners
      });
    } catch (error) {
      console.error('Error fetching learners:', error);
      res.status(500).json({
        error: 'Failed to fetch learners',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/v1/learners/:userId
   * Update learner
   */
  router.put('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Validate decision_maker_policy if provided
      if (updates.decision_maker_policy && !['auto', 'manual'].includes(updates.decision_maker_policy)) {
        return res.status(400).json({
          error: 'Invalid decision_maker_policy',
          message: 'decision_maker_policy must be "auto" or "manual"'
        });
      }

      const learner = await learnerRepository.updateLearner(userId, updates);

      res.json({
        message: 'Learner updated successfully',
        learner
      });
    } catch (error) {
      console.error('Error updating learner:', error);
      res.status(500).json({
        error: 'Failed to update learner',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/v1/learners/:userId
   * Delete learner
   */
  router.delete('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      await learnerRepository.deleteLearner(userId);

      res.json({
        message: 'Learner deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting learner:', error);
      res.status(500).json({
        error: 'Failed to delete learner',
        message: error.message
      });
    }
  });

  return router;
}

