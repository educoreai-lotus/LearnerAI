import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CompanyRepository } from '../src/infrastructure/repositories/CompanyRepository.js';
import { CourseRepository } from '../src/infrastructure/repositories/CourseRepository.js';
import { LearnerRepository } from '../src/infrastructure/repositories/LearnerRepository.js';
import { SkillsGapRepository } from '../src/infrastructure/repositories/SkillsGapRepository.js';
import { createMockCompany, createMockLearner, createMockLearningPath, createMockSkillsGap } from './testHelpers.js';

// Helper to create a mock Supabase client
function createMockSupabaseClient() {
  const mockClient = {
    from: jest.fn(() => mockClient),
    select: jest.fn(() => mockClient),
    insert: jest.fn(() => mockClient),
    upsert: jest.fn(() => mockClient),
    update: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    single: jest.fn(),
    order: jest.fn(() => mockClient),
    limit: jest.fn(() => mockClient)
  };
  return mockClient;
}

/**
 * Feature: Repositories
 * 
 * Tests database repository layer:
 * - CRUD operations
 * - Data mapping (DB records to entities)
 * - Query operations
 * - Error handling
 */
describe('Feature: Repositories', () => {
  describe('CompanyRepository', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      // Create repository with fake credentials
      repository = new CompanyRepository('https://fake.supabase.co', 'fake-key');
      
      // Replace the client with our mock
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('should get company by ID', async () => {
      const mockCompany = createMockCompany();
      mockClient.single.mockResolvedValue({
        data: {
          company_id: mockCompany.companyId,
          company_name: mockCompany.companyName,
          approval_policy: mockCompany.approvalPolicy
        },
        error: null
      });

      const result = await repository.getCompanyById('company-456');

      expect(result).toBeDefined();
      expect(result.companyId).toBe('company-456');
      expect(mockClient.from).toHaveBeenCalledWith('companies');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.eq).toHaveBeenCalledWith('company_id', 'company-456');
    });

    it('should upsert company', async () => {
      const company = createMockCompany();
      mockClient.single.mockResolvedValue({
        data: {
          company_id: company.companyId,
          company_name: company.companyName,
          approval_policy: company.approvalPolicy
        },
        error: null
      });

      const result = await repository.upsertCompany({
        company_id: company.companyId,
        company_name: company.companyName,
        approval_policy: company.approvalPolicy
      });

      expect(mockClient.upsert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('CourseRepository', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      // Create repository with fake credentials
      repository = new CourseRepository('https://fake.supabase.co', 'fake-key');
      
      // Replace the client with our mock
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('should get learning path by competency', async () => {
      const mockPath = createMockLearningPath();
      mockClient.single.mockResolvedValue({
        data: {
          competency_target_name: mockPath.competencyTargetName,
          user_id: mockPath.userId,
          learning_path: mockPath.learningPath
        },
        error: null
      });

      // CourseRepository uses getCourseById with competency_target_name
      const result = await repository.getCourseById('JavaScript ES6+ Syntax');

      expect(result).toBeDefined();
      expect(result.competency_target_name).toBe('JavaScript ES6+ Syntax');
    });

    it('should save learning path', async () => {
      const learningPath = createMockLearningPath();
      mockClient.single.mockResolvedValue({
        data: {
          competency_target_name: learningPath.competencyTargetName,
          user_id: learningPath.userId,
          learning_path: learningPath.learningPath
        },
        error: null
      });

      // CourseRepository uses createCourse
      const result = await repository.createCourse({
        competency_target_name: learningPath.competencyTargetName,
        user_id: learningPath.userId,
        learning_path: learningPath.learningPath
      });

      expect(mockClient.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('LearnerRepository', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      // Create repository with fake credentials
      repository = new LearnerRepository('https://fake.supabase.co', 'fake-key');
      
      // Replace the client with our mock
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('should get learner by ID', async () => {
      const mockLearner = createMockLearner();
      mockClient.single.mockResolvedValue({
        data: {
          user_id: mockLearner.userId,
          user_name: mockLearner.userName,
          company_id: mockLearner.companyId,
          company_name: mockLearner.companyName
        },
        error: null
      });

      const result = await repository.getLearnerById('user-123');

      expect(result).toBeDefined();
      // Repository returns snake_case, not camelCase
      expect(result.user_id).toBe('user-123');
    });

    it('should create learner', async () => {
      const learner = createMockLearner();
      mockClient.single.mockResolvedValue({
        data: {
          user_id: learner.userId,
          company_id: learner.companyId,
          company_name: learner.companyName,
          user_name: learner.userName
        },
        error: null
      });

      const result = await repository.createLearner({
        user_id: learner.userId,
        company_id: learner.companyId,
        company_name: learner.companyName,
        user_name: learner.userName
      });

      expect(mockClient.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('SkillsGapRepository', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      // Create repository with fake credentials
      repository = new SkillsGapRepository('https://fake.supabase.co', 'fake-key');
      
      // Replace the client with our mock
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('should get skills gap by user and competency', async () => {
      const mockGap = createMockSkillsGap();
      mockClient.single.mockResolvedValue({
        data: {
          gap_id: mockGap.gapId,
          user_id: mockGap.userId,
          competency_target_name: mockGap.competencyTargetName,
          skills_raw_data: mockGap.skillsRawData,
          exam_status: mockGap.examStatus
        },
        error: null
      });

      const result = await repository.getSkillsGapByUserAndCompetency('user-123', 'JavaScript ES6+ Syntax');

      expect(result).toBeDefined();
      // Repository returns snake_case, not camelCase
      expect(result.user_id).toBe('user-123');
    });

    it('should filter skills_raw_data when updating cache', async () => {
      const existingGap = createMockSkillsGap({
        gapId: 'gap-123',
        skillsRawData: {
          'Competency_Front_End_Development': [
            'MGS_React_Hooks_Advanced',
            'MGS_Flexbox_Grid_System',
            'MGS_Async_Await_Handling'
          ]
        }
      });

      const newSkillIds = ['MGS_React_Hooks_Advanced'];

      // Mock getSkillsGapById (called by updateSkillsGapCache)
      mockClient.single
        .mockResolvedValueOnce({
          data: {
            gap_id: existingGap.gapId,
            skills_raw_data: existingGap.skillsRawData
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            gap_id: existingGap.gapId,
            skills_raw_data: {
              'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
            }
          },
          error: null
        });

      await repository.updateSkillsGapCache(existingGap.gapId, {
        'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
      });

      expect(mockClient.update).toHaveBeenCalled();
    });
  });

  // Add more repository tests
});

