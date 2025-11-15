import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createSkillsGapsRouter } from '../skillsGaps.js';
import { testRoute } from './testHelpers.js';

describe('SkillsGaps Router', () => {
  let router;
  let mockSkillsGapRepository;
  let mockLearnerRepository;
  let mockCompanyRepository;
  let mockProcessGapUpdateUseCase;

  beforeEach(() => {
    // Mock repositories
    mockSkillsGapRepository = {
      createSkillsGap: jest.fn(),
      getAllSkillsGaps: jest.fn(),
      getSkillsGapById: jest.fn(),
      getSkillsGapsByUser: jest.fn(),
      getSkillsGapsByCompany: jest.fn(),
      getSkillsGapsByCompetency: jest.fn(),
      getSkillsGapsByExamStatus: jest.fn(),
      updateSkillsGap: jest.fn(),
      deleteSkillsGap: jest.fn()
    };

    mockLearnerRepository = {
      getLearnerById: jest.fn(),
      createLearner: jest.fn(),
      updateLearner: jest.fn()
    };

    mockCompanyRepository = {
      getCompanyById: jest.fn()
    };

    // Create router with dependencies
    // Note: We're testing the legacy flow (without use case) since ES module mocking is complex
    // The use case flow will be tested in integration tests
    router = createSkillsGapsRouter({
      skillsGapRepository: mockSkillsGapRepository,
      learnerRepository: mockLearnerRepository,
      companyRepository: null // Set to null to disable use case, test legacy flow
    });
  });

  describe('POST /api/v1/skills-gaps', () => {
    it('should create skills gap via legacy flow', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'John Doe',
        company_id: 'company-456',
        company_name: 'Test Company',
        skills_raw_data: {
          'Competency_JavaScript': ['MGS_Skill_1', 'MGS_Skill_2']
        },
        exam_status: 'FAIL',
        competency_target_name: 'JavaScript ES6+ Syntax'
      };

      const mockSkillsGap = {
        gap_id: 'gap-123',
        ...gapData
      };

      mockSkillsGapRepository.createSkillsGap.mockResolvedValue(mockSkillsGap);

      const { res } = await testRoute(router, 'post', '/', { body: gapData });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Skills gap created successfully',
        skillsGap: mockSkillsGap
      });
      expect(mockSkillsGapRepository.createSkillsGap).toHaveBeenCalled();
    });


    it('should return 400 when required fields are missing', async () => {
      const gapData = {
        user_id: 'user-123'
        // Missing required fields
      };

      const { res } = await testRoute(router, 'post', '/', { body: gapData });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields'
        })
      );
    });

    it('should return 400 for invalid exam_status', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'John Doe',
        company_id: 'company-456',
        company_name: 'Test Company',
        skills_raw_data: {},
        exam_status: 'invalid'
      };

      const { res } = await testRoute(router, 'post', '/', { body: gapData });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid exam_status'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const gapData = {
        user_id: 'user-123',
        user_name: 'John Doe',
        company_id: 'company-456',
        company_name: 'Test Company',
        skills_raw_data: {}
      };

      mockSkillsGapRepository.createSkillsGap.mockRejectedValue(new Error('Database error'));

      const { res } = await testRoute(router, 'post', '/', { body: gapData });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to process skills gap'
        })
      );
    });
  });

  describe('GET /api/v1/skills-gaps', () => {
    it('should get all skills gaps', async () => {
      const mockGaps = [
        { gap_id: 'gap-1', user_id: 'user-1' },
        { gap_id: 'gap-2', user_id: 'user-2' }
      ];

      mockSkillsGapRepository.getAllSkillsGaps.mockResolvedValue(mockGaps);

      const { res } = await testRoute(router, 'get', '/');

      expect(res.json).toHaveBeenCalledWith({
        count: 2,
        skillsGaps: mockGaps
      });
      expect(mockSkillsGapRepository.getAllSkillsGaps).toHaveBeenCalled();
    });

    it('should handle errors when fetching all gaps', async () => {
      mockSkillsGapRepository.getAllSkillsGaps.mockRejectedValue(new Error('Database error'));

      const { res } = await testRoute(router, 'get', '/');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to fetch skills gaps'
        })
      );
    });
  });

  describe('GET /api/v1/skills-gaps/:gapId', () => {
    it('should get skills gap by ID', async () => {
      const mockGap = {
        gap_id: 'gap-123',
        user_id: 'user-123',
        exam_status: 'FAIL'
      };

      mockSkillsGapRepository.getSkillsGapById.mockResolvedValue(mockGap);

      const { res } = await testRoute(router, 'get', '/:gapId', { params: { gapId: 'gap-123' } });

      expect(res.json).toHaveBeenCalledWith({ skillsGap: mockGap });
      expect(mockSkillsGapRepository.getSkillsGapById).toHaveBeenCalledWith('gap-123');
    });

    it('should return 404 when gap not found', async () => {
      mockSkillsGapRepository.getSkillsGapById.mockResolvedValue(null);

      const { res } = await testRoute(router, 'get', '/:gapId', { params: { gapId: 'non-existent' } });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Skills gap not found'
        })
      );
    });
  });

  describe('GET /api/v1/skills-gaps/user/:userId', () => {
    it('should get all skills gaps for a user', async () => {
      const mockGaps = [
        { gap_id: 'gap-1', user_id: 'user-123' },
        { gap_id: 'gap-2', user_id: 'user-123' }
      ];

      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue(mockGaps);

      const { res } = await testRoute(router, 'get', '/user/:userId', { params: { userId: 'user-123' } });

      expect(res.json).toHaveBeenCalledWith({
        user_id: 'user-123',
        count: 2,
        skillsGaps: mockGaps
      });
      expect(mockSkillsGapRepository.getSkillsGapsByUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('PUT /api/v1/skills-gaps/:gapId', () => {
    it('should update skills gap successfully', async () => {
      const updates = {
        exam_status: 'PASS',
        skills_raw_data: { 'Competency_JavaScript': ['MGS_Skill_1'] }
      };

      const updatedGap = {
        gap_id: 'gap-123',
        ...updates
      };

      mockSkillsGapRepository.updateSkillsGap.mockResolvedValue(updatedGap);

      const { res } = await testRoute(router, 'put', '/:gapId', {
        params: { gapId: 'gap-123' },
        body: updates
      });

      expect(res.json).toHaveBeenCalledWith({
        message: 'Skills gap updated successfully',
        skillsGap: updatedGap
      });
      expect(mockSkillsGapRepository.updateSkillsGap).toHaveBeenCalledWith('gap-123', updates);
    });

    it('should return 400 for invalid exam_status', async () => {
      const updates = {
        exam_status: 'invalid'
      };

      const { res } = await testRoute(router, 'put', '/:gapId', {
        params: { gapId: 'gap-123' },
        body: updates
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid exam_status'
        })
      );
    });
  });

  describe('DELETE /api/v1/skills-gaps/:gapId', () => {
    it('should delete skills gap successfully', async () => {
      mockSkillsGapRepository.deleteSkillsGap.mockResolvedValue(true);

      const { res } = await testRoute(router, 'delete', '/:gapId', { params: { gapId: 'gap-123' } });

      expect(res.json).toHaveBeenCalledWith({
        message: 'Skills gap deleted successfully'
      });
      expect(mockSkillsGapRepository.deleteSkillsGap).toHaveBeenCalledWith('gap-123');
    });
  });
});
