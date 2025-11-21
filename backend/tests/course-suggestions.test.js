import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateCourseSuggestionsUseCase } from '../src/application/useCases/GenerateCourseSuggestionsUseCase.js';
import { createMockLearningPath } from './testHelpers.js';

/**
 * Feature: Course Suggestions
 * 
 * Tests generating course suggestions after completion:
 * - Using AI prompt to generate suggestions
 * - Sending suggestions to RAG microservice
 * - Storing recommendations in database
 * - Handling completion events
 */
describe('Feature: Course Suggestions', () => {
  let useCase;
  let mockGeminiClient;
  let mockRAGClient;
  let mockSuggestionsRepository;
  let mockLearningPathRepository;
  let mockPromptLoader;
  let mockJobRepository;

  beforeEach(() => {
    mockGeminiClient = {
      executePrompt: jest.fn()
    };

    mockRAGClient = {
      processCourseSuggestions: jest.fn() // Use case calls processCourseSuggestions
    };

    mockSuggestionsRepository = {
      saveSuggestion: jest.fn() // Use case calls saveSuggestion
    };

    mockLearningPathRepository = {
      getLearningPathById: jest.fn()
    };

    mockPromptLoader = {
      loadPrompt: jest.fn()
    };

    mockJobRepository = {
      createJob: jest.fn(),
      updateJob: jest.fn(),
      getJob: jest.fn()
    };

    useCase = new GenerateCourseSuggestionsUseCase({
      geminiClient: mockGeminiClient,
      ragClient: mockRAGClient,
      promptLoader: mockPromptLoader,
      suggestionsRepository: mockSuggestionsRepository,
      learningPathRepository: mockLearningPathRepository,
      jobRepository: mockJobRepository
    });
  });

  describe('Suggestion Generation', () => {
    it('should generate suggestions using AI prompt', async () => {
      const completedPath = createMockLearningPath();
      const mockSuggestions = {
        suggested_courses: [
          { name: 'Advanced React Patterns', reason: 'Build on React Hooks knowledge' }
        ]
      };

      const mockJob = { id: 'job-123', status: 'pending' };
      mockJobRepository.createJob.mockResolvedValue(mockJob);
      mockLearningPathRepository.getLearningPathById.mockResolvedValue(completedPath);
      mockPromptLoader.loadPrompt.mockResolvedValue('Generate suggestions prompt');
      // executePrompt returns the text string directly, not an object
      mockGeminiClient.executePrompt.mockResolvedValue(JSON.stringify(mockSuggestions));
      mockRAGClient.processCourseSuggestions.mockResolvedValue({ 
        enhancedSuggestions: mockSuggestions.suggested_courses 
      });
      mockSuggestionsRepository.saveSuggestion.mockResolvedValue({ id: 'suggestion-123' });

      // Use case expects an object with userId and competencyTargetName
      const result = await useCase.execute({
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        completionDate: new Date().toISOString()
      });

      expect(result).toHaveProperty('jobId');
      expect(mockJobRepository.createJob).toHaveBeenCalled();
      
      // Wait for background processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt4-course-suggestions');
    });

    it('should send suggestions to RAG microservice', async () => {
      const completedPath = createMockLearningPath();
      const mockSuggestions = {
        suggested_courses: [{ name: 'Next Course' }]
      };

      const mockJob = { id: 'job-123', status: 'pending' };
      mockJobRepository.createJob.mockResolvedValue(mockJob);
      mockLearningPathRepository.getLearningPathById.mockResolvedValue(completedPath);
      mockPromptLoader.loadPrompt.mockResolvedValue('Prompt');
      // executePrompt returns the text string directly, not an object
      mockGeminiClient.executePrompt.mockResolvedValue(JSON.stringify(mockSuggestions));
      mockRAGClient.processCourseSuggestions.mockResolvedValue({ 
        enhancedSuggestions: mockSuggestions.suggested_courses 
      });
      mockSuggestionsRepository.saveSuggestion.mockResolvedValue({ id: 'suggestion-123' });

      // Use case expects an object with userId and competencyTargetName
      await useCase.execute({
        userId: 'user-123',
        competencyTargetName: 'JavaScript ES6+ Syntax',
        completionDate: new Date().toISOString()
      });

      // Wait for background processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRAGClient.processCourseSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          suggested_courses: mockSuggestions.suggested_courses
        }),
        expect.objectContaining({
          userId: 'user-123',
          competencyTargetName: 'JavaScript ES6+ Syntax'
        })
      );
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

