import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createSkillsGapsRouter } from '../src/api/routes/skillsGaps.js';
import { createCompletionsRouter } from '../src/api/routes/completions.js';
import { testRoute, createMockSkillsGap, createMockLearningPath } from './testHelpers.js';

/**
 * Feature: API Routes
 * 
 * Tests API endpoints:
 * - Skills gaps endpoints
 * - Completions endpoints
 * - Courses endpoints
 * - Learners endpoints
 * - Error handling and validation
 */
describe('Feature: API Routes', () => {
  describe('Skills Gaps Routes', () => {
    let mockSkillsGapRepository;
    let mockLearnerRepository;
    let mockCompanyRepository;

    beforeEach(() => {
      mockSkillsGapRepository = {
        getAllSkillsGaps: jest.fn().mockResolvedValue([]), // Default to empty array
        getSkillsGapById: jest.fn(),
        getSkillsGapsByUser: jest.fn(),
        getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue(null), // Default to null (new gap)
        createSkillsGap: jest.fn(),
        updateSkillsGap: jest.fn()
      };

      mockLearnerRepository = {
        getLearnerById: jest.fn().mockResolvedValue(null), // Default to null (new learner)
        createLearner: jest.fn().mockResolvedValue({}),
        updateLearner: jest.fn().mockResolvedValue({})
      };

      mockCompanyRepository = {
        getCompanyById: jest.fn().mockResolvedValue(null), // Default to null (new company)
        upsertCompany: jest.fn().mockResolvedValue({ companyId: 'company-456' }) // Required by ProcessSkillsGapUpdateUseCase
      };
    });
    
    // Create router in each test to ensure fresh mocks
    const createRouter = () => {
      return createSkillsGapsRouter({
        skillsGapRepository: mockSkillsGapRepository,
        learnerRepository: mockLearnerRepository,
        companyRepository: mockCompanyRepository
        // Note: processGapUpdateUseCase is created internally by the router
      });
    };

    describe('POST /api/v1/skills-gaps', () => {
      it('should process skills gap update', async () => {
        const gapData = {
          user_id: 'user-123',
          user_name: 'Alice Johnson',
          company_id: 'company-456',
          company_name: 'TechCorp Inc.',
          competency_name: 'JavaScript ES6+ Syntax',
          status: 'pass', // Use 'status' instead of 'exam_status' for new flow
          gap: {
            'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced']
          }
        };

        const mockSkillsGap = createMockSkillsGap();
        // Mock the repository methods that ProcessSkillsGapUpdateUseCase will call
        mockSkillsGapRepository.createSkillsGap.mockResolvedValue(mockSkillsGap);
        const testRouter = createRouter();

        const { res } = await testRoute(testRouter, 'post', '/', {
          body: gapData
        });

        expect(res.status).toHaveBeenCalledWith(200);
        // Verify that the use case was called (it's created internally, so we check repository calls)
        expect(mockCompanyRepository.upsertCompany).toHaveBeenCalled();
        expect(mockSkillsGapRepository.createSkillsGap).toHaveBeenCalled();
      });

      it('should validate required fields', async () => {
        const invalidData = { user_id: 'user-123' }; // Missing required fields
        const testRouter = createRouter();

        const { res } = await testRoute(testRouter, 'post', '/', {
          body: invalidData
        });

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('GET /api/v1/skills-gaps', () => {
      it('should get all skills gaps', async () => {
        const mockGaps = [createMockSkillsGap()];
        // Create a fresh mock repository with the test data
        const testMockRepository = {
          ...mockSkillsGapRepository,
          getAllSkillsGaps: jest.fn().mockResolvedValue(mockGaps)
        };
        // Create router with the fresh mock
        const testRouter = createSkillsGapsRouter({
          skillsGapRepository: testMockRepository,
          learnerRepository: mockLearnerRepository,
          companyRepository: mockCompanyRepository
        });

        const { res } = await testRoute(testRouter, 'get', '/', {});

        expect(res.json).toHaveBeenCalledWith({
          skillsGaps: mockGaps,
          count: mockGaps.length
        });
        expect(testMockRepository.getAllSkillsGaps).toHaveBeenCalled();
      });
    });
  });

  describe('Completions Routes', () => {
    let router;
    let mockDetectCompletionUseCase;

    beforeEach(() => {
      mockDetectCompletionUseCase = {
        execute: jest.fn()
      };

      router = createCompletionsRouter({
        detectCompletionUseCase: mockDetectCompletionUseCase
      });
    });

    describe('POST /api/v1/completions', () => {
      it('should process completion event', async () => {
        const completionData = {
          userId: 'user-123', // Use camelCase
          competencyTargetName: 'JavaScript ES6+ Syntax', // Use camelCase
          passed: true // Use boolean, not 'completed'
        };

        mockDetectCompletionUseCase.execute.mockResolvedValue({ 
          processed: true,
          jobId: 'job-123',
          status: 'processing'
        });

        const { res } = await testRoute(router, 'post', '/', {
          body: completionData
        });

        expect(res.status).toHaveBeenCalledWith(202); // Returns 202 for async processing
        expect(mockDetectCompletionUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          competencyTargetName: 'JavaScript ES6+ Syntax',
          passed: true,
          completionDetails: {}
        });
      });
    });
  });

  // Add more route tests (courses, learners, etc.)
});

