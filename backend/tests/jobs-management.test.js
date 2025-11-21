import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createJobsRouter } from '../src/api/routes/jobs.js';
import { Job } from '../src/domain/entities/Job.js';
import { testRoute, createMockJob } from './testHelpers.js';

/**
 * Feature: Jobs Management
 * 
 * Tests background job tracking and status:
 * - Getting job status
 * - Tracking job progress
 * - Handling job errors
 * - Job lifecycle management
 */
describe('Feature: Jobs Management', () => {
  let mockJobRepository;

  beforeEach(() => {
    // Reset mocks before each test
    mockJobRepository = {
      getJob: jest.fn()
    };
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  // Helper to create a fresh router for each test
  function createRouter() {
    return createJobsRouter({
      jobRepository: mockJobRepository
    });
  }

  describe('GET /api/v1/jobs/:jobId/status', () => {
    it('should get job status successfully', async () => {
      const router = createRouter();
      const mockJob = createMockJob({
        id: 'job-123',
        status: 'processing',
        progress: 60
      });

      mockJobRepository.getJob.mockResolvedValueOnce(mockJob);

      const { res } = await testRoute(router, 'get', '/:jobId/status', {
        params: { jobId: 'job-123' }
      });

      expect(res.json).toHaveBeenCalledWith({
        jobId: 'job-123',
        status: 'processing',
        progress: 60,
        currentStage: mockJob.currentStage,
        result: null,
        error: null,
        createdAt: mockJob.createdAt,
        updatedAt: mockJob.updatedAt
      });
      expect(mockJobRepository.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return 404 when job not found', async () => {
      const router = createRouter();
      // Use mockResolvedValueOnce to ensure null is returned
      mockJobRepository.getJob.mockResolvedValueOnce(null);

      const { res } = await testRoute(router, 'get', '/:jobId/status', {
        params: { jobId: 'non-existent' }
      });

      expect(mockJobRepository.getJob).toHaveBeenCalledWith('non-existent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Job not found',
        message: 'Job with ID non-existent does not exist'
      });
    });

    it('should return job with completed status and result', async () => {
      const router = createRouter();
      const mockJob = createMockJob({
        id: 'job-123',
        status: 'completed',
        progress: 100,
        result: { pathId: 'path-123' }
      });

      // Use mockResolvedValueOnce to ensure this specific value is returned
      mockJobRepository.getJob.mockResolvedValueOnce(mockJob);

      const { res } = await testRoute(router, 'get', '/:jobId/status', {
        params: { jobId: 'job-123' }
      });

      expect(mockJobRepository.getJob).toHaveBeenCalledWith('job-123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-123',
          status: 'completed',
          progress: 100,
          result: { pathId: 'path-123' }
        })
      );
    });

    it('should return job with failed status and error', async () => {
      const router = createRouter();
      const mockJob = createMockJob({
        id: 'job-123',
        status: 'failed',
        progress: 50,
        error: 'AI API timeout'
      });

      // Use mockResolvedValueOnce to ensure this specific value is returned
      mockJobRepository.getJob.mockResolvedValueOnce(mockJob);

      const { res } = await testRoute(router, 'get', '/:jobId/status', {
        params: { jobId: 'job-123' }
      });

      expect(mockJobRepository.getJob).toHaveBeenCalledWith('job-123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-123',
          status: 'failed',
          error: 'AI API timeout'
        })
      );
    });
  });

  // Add more tests for job creation, updates, etc.
});

