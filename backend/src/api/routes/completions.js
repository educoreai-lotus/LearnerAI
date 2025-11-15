import express from 'express';
import { DetectCompletionUseCase } from '../../application/useCases/DetectCompletionUseCase.js';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createCompletionsRouter(dependencies) {
  const { detectCompletionUseCase } = dependencies;

  /**
   * POST /api/v1/completions
   * Receive course completion event from Skills Engine
   */
  router.post('/', async (req, res) => {
    try {
      const { userId, competencyTargetName, passed, completionDetails } = req.body;

      // Validate required fields
      if (!userId || !competencyTargetName || passed === undefined) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, competencyTargetName, and passed are required'
        });
      }

      // Process completion
      const result = await detectCompletionUseCase.execute({
        userId,
        competencyTargetName,
        passed,
        completionDetails: completionDetails || {}
      });

      if (!result.processed) {
        return res.status(200).json(result);
      }

      // Return job ID for async suggestion generation
      res.status(202).json({
        message: result.message,
        jobId: result.jobId,
        status: result.status
      });
    } catch (error) {
      console.error('Error processing completion:', error);
      res.status(500).json({
        error: 'Failed to process completion',
        message: error.message
      });
    }
  });

  return router;
}

