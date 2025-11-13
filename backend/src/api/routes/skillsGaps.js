import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createSkillsGapsRouter(dependencies) {
  const { skillsGapRepository } = dependencies;

  /**
   * POST /api/v1/skills-gaps
   * Create a new skills gap
   */
  router.post('/', async (req, res) => {
    try {
      const {
        gap_id,
        user_id,
        company_id,
        company_name,
        user_name,
        skills_raw_data,
        test_status,
        course_id,
        decision_maker_id,
        decision_maker_policy
      } = req.body;

      // Validate required fields
      if (!user_id || !company_id || !company_name || !user_name || !skills_raw_data) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id, company_id, company_name, user_name, and skills_raw_data are required'
        });
      }

      // Validate test_status if provided
      if (test_status && !['pass', 'fail'].includes(test_status)) {
        return res.status(400).json({
          error: 'Invalid test_status',
          message: 'test_status must be "pass" or "fail"'
        });
      }

      // Validate decision_maker_policy if provided
      if (decision_maker_policy && !['auto', 'manual'].includes(decision_maker_policy)) {
        return res.status(400).json({
          error: 'Invalid decision_maker_policy',
          message: 'decision_maker_policy must be "auto" or "manual"'
        });
      }

      const skillsGap = await skillsGapRepository.createSkillsGap({
        gap_id,
        user_id,
        company_id,
        company_name,
        user_name,
        skills_raw_data,
        test_status,
        course_id,
        decision_maker_id,
        decision_maker_policy
      });

      res.status(201).json({
        message: 'Skills gap created successfully',
        skillsGap
      });
    } catch (error) {
      console.error('Error creating skills gap:', error);
      res.status(500).json({
        error: 'Failed to create skills gap',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps/:gapId
   * Get skills gap by gap_id
   */
  router.get('/:gapId', async (req, res) => {
    try {
      const { gapId } = req.params;
      const skillsGap = await skillsGapRepository.getSkillsGapById(gapId);

      if (!skillsGap) {
        return res.status(404).json({
          error: 'Skills gap not found',
          message: `No skills gap found with gap_id: ${gapId}`
        });
      }

      res.json({ skillsGap });
    } catch (error) {
      console.error('Error fetching skills gap:', error);
      res.status(500).json({
        error: 'Failed to fetch skills gap',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps/user/:userId
   * Get all skills gaps by user_id
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const skillsGaps = await skillsGapRepository.getSkillsGapsByUser(userId);

      res.json({
        user_id: userId,
        count: skillsGaps.length,
        skillsGaps
      });
    } catch (error) {
      console.error('Error fetching skills gaps:', error);
      res.status(500).json({
        error: 'Failed to fetch skills gaps',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps/company/:companyId
   * Get all skills gaps by company_id
   */
  router.get('/company/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const skillsGaps = await skillsGapRepository.getSkillsGapsByCompany(companyId);

      res.json({
        company_id: companyId,
        count: skillsGaps.length,
        skillsGaps
      });
    } catch (error) {
      console.error('Error fetching skills gaps:', error);
      res.status(500).json({
        error: 'Failed to fetch skills gaps',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps/course/:courseId
   * Get all skills gaps by course_id
   */
  router.get('/course/:courseId', async (req, res) => {
    try {
      const { courseId } = req.params;
      const skillsGaps = await skillsGapRepository.getSkillsGapsByCourse(courseId);

      res.json({
        course_id: courseId,
        count: skillsGaps.length,
        skillsGaps
      });
    } catch (error) {
      console.error('Error fetching skills gaps:', error);
      res.status(500).json({
        error: 'Failed to fetch skills gaps',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps/test-status/:status
   * Get skills gaps by test_status (pass/fail)
   */
  router.get('/test-status/:status', async (req, res) => {
    try {
      const { status } = req.params;

      if (!['pass', 'fail'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid test_status',
          message: 'test_status must be "pass" or "fail"'
        });
      }

      const skillsGaps = await skillsGapRepository.getSkillsGapsByTestStatus(status);

      res.json({
        test_status: status,
        count: skillsGaps.length,
        skillsGaps
      });
    } catch (error) {
      console.error('Error fetching skills gaps:', error);
      res.status(500).json({
        error: 'Failed to fetch skills gaps',
        message: error.message
      });
    }
  });

  /**
   * PUT /api/v1/skills-gaps/:gapId
   * Update skills gap
   */
  router.put('/:gapId', async (req, res) => {
    try {
      const { gapId } = req.params;
      const updates = req.body;

      // Validate test_status if provided
      if (updates.test_status && !['pass', 'fail'].includes(updates.test_status)) {
        return res.status(400).json({
          error: 'Invalid test_status',
          message: 'test_status must be "pass" or "fail"'
        });
      }

      // Validate decision_maker_policy if provided
      if (updates.decision_maker_policy && !['auto', 'manual'].includes(updates.decision_maker_policy)) {
        return res.status(400).json({
          error: 'Invalid decision_maker_policy',
          message: 'decision_maker_policy must be "auto" or "manual"'
        });
      }

      const skillsGap = await skillsGapRepository.updateSkillsGap(gapId, updates);

      res.json({
        message: 'Skills gap updated successfully',
        skillsGap
      });
    } catch (error) {
      console.error('Error updating skills gap:', error);
      res.status(500).json({
        error: 'Failed to update skills gap',
        message: error.message
      });
    }
  });

  /**
   * DELETE /api/v1/skills-gaps/:gapId
   * Delete skills gap
   */
  router.delete('/:gapId', async (req, res) => {
    try {
      const { gapId } = req.params;
      await skillsGapRepository.deleteSkillsGap(gapId);

      res.json({
        message: 'Skills gap deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting skills gap:', error);
      res.status(500).json({
        error: 'Failed to delete skills gap',
        message: error.message
      });
    }
  });

  return router;
}

