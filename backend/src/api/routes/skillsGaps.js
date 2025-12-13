import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
import { ProcessSkillsGapUpdateUseCase } from '../../application/useCases/ProcessSkillsGapUpdateUseCase.js';

export function createSkillsGapsRouter(dependencies) {
  const { 
    skillsGapRepository,
    learnerRepository,
    companyRepository
  } = dependencies;

  // Initialize use case for Skills Engine gap updates
  const processGapUpdateUseCase = companyRepository
    ? new ProcessSkillsGapUpdateUseCase({
        skillsGapRepository,
        learnerRepository,
        companyRepository
      })
    : null;

  /**
   * POST /api/v1/skills-gaps
   * Create or update skills gap (called by Skills Engine microservice)
   * 
   * Expected body from Skills Engine:
   * {
   *   user_id: "uuid",
   *   user_name: "string",
   *   company_id: "uuid",
   *   company_name: "string",
   *   competency_target_name: "string", // Primary field (competency_name also accepted for backward compatibility)
   *   status: "pass" | "fail",
   *   gap: { ... } // JSONB with micro/nano skills
   * }
   */
  router.post('/', async (req, res) => {
    try {
      const {
        user_id,
        user_name,
        company_id,
        company_name,
        competency_name,
        competency_target_name,
        status,
        gap, // JSONB gap data with micro/nano skills
        // Legacy fields (for backward compatibility)
        gap_id,
        skills_raw_data,
        exam_status,
        decision_maker_id,
        decision_maker_policy
      } = req.body;

      // Check if this is a Skills Engine update (has 'gap' field)
      if (gap && processGapUpdateUseCase) {
        // Use the new flow: Process Skills Engine gap update
        console.log('✅ Using ProcessSkillsGapUpdateUseCase for normalization');
        console.log('   Gap format:', typeof gap, Array.isArray(gap) ? 'array' : 'object');
        console.log('   Gap keys:', Object.keys(gap || {}));
        console.log('   Gap is already a map (normalized format):', 
          !gap.missing_skills_map && 
          !gap.identifiedGaps && 
          !Array.isArray(gap) &&
          !gap.skills &&
          Object.values(gap).every(value => Array.isArray(value) || typeof value === 'string')
        );
        try {
          const skillsGap = await processGapUpdateUseCase.execute({
            user_id,
            user_name,
            company_id,
            company_name,
            competency_target_name: competency_target_name || competency_name, // Primary field
            competency_name, // For backward compatibility
            status,
            gap
          });

          console.log('✅ Skills gap processed successfully with normalization');
          console.log('   Normalized skills_raw_data format:', typeof skillsGap.skills_raw_data, Object.keys(skillsGap.skills_raw_data || {}));

          return res.status(200).json({
            message: 'Skills gap processed successfully',
            skillsGap
          });
        } catch (useCaseError) {
          // Log the full error for debugging
          console.error('❌ ProcessSkillsGapUpdateUseCase failed:', useCaseError);
          console.error('   Error stack:', useCaseError.stack);
          // Re-throw with more context
          throw new Error(`Failed to process skills gap: ${useCaseError.message}`);
        }
      } else {
        // Log why we're not using the normalization flow
        if (!gap) {
          console.warn('⚠️  Gap field missing - cannot use normalization flow');
        }
        if (!processGapUpdateUseCase) {
          console.warn('⚠️  ProcessSkillsGapUpdateUseCase not initialized - companyRepository may be missing');
        }
      }
      
      // If gap field is missing but other fields suggest it should be there, provide helpful error
      if (!gap && (status || competency_target_name || competency_name)) {
        return res.status(400).json({
          error: 'Missing required field: gap',
          message: 'The "gap" field is required for skills gap processing. Please include the gap data with micro/nano skills.'
        });
      }

      // Legacy flow: Direct creation (for backward compatibility)
      // Validate required fields
      if (!user_id || !company_id || !company_name || !user_name || !skills_raw_data) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id, company_id, company_name, user_name, and skills_raw_data (or gap) are required'
        });
      }

      // Validate exam_status if provided
      if (exam_status && !['pass', 'fail'].includes(exam_status)) {
        return res.status(400).json({
          error: 'Invalid exam_status',
          message: 'exam_status must be "pass" or "fail"'
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
        skills_raw_data: skills_raw_data || gap,
        exam_status: exam_status || (status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : null),
        competency_target_name: competency_name || competency_target_name,
        decision_maker_id,
        decision_maker_policy
      });

      res.status(201).json({
        message: 'Skills gap created successfully',
        skillsGap
      });
    } catch (error) {
      console.error('Error processing skills gap:', error);
      res.status(500).json({
        error: 'Failed to process skills gap',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/skills-gaps
   * Get all skills gaps
   */
  router.get('/', async (req, res) => {
    try {
      const skillsGaps = await skillsGapRepository.getAllSkillsGaps();
      res.json({
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
   * GET /api/v1/skills-gaps/competency/:competencyTargetName
   * Get all skills gaps by competency_target_name
   */
  router.get('/competency/:competencyTargetName', async (req, res) => {
    try {
      const { competencyTargetName } = req.params;
      const skillsGaps = await skillsGapRepository.getSkillsGapsByCompetency(competencyTargetName);

      res.json({
        competency_target_name: competencyTargetName,
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
   * GET /api/v1/skills-gaps/exam-status/:status
   * Get skills gaps by exam_status (pass/fail)
   */
  router.get('/exam-status/:status', async (req, res) => {
    try {
      const { status } = req.params;

      if (!['pass', 'fail'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid exam_status',
          message: 'exam_status must be "pass" or "fail"'
        });
      }

      const skillsGaps = await skillsGapRepository.getSkillsGapsByExamStatus(status);

      res.json({
        exam_status: status,
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

      // Validate exam_status if provided
      if (updates.exam_status && !['pass', 'fail'].includes(updates.exam_status)) {
        return res.status(400).json({
          error: 'Invalid exam_status',
          message: 'exam_status must be "pass" or "fail"'
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

