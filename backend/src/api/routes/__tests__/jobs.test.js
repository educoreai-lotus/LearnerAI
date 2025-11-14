import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createJobsRouter } from '../jobs.js';
import { Job } from '../../../domain/entities/Job.js';
import { testRoute } from './testHelpers.js';

describe('Jobs Router', () => {
  let router;
  let mockJobRepository;

  beforeEach(() => {
    // Mock repository - reset for each test
    mockJobRepository = {
      getJob: jest.fn()
    };

    // Create router with dependencies
    router = createJobsRouter({
      jobRepository: mockJobRepository
    });
  });

  // Note: We use mockResolvedValueOnce/mockRejectedValueOnce to ensure each test
  // gets its own mock implementation without interference

  describe('GET /api/v1/jobs/:jobId/status', () => {
    it('should get job status successfully', async () => {
      const mockJob = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        type: 'path-generation',
        status: 'processing',
        progress: 60,
        currentStage: 'prompt-2-execution',
        result: null,
        error: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T01:00:00Z'
      });

      mockJobRepository.getJob.mockResolvedValueOnce(mockJob);

      const { res } = await testRoute(router, 'get', '/:jobId/status', {
        params: { jobId: 'job-123' }
      });

      expect(res.json).toHaveBeenCalledWith({
        jobId: 'job-123',
        status: 'processing',
        progress: 60,
        currentStage: 'prompt-2-execution',
        result: null,
        error: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T01:00:00Z'
      });
      expect(mockJobRepository.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return 404 when job not found', async () => {
      // Set new return value for this test
      mockJobRepository.getJob.mockResolvedValueOnce(null);

      // Find the route handler directly since testRoute might not find parameterized routes
      const route = router.stack.find(l => l.route && l.route.methods.get);
      expect(route).toBeDefined();
      
      const req = { params: { jobId: 'non-existent' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await route.route.stack[0].handle(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Job not found',
        message: 'Job with ID non-existent does not exist'
      });
      expect(mockJobRepository.getJob).toHaveBeenCalledWith('non-existent');
    });

    it('should handle completed job status', async () => {
      const completedJob = new Job({
        id: 'job-completed',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        type: 'path-generation',
        status: 'completed',
        progress: 100,
        currentStage: 'completed',
        result: {
          learningPathId: 'JavaScript ES6+ Syntax',
          generatedAt: '2025-01-01T02:00:00Z'
        },
        error: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T02:00:00Z'
      });

      // Set new mock for this test
      mockJobRepository.getJob.mockResolvedValueOnce(completedJob);

      const route = router.stack.find(l => l.route && l.route.methods.get);
      const req = { params: { jobId: 'job-completed' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await route.route.stack[0].handle(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jobId: 'job-completed',
        status: 'completed',
        progress: 100,
        currentStage: 'completed',
        result: completedJob.result,
        error: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T02:00:00Z'
      });
    });

    it('should handle failed job status', async () => {
      const failedJob = new Job({
        id: 'job-failed',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        type: 'path-generation',
        status: 'failed',
        progress: 30,
        currentStage: 'prompt-1-execution',
        result: null,
        error: 'Gemini API timeout',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:30:00Z'
      });

      // Set new mock for this test
      mockJobRepository.getJob.mockResolvedValueOnce(failedJob);

      const route = router.stack.find(l => l.route && l.route.methods.get);
      const req = { params: { jobId: 'job-failed' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await route.route.stack[0].handle(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jobId: 'job-failed',
        status: 'failed',
        progress: 30,
        currentStage: 'prompt-1-execution',
        result: null,
        error: 'Gemini API timeout',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:30:00Z'
      });
    });

    it('should handle errors gracefully', async () => {
      // Set error mock for this test
      const error = new Error('Database error');
      mockJobRepository.getJob.mockImplementationOnce(() => Promise.reject(error));

      const route = router.stack.find(l => l.route && l.route.methods.get);
      expect(route).toBeDefined();
      
      const req = { params: { jobId: 'job-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await route.route.stack[0].handle(req, res);

      expect(mockJobRepository.getJob).toHaveBeenCalledWith('job-123');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to fetch job status',
          message: 'Database error'
        })
      );
    });
  });
});

