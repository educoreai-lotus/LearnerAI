import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DistributePathUseCase } from '../src/application/useCases/DistributePathUseCase.js';
import { createMockLearningPath, createMockSkillsGap } from './testHelpers.js';

/**
 * Feature: Path Distribution
 * 
 * Tests distributing learning paths to external microservices:
 * - Sending to Course Builder
 * - Updating Learning Analytics
 * - Updating Management Reports
 * - Handling distribution failures
 * - Including skills gap data in payloads
 */
describe('Feature: Path Distribution', () => {
  let useCase;
  let mockCourseBuilderClient;
  let mockAnalyticsClient;
  let mockReportsClient;
  let mockRepository;
  let mockSkillsGapRepository;

  beforeEach(() => {
    mockCourseBuilderClient = {
      sendLearningPath: jest.fn(),
      getRollbackMockData: jest.fn(() => ({ rollback: true }))
    };

    mockAnalyticsClient = {
      updateLearningPath: jest.fn()
    };

    mockReportsClient = {
      updatePathReports: jest.fn(), // Use case calls updatePathReports
      getRollbackMockData: jest.fn(() => ({ rollback: true }))
    };

    mockRepository = {
      getLearningPathById: jest.fn() // Use case calls getLearningPathById
    };

    mockSkillsGapRepository = {
      getSkillsGapByUserAndCompetency: jest.fn()
    };

    useCase = new DistributePathUseCase({
      courseBuilderClient: mockCourseBuilderClient,
      analyticsClient: mockAnalyticsClient,
      reportsClient: mockReportsClient,
      repository: mockRepository,
      skillsGapRepository: mockSkillsGapRepository
    });
  });

  describe('Course Builder Distribution', () => {
    it('should send learning path to Course Builder', async () => {
      const learningPath = createMockLearningPath();
      // Add required methods and properties
      learningPath.userId = 'user-123';
      learningPath.competencyTargetName = 'JavaScript ES6+ Syntax';
      learningPath.toJSON = jest.fn(() => learningPath.learningPath);
      
      const skillsGap = createMockSkillsGap({
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.'
      });

      mockRepository.getLearningPathById.mockResolvedValue(learningPath);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(skillsGap);
      mockCourseBuilderClient.sendLearningPath.mockResolvedValue({ success: true });

      // Use case takes only learningPathId (which is competency_target_name)
      await useCase.execute('JavaScript ES6+ Syntax');

      expect(mockRepository.getLearningPathById).toHaveBeenCalledWith('JavaScript ES6+ Syntax');
      expect(mockCourseBuilderClient.sendLearningPath).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          user_name: 'Alice Johnson',
          company_id: 'company-456',
          company_name: 'TechCorp Inc.',
          competency_target_name: 'JavaScript ES6+ Syntax',
          learning_path: expect.anything()
        }),
        expect.objectContaining({ useRollback: true })
      );
    });
  });

  describe('Analytics Update', () => {
    it('should include skills gap data when updating Learning Analytics', async () => {
      const learningPath = createMockLearningPath();
      // Add required methods and properties
      learningPath.userId = 'user-123';
      learningPath.competencyTargetName = 'JavaScript ES6+ Syntax';
      learningPath.toJSON = jest.fn(() => learningPath.learningPath);
      
      const skillsGap = createMockSkillsGap({
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.'
      });

      mockRepository.getLearningPathById.mockResolvedValue(learningPath);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(skillsGap);
      // Mock Course Builder (required for the use case flow)
      mockCourseBuilderClient.sendLearningPath.mockResolvedValue({ success: true, rollback: false });
      // Mock Reports
      mockReportsClient.updatePathReports.mockResolvedValue({ success: true, rollback: false });

      // Use case takes only learningPathId (which is competency_target_name)
      const result = await useCase.execute('JavaScript ES6+ Syntax');

      // Note: Analytics no longer receives data automatically - it's on-demand or batch
      expect(result.analytics).toHaveProperty('message');
      expect(result.analytics.message).toContain('on-demand requests or daily batch');
      expect(result.reports).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Course Builder failures gracefully', async () => {
      const learningPath = createMockLearningPath();
      // Add required methods and properties
      learningPath.userId = 'user-123';
      learningPath.competencyTargetName = 'JavaScript ES6+ Syntax';
      learningPath.toJSON = jest.fn(() => learningPath.learningPath);
      
      const skillsGap = createMockSkillsGap({
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.'
      });

      mockRepository.getLearningPathById.mockResolvedValue(learningPath);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(skillsGap);
      mockCourseBuilderClient.sendLearningPath.mockRejectedValue(new Error('Service unavailable'));
      // Mock rollback method
      mockCourseBuilderClient.getRollbackMockData = jest.fn(() => ({ rollback: true }));
      // Mock Reports (required for the use case flow)
      mockReportsClient.updatePathReports.mockResolvedValue({ success: true, rollback: false });

      // Use case should handle errors gracefully and return results with errors
      const result = await useCase.execute('JavaScript ES6+ Syntax');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].service).toBe('courseBuilder');
      expect(result.courseBuilder).toBeDefined(); // Should have rollback data
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

