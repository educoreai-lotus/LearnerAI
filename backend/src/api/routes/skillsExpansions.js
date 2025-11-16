import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createSkillsExpansionsRouter(dependencies) {
  const { skillsExpansionRepository } = dependencies;

  /**
   * POST /api/v1/skills-expansions
   * Create a new skills expansion
   */
  router.post('/', async (req, res) => {
    try {
      const { expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output } = req.body;

      // Validate required fields
      if (!user_id) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'user_id is required'
        });
      }

      const skillsExpansion = await skillsExpansionRepository.createSkillsExpansion({
        expansion_id,
        gap_id: gap_id || null,
        user_id,
        prompt_1_output,
        prompt_2_output
      });

      res.status(201).json({
        message: 'Skills expansion created successfully',
        skillsExpansion
      });
    } catch (error) {
      console.error('Error creating skills expansion:', error);
      res.status(500).json({
        error: 'Failed to create skills expansion',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-expansions/:expansionId
   * Get skills expansion by expansion_id
   */
  router.get('/:expansionId', async (req, res) => {
    try {
      const { expansionId } = req.params;
      const skillsExpansion = await skillsExpansionRepository.getSkillsExpansionById(expansionId);

      if (!skillsExpansion) {
        return res.status(404).json({
          error: 'Skills expansion not found',
          message: `No skills expansion found with expansion_id: ${expansionId}`
        });
      }

      res.json({ skillsExpansion });
    } catch (error) {
      console.error('Error fetching skills expansion:', error);
      res.status(500).json({
        error: 'Failed to fetch skills expansion',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-expansions
   * Get all skills expansions (with optional pagination and filters)
   */
  router.get('/', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const user_id = req.query.user_id;
      const gap_id = req.query.gap_id;

      const skillsExpansions = await skillsExpansionRepository.getAllSkillsExpansions({
        limit,
        offset,
        user_id,
        gap_id
      });

      res.json({
        count: skillsExpansions.length,
        limit,
        offset,
        skillsExpansions
      });
    } catch (error) {
      console.error('Error fetching skills expansions:', error);
      res.status(500).json({
        error: 'Failed to fetch skills expansions',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/v1/skills-expansions/:expansionId
   * Update skills expansion
   */
  router.put('/:expansionId', async (req, res) => {
    try {
      const { expansionId } = req.params;
      const updates = req.body;

      const skillsExpansion = await skillsExpansionRepository.updateSkillsExpansion(expansionId, updates);

      res.json({
        message: 'Skills expansion updated successfully',
        skillsExpansion
      });
    } catch (error) {
      console.error('Error updating skills expansion:', error);
      res.status(500).json({
        error: 'Failed to update skills expansion',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/v1/skills-expansions/:expansionId
   * Delete skills expansion
   */
  router.delete('/:expansionId', async (req, res) => {
    try {
      const { expansionId } = req.params;
      await skillsExpansionRepository.deleteSkillsExpansion(expansionId);

      res.json({
        message: 'Skills expansion deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting skills expansion:', error);
      res.status(500).json({
        error: 'Failed to delete skills expansion',
        message: error.message
      });
    }
  });

  return router;
}

