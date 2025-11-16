import express from 'express';
import { GenerateLearningPathUseCase } from '../../application/useCases/GenerateLearningPathUseCase.js';
import { SkillsGap } from '../../domain/entities/SkillsGap.js';
import { Job } from '../../domain/entities/Job.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createLearningPathsRouter(dependencies) {
  const {
    geminiClient,
    skillsEngineClient,
    repository,
    jobRepository,
    promptLoader,
    cacheRepository = null, // Optional - old schema feature
    skillsGapRepository, // Add for fetching updated skills_raw_data
    skillsExpansionRepository // Add for saving prompt outputs
  } = dependencies;

  const generatePathUseCase = new GenerateLearningPathUseCase({
    geminiClient,
    skillsEngineClient,
    repository,
    jobRepository,
    promptLoader,
    cacheRepository,
    skillsGapRepository,
    skillsExpansionRepository
  });

  /**
   * POST /api/v1/learning-paths/generate
   * Generate a learning path from skills gap
   */
  router.post('/generate', async (req, res) => {
    try {
      const { userId, companyId, competencyTargetName, microSkills, nanoSkills } = req.body;

      // Validate required fields
      if (!userId || !companyId || !competencyTargetName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, companyId, and competencyTargetName are required'
        });
      }

      // Create skills gap entity
      const skillsGap = new SkillsGap({
        userId,
        companyId,
        competencyTargetName,
        microSkills: microSkills || [],
        nanoSkills: nanoSkills || []
      });

      // Execute use case
      const result = await generatePathUseCase.execute(skillsGap);

      res.status(202).json({
        message: 'Learning path generation started',
        jobId: result.jobId,
        status: result.status
      });
    } catch (error) {
      console.error('Error generating learning path:', error);
      res.status(500).json({
        error: 'Failed to start learning path generation',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/learning-paths/:userId
   * Get all learning paths for a user
   */
  router.get('/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const learningPaths = await repository.getLearningPathsByUser(userId);

      res.json({
        userId,
        learningPaths: learningPaths.map(lp => lp.toJSON())
      });
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      res.status(500).json({
        error: 'Failed to fetch learning paths',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/learning-paths/company/:companyId/users
   * Get all users and their learning paths for a company
   */
  router.get('/company/:companyId/users', async (req, res) => {
    try {
      const { companyId } = req.params;
      const learningPaths = await repository.getLearningPathsByCompany(companyId);

      // Group by user
      const usersMap = new Map();
      learningPaths.forEach(lp => {
        if (!usersMap.has(lp.userId)) {
          usersMap.set(lp.userId, {
            userId: lp.userId,
            learningPaths: []
          });
        }
        usersMap.get(lp.userId).learningPaths.push(lp.toJSON());
      });

      res.json({
        companyId,
        users: Array.from(usersMap.values())
      });
    } catch (error) {
      console.error('Error fetching company learning paths:', error);
      res.status(500).json({
        error: 'Failed to fetch company learning paths',
        message: error.message
      });
    }
  });

  return router;
}

