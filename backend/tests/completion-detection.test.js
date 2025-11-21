import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DetectCompletionUseCase } from '../src/application/useCases/DetectCompletionUseCase.js';
import { createMockLearningPath } from './testHelpers.js';

/**
 * Feature: Completion Detection
 * 
 * Tests detecting course completions:
 * - Processing completion events from Skills Engine
 * - Triggering suggestion generation
 * - Updating course status
 * - Handling completion notifications
 */
describe('Feature: Completion Detection', () => {
  let useCase;
  let mockGenerateCourseSuggestionsUseCase;
  let mockJobRepository;

  beforeEach(() => {
    mockGenerateCourseSuggestionsUseCase = {
      execute: jest.fn()
    };

    mockJobRepository = {
      createJob: jest.fn(),
      updateJob: jest.fn(),
      getJob: jest.fn()
    };

    useCase = new DetectCompletionUseCase({
      generateCourseSuggestionsUseCase: mockGenerateCourseSuggestionsUseCase,
      jobRepository: mockJobRepository
    });
  });

  describe('Completion Processing', () => {
    it('should detect completion and trigger suggestions', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: true,
        completionDetails: {}
      };

      mockGenerateCourseSuggestionsUseCase.execute.mockResolvedValue({
        jobId: 'job-123',
        status: 'processing'
      });

      const result = await useCase.execute(completionData);

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.competencyTargetName).toBe('JavaScript ES6+ Syntax');
      expect(mockGenerateCourseSuggestionsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        completionDate: expect.any(String),
        completionDetails: {}
      });
    });

    it('should update course status to completed', async () => {
      const completionData = {
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        passed: true,
        completionDetails: { score: 95, timeSpent: 3600 }
      };

      mockGenerateCourseSuggestionsUseCase.execute.mockResolvedValue({
        jobId: 'job-123',
        status: 'processing'
      });

      const result = await useCase.execute(completionData);

      expect(result.processed).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.competencyTargetName).toBe('JavaScript ES6+ Syntax');
      expect(result.jobId).toBe('job-123');
      expect(mockGenerateCourseSuggestionsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        completionDate: expect.any(String),
        completionDetails: { score: 95, timeSpent: 3600 }
      });
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

