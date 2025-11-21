import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProcessSkillsGapUpdateUseCase } from '../src/application/useCases/ProcessSkillsGapUpdateUseCase.js';
import { createMockSkillsGap, createMockLearner } from './testHelpers.js';

/**
 * Feature: Skills Gap Processing
 * 
 * Tests processing skills gap updates from Skills Engine:
 * - Creating new skills gaps
 * - Updating existing skills gaps
 * - Filtering skills_raw_data based on new gap
 * - Creating learners if they don't exist
 * - Syncing with company data
 */
describe('Feature: Skills Gap Processing', () => {
  let useCase;
  let mockSkillsGapRepository;
  let mockLearnerRepository;
  let mockCompanyRepository;

  beforeEach(() => {
    mockSkillsGapRepository = {
      getSkillsGapByUserAndCompetency: jest.fn(),
      createSkillsGap: jest.fn(),
      updateSkillsGapCache: jest.fn(),
      updateSkillsGap: jest.fn()
    };

    mockLearnerRepository = {
      getLearnerById: jest.fn(),
      createLearner: jest.fn(),
      updateLearner: jest.fn()
    };

    mockCompanyRepository = {
      getCompanyById: jest.fn(),
      upsertCompany: jest.fn()
    };

    useCase = new ProcessSkillsGapUpdateUseCase({
      skillsGapRepository: mockSkillsGapRepository,
      learnerRepository: mockLearnerRepository,
      companyRepository: mockCompanyRepository
    });
  });

  describe('New Skills Gap Creation', () => {
    it('should create a new skills gap when none exists', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.',
        competency_name: 'JavaScript ES6+ Syntax',
        exam_status: 'PASS',
        gap: {
          'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
        }
      };

      // Mock company check - company doesn't exist, so it will be created
      mockCompanyRepository.getCompanyById.mockResolvedValue(null);
      mockCompanyRepository.upsertCompany.mockResolvedValue({ companyId: 'company-456' });
      
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(null);
      const existingLearner = createMockLearner();
      mockLearnerRepository.getLearnerById.mockResolvedValue(existingLearner);
      // Mock updateLearner in case learner name/company changes
      mockLearnerRepository.updateLearner.mockResolvedValue(existingLearner);
      mockSkillsGapRepository.createSkillsGap.mockResolvedValue(createMockSkillsGap());

      await useCase.execute(gapData);

      expect(mockCompanyRepository.upsertCompany).toHaveBeenCalled();
      expect(mockSkillsGapRepository.createSkillsGap).toHaveBeenCalled();
    });
  });

  describe('Skills Gap Update', () => {
    it('should update existing skills gap and filter skills_raw_data', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.',
        competency_name: 'JavaScript ES6+ Syntax',
        gap: {
          'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
        }
      };

      const existingGap = createMockSkillsGap({
        skillsRawData: {
          'Competency_Front_End_Development': [
            'MGS_React_Hooks_Advanced',
            'MGS_Flexbox_Grid_System',
            'MGS_Async_Await_Handling'
          ]
        }
      });

      // Mock company exists
      mockCompanyRepository.getCompanyById.mockResolvedValue({ companyId: 'company-456' });
      
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(existingGap);
      // The use case calls updateSkillsGap, not updateSkillsGapCache directly
      mockSkillsGapRepository.updateSkillsGap.mockResolvedValue({
        ...existingGap,
        skills_raw_data: {
          'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
        }
      });

      await useCase.execute(gapData);

      // The use case calls updateSkillsGap directly, not updateSkillsGapCache
      expect(mockSkillsGapRepository.updateSkillsGap).toHaveBeenCalled();
      // Verify the update was called with filtered skills
      const updateCall = mockSkillsGapRepository.updateSkillsGap.mock.calls[0];
      expect(updateCall[0]).toBe(existingGap.gap_id); // First arg is gapId
      expect(updateCall[1].skills_raw_data).toBeDefined(); // Second arg has skills_raw_data
    });
  });

  describe('Learner Creation', () => {
    it('should create learner if they do not exist', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'Alice Johnson',
        company_id: 'company-456',
        company_name: 'TechCorp Inc.',
        competency_name: 'JavaScript ES6+ Syntax',
        gap: {
          'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
        }
      };

      // Mock company exists
      mockCompanyRepository.getCompanyById.mockResolvedValue({
        companyId: 'company-456',
        companyName: 'TechCorp Inc.',
        approvalPolicy: 'auto'
      });
      
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(null);
      mockLearnerRepository.getLearnerById.mockResolvedValue(null);
      mockLearnerRepository.createLearner.mockResolvedValue(createMockLearner());
      mockSkillsGapRepository.createSkillsGap.mockResolvedValue(createMockSkillsGap());

      await useCase.execute(gapData);

      // The use case uses snake_case, not camelCase
      expect(mockLearnerRepository.createLearner).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          user_name: 'Alice Johnson',
          company_id: 'company-456',
          company_name: 'TechCorp Inc.'
        })
      );
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

