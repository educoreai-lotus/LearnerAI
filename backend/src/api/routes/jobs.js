import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createJobsRouter(dependencies) {
  const { jobRepository } = dependencies;

  /**
   * GET /api/v1/jobs/:jobId/status
   * Get job status for polling
   */
  router.get('/:jobId/status', async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await jobRepository.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          message: `Job with ID ${jobId} does not exist`
        });
      }

      res.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStage: job.currentStage,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      });
    } catch (error) {
      console.error('Error fetching job status:', error);
      res.status(500).json({
        error: 'Failed to fetch job status',
        message: error.message
      });
    }
  });

  return router;
}

