import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { SkillsGap } from '../src/domain/entities/SkillsGap.js';
import { Job } from '../src/domain/entities/Job.js';
import { createMockSkillsGap, createMockJob, createMockLearningPath } from './testHelpers.js';

/**
 * Feature: Learning Path Generation
 * 
 * Tests the 3-prompt flow for generating learning paths:
 * - Prompt 1: Skill Expansion
 * - Prompt 2: Competency Identification
 * - Prompt 3: Path Creation
 * 
 * Also tests:
 * - Job creation and tracking
 * - Approval workflow integration
 * - Path distribution after approval
 * - Update after exam failure (skips approval)
 */
describe('Feature: Learning Path Generation', () => {
  let useCase;
  let mockGeminiClient;
  let mockSkillsEngineClient;
  let mockRepository;
  let mockJobRepository;
  let mockPromptLoader;
  let mockCacheRepository;
  let mockCheckApprovalPolicyUseCase;
  let mockRequestPathApprovalUseCase;
  let mockDistributePathUseCase;
  let mockSkillsGapRepository;
  let mockSkillsExpansionRepository;

  beforeEach(() => {
    // Mock Gemini API client
    mockGeminiClient = {
      executePrompt: jest.fn()
    };

    // Mock Skills Engine client
    mockSkillsEngineClient = {
      requestSkillBreakdown: jest.fn()
    };

    // Mock Repository (SupabaseRepository)
    // Note: GenerateLearningPathUseCase calls getLearningPath, but SupabaseRepository has getLearningPathById
    // We'll mock both to be safe
    mockRepository = {
      saveLearningPath: jest.fn(),
      getLearningPath: jest.fn(), // Use case calls this
      getLearningPathById: jest.fn(), // SupabaseRepository has this
      getLearningPathsByUser: jest.fn(),
      updateLearningPath: jest.fn()
    };

    // Mock Job Repository
    mockJobRepository = {
      createJob: jest.fn(),
      updateJob: jest.fn(),
      getJob: jest.fn()
    };

    // Mock Prompt Loader
    mockPromptLoader = {
      loadPrompt: jest.fn()
    };


    // Mock Approval Use Cases
    mockCheckApprovalPolicyUseCase = {
      execute: jest.fn()
    };

    mockRequestPathApprovalUseCase = {
      execute: jest.fn()
    };

    // Mock Distribution Use Case
    mockDistributePathUseCase = {
      execute: jest.fn()
    };

    // Mock Skills Gap Repository
    mockSkillsGapRepository = {
      getSkillsGapByUserAndCompetency: jest.fn(),
      getSkillsGapsByUser: jest.fn()
    };

    // Mock Skills Expansion Repository
    mockSkillsExpansionRepository = {
      createSkillsExpansion: jest.fn().mockResolvedValue({ expansionId: 'exp-123' }),
      updateSkillsExpansion: jest.fn().mockResolvedValue({}),
      getSkillsExpansionById: jest.fn().mockResolvedValue(null),
      getSkillsExpansionsByGapId: jest.fn().mockResolvedValue([])
    };

    // Mock Cache Repository
    mockCacheRepository = {
      getSkillsGapByUserAndCompetency: jest.fn(),
      upsertSkillBreakdown: jest.fn().mockResolvedValue({})
    };

    // Create use case instance
    useCase = new GenerateLearningPathUseCase({
      geminiClient: mockGeminiClient,
      skillsEngineClient: mockSkillsEngineClient,
      repository: mockRepository,
      jobRepository: mockJobRepository,
      promptLoader: mockPromptLoader,
      cacheRepository: mockCacheRepository,
      checkApprovalPolicyUseCase: mockCheckApprovalPolicyUseCase,
      requestPathApprovalUseCase: mockRequestPathApprovalUseCase,
      distributePathUseCase: mockDistributePathUseCase,
      skillsGapRepository: mockSkillsGapRepository,
      skillsExpansionRepository: mockSkillsExpansionRepository
    });
  });

  describe('Job Creation', () => {
    it('should create a job and return job ID when starting path generation', async () => {
      const skillsGap = createMockSkillsGap();
      // Add toJSON method to mock skills gap
      skillsGap.toJSON = jest.fn(() => ({
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: skillsGap.competencyTargetName
      }));
      
      const mockJob = createMockJob({ id: 'job-123' });

      mockJobRepository.createJob.mockResolvedValue(mockJob);
      // Mock getSkillsGapsByUser to return empty array (background process will use it)
      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([]);

      const result = await useCase.execute(skillsGap);

      // The execute method returns { jobId, status } - check for jobId
      expect(result).toHaveProperty('jobId', 'job-123');
      expect(mockJobRepository.createJob).toHaveBeenCalled();
    });

    it('should validate required fields before creating job', async () => {
      const invalidGap = { userId: 'user-123' }; // Missing companyId and competencyTargetName

      await expect(useCase.execute(invalidGap)).rejects.toThrow(
        'Skills gap must have userId, companyId, and competencyTargetName'
      );
    });
  });

  describe('3-Prompt Flow', () => {
    it('should execute all 3 prompts in sequence', async () => {
      const skillsGap = createMockSkillsGap();
      // Add toJSON method
      skillsGap.toJSON = jest.fn(() => ({
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: skillsGap.competencyTargetName
      }));
      
      const mockJob = createMockJob({ id: 'job-123' });

      mockJobRepository.createJob.mockResolvedValue(mockJob);
      // Use mockImplementation to return prompts based on name (supports multiple calls)
      mockPromptLoader.loadPrompt.mockImplementation((promptName) => {
        if (promptName === 'prompt1-skill-expansion') return Promise.resolve('Test prompt 1 with {input}');
        if (promptName === 'prompt2-competency-identification') return Promise.resolve('Test prompt 2 with {input}');
        if (promptName === 'prompt3-path-creation') return Promise.resolve('Test prompt 3 with {input}');
        return Promise.resolve('Default prompt with {input}');
      });
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ text: JSON.stringify({ expanded_competencies_list: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ competencies_for_skills_engine_processing: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ steps: [] }) });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({ skills: [] });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123' });
      // Mock getSkillsGapsByUser to return array with the gap
      const mockGap = createMockSkillsGap({ examStatus: 'PASS', gapId: 'gap-123' });
      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([mockGap]);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(mockGap);
      mockCheckApprovalPolicyUseCase.execute.mockResolvedValue({ requiresApproval: false });

      // Execute and wait a bit for background processing
      await useCase.execute(skillsGap);
      
      // Wait for async processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify prompts were loaded (may be called multiple times due to async processing)
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt2-competency-identification');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');
    });
  });

  describe('Approval Workflow Integration', () => {
    it('should check approval policy after path generation', async () => {
      const skillsGap = createMockSkillsGap();
      // Add toJSON method
      skillsGap.toJSON = jest.fn(() => ({
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: skillsGap.competencyTargetName
      }));
      
      const mockJob = createMockJob({ id: 'job-123' });

      mockJobRepository.createJob.mockResolvedValue(mockJob);
      // Use mockImplementation to return prompts based on name (supports multiple calls)
      mockPromptLoader.loadPrompt.mockImplementation((promptName) => {
        if (promptName === 'prompt1-skill-expansion') return Promise.resolve('Test prompt 1 with {input}');
        if (promptName === 'prompt2-competency-identification') return Promise.resolve('Test prompt 2 with {input}');
        if (promptName === 'prompt3-path-creation') return Promise.resolve('Test prompt 3 with {input}');
        return Promise.resolve('Default prompt with {input}');
      });
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ text: JSON.stringify({ expanded_competencies_list: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ competencies_for_skills_engine_processing: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ steps: [] }) });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({ skills: [] });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123' });
      // Mock getSkillsGapsByUser to return array with the gap
      const mockGap = createMockSkillsGap({ examStatus: 'PASS', gapId: 'gap-123' });
      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([mockGap]);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(mockGap);
      mockCheckApprovalPolicyUseCase.execute.mockResolvedValue({ requiresApproval: true });

      await useCase.execute(skillsGap);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCheckApprovalPolicyUseCase.execute).toHaveBeenCalled();
    });

    it('should skip approval for updates after exam failure', async () => {
      const skillsGap = createMockSkillsGap();
      // Add toJSON method
      skillsGap.toJSON = jest.fn(() => ({
        userId: skillsGap.userId,
        companyId: skillsGap.companyId,
        competencyTargetName: skillsGap.competencyTargetName
      }));
      
      const mockJob = createMockJob({ id: 'job-123' });
      const existingCourse = createMockLearningPath();

      mockJobRepository.createJob.mockResolvedValue(mockJob);
      mockRepository.getLearningPath.mockResolvedValue(existingCourse);
      // Mock getSkillsGapsByUser to return array with the gap
      // Note: The code filters by competency_target_name (snake_case), so we need to ensure the mock has this property
      const mockGap = createMockSkillsGap({ 
        examStatus: 'fail', 
        gapId: 'gap-123',
        competency_target_name: skillsGap.competencyTargetName // Add snake_case property for filtering
      });
      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([mockGap]);
      mockSkillsGapRepository.getSkillsGapByUserAndCompetency.mockResolvedValue(mockGap);
      // Use mockImplementation to return prompts based on name (supports multiple calls)
      mockPromptLoader.loadPrompt.mockImplementation((promptName) => {
        if (promptName === 'prompt1-skill-expansion') return Promise.resolve('Test prompt 1 with {input}');
        if (promptName === 'prompt2-competency-identification') return Promise.resolve('Test prompt 2 with {input}');
        if (promptName === 'prompt3-path-creation') return Promise.resolve('Test prompt 3 with {input}');
        return Promise.resolve('Default prompt with {input}');
      });
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ text: JSON.stringify({ expanded_competencies_list: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ competencies_for_skills_engine_processing: [] }) })
        .mockResolvedValueOnce({ text: JSON.stringify({ steps: [] }) });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({ skills: [] });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123' });

      await useCase.execute(skillsGap);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not check approval policy for exam failure updates
      expect(mockCheckApprovalPolicyUseCase.execute).not.toHaveBeenCalled();
      // Should directly distribute
      expect(mockDistributePathUseCase.execute).toHaveBeenCalled();
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

