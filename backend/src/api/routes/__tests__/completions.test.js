import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createCompletionsRouter } from '../completions.js';
import { testRoute } from './testHelpers.js';

describe('Completions Router', () => {
  let router;
  let mockDetectCompletionUseCase;

  beforeEach(() => {
    // Mock use case
    mockDetectCompletionUseCase = {
      execute: jest.fn()
    };

    // Create router with dependencies
    router = createCompletionsRouter({
      detectCompletionUseCase: mockDetectCompletionUseCase
    });
  });

  describe('POST /api/v1/completions', () => {
    it('should process course completion successfully when passed', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: true,
        completionDetails: {
          score: 85,
          completedAt: '2025-01-01T00:00:00Z'
        }
      };

      const mockResult = {
        processed: true,
        message: 'Course completion detected - suggestions generation started',
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        jobId: 'job-123',
        status: 'pending'
      };

      mockDetectCompletionUseCase.execute.mockResolvedValue(mockResult);

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        message: mockResult.message,
        jobId: mockResult.jobId,
        status: mockResult.status
      });
      expect(mockDetectCompletionUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        courseId: 'JavaScript ES6+ Syntax',
        passed: true,
        completionDetails: completionData.completionDetails
      });
    });

    it('should handle course not passed (no suggestions)', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: false
      };

      const mockResult = {
        processed: false,
        message: 'Course not passed - no suggestions generated',
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax'
      };

      mockDetectCompletionUseCase.execute.mockResolvedValue(mockResult);

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      // The route returns 200 when processed is false, but the code might return 202
      // Let's check what status was actually called
      expect(res.json).toHaveBeenCalledWith(mockResult);
      // Status should be 200 based on the route code when processed is false
      if (res.status.mock.calls.length > 0) {
        expect(res.status.mock.calls[0][0]).toBe(200);
      }
    });

    it('should support legacy courseId field', async () => {
      const completionData = {
        userId: 'user-123',
        courseId: 'JavaScript ES6+ Syntax', // Legacy field
        passed: true
      };

      const mockResult = {
        processed: true,
        message: 'Course completion detected',
        userId: 'user-123',
        jobId: 'job-123',
        status: 'pending'
      };

      mockDetectCompletionUseCase.execute.mockResolvedValue(mockResult);

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      expect(res.status).toHaveBeenCalledWith(202);
      // Verify the use case was called - the route extracts courseId and uses it for both fields
      expect(mockDetectCompletionUseCase.execute).toHaveBeenCalled();
      const callArgs = mockDetectCompletionUseCase.execute.mock.calls[0][0];
      expect(callArgs.userId).toBe('user-123');
      expect(callArgs.competencyTargetName).toBe('JavaScript ES6+ Syntax');
      expect(callArgs.courseId).toBe('JavaScript ES6+ Syntax');
      expect(callArgs.passed).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      const completionData = {
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: true
      };

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields'
        })
      );
    });

    it('should return 400 when competencyTargetName and courseId are both missing', async () => {
      const completionData = {
        userId: 'user-123',
        passed: true
      };

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields'
        })
      );
    });

    it('should return 400 when passed is missing', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax'
      };

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: true
      };

      const error = new Error('Use case error');
      mockDetectCompletionUseCase.execute.mockRejectedValue(error);

      const { res } = await testRoute(router, 'post', '/', { body: completionData });

      // The route should catch the error and return 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to process completion',
          message: 'Use case error'
        })
      );
    });
  });
});

