import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../useCases/GenerateLearningPathUseCase.js';
import { SkillsGap } from '../../domain/entities/SkillsGap.js';
import { Job } from '../../domain/entities/Job.js';

describe('GenerateLearningPathUseCase', () => {
  let useCase;
  let mockGeminiClient;
  let mockSkillsEngineClient;
  let mockRepository;
  let mockJobRepository;
  let mockPromptLoader;

  beforeEach(() => {
    // Mock Gemini API client
    mockGeminiClient = {
      executePrompt: jest.fn()
    };

    // Mock Skills Engine client
    mockSkillsEngineClient = {
      requestSkillBreakdown: jest.fn()
    };

    // Mock Repository
    mockRepository = {
      saveLearningPath: jest.fn(),
      getLearningPath: jest.fn()
    };

    // Mock Job Repository
    mockJobRepository = {
      createJob: jest.fn(),
      updateJob: jest.fn(),
      getJob: jest.fn()
    };

    // Mock Prompt Loader
    mockPromptLoader = {
      loadPrompt: jest.fn().mockResolvedValue('Mock prompt template with {input} placeholder')
    };

    useCase = new GenerateLearningPathUseCase({
      geminiClient: mockGeminiClient,
      skillsEngineClient: mockSkillsEngineClient,
      repository: mockRepository,
      jobRepository: mockJobRepository,
      promptLoader: mockPromptLoader,
      cacheRepository: null, // Optional - not used in these tests
      checkApprovalPolicyUseCase: null, // Optional - not used in these tests
      requestPathApprovalUseCase: null, // Optional - not used in these tests
      distributePathUseCase: null // Optional - not used in these tests
    });
  });

  describe('execute', () => {
    it('should create a job and return job ID when skills gap is received', async () => {
      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        microSkills: [{ id: 'micro-1', name: 'Micro Skill 1' }],
        nanoSkills: [{ id: 'nano-1', name: 'Nano Skill 1' }]
      });

      const mockJob = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'pending'
      });

      mockJobRepository.createJob.mockResolvedValue(mockJob);

      const result = await useCase.execute(skillsGap);

      expect(mockJobRepository.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          companyId: 'company-456',
          competencyTargetName: 'course-789',
          type: 'path-generation'
        })
      );
      expect(result.jobId).toBe('job-123');
      expect(result.status).toBe('pending');
    });

    it('should validate skills gap has required fields', async () => {
      const invalidGap = new SkillsGap({
        userId: null,
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789' // Legacy support
      });

      await expect(useCase.execute(invalidGap)).rejects.toThrow();
    });
  });

  describe('processJob', () => {
    it('should execute Prompt 1 (Skill Expansion) successfully', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'pending'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        microSkills: [{ id: 'micro-1', name: 'Micro Skill 1' }]
      });

      // Mock all 3 prompts since processJob runs the full flow
      mockPromptLoader.loadPrompt
        .mockResolvedValueOnce('Prompt 1 template: {input}')
        .mockResolvedValueOnce('Prompt 2 template: {input}')
        .mockResolvedValueOnce('Prompt 3 template: {initialGap} {expandedBreakdown}');
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({
          expanded_competencies_list: [
            { competency_name: 'Competency A', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' },
            { competency_name: 'Competency B', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' }
          ]
        })
        .mockResolvedValueOnce({
          competencies_for_skills_engine_processing: [
            { competency_name: 'Competency A', target_level: 'Intermediate' }
          ]
        })
        .mockResolvedValueOnce({
          learning_modules: [
            { module_id: 'module-1', title: 'Module 1', steps: [] }
          ],
          path_title: 'Test Path'
        });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        'Competency A': { microSkills: [], nanoSkills: [] }
      });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123', competency_target_name: 'course-789' });
      mockJobRepository.updateJob.mockResolvedValue({});

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledTimes(3);
      expect(mockJobRepository.updateJob).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          currentStage: 'competency-identification',
          progress: 30
        })
      );
    });

    it('should execute Prompt 2 (Competency Identification) after Prompt 1', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'processing',
        currentStage: 'skill-expansion'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789' // Legacy support
      });

      const prompt1Result = {
        expanded_competencies_list: [
          { competency_name: 'Competency A', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Desc A' },
          { competency_name: 'Competency B', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Desc B' },
          { competency_name: 'Competency C', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Desc C' }
        ]
      };

      const prompt2Result = {
        competencies_for_skills_engine_processing: [
          { competency_name: 'Competency A', target_level: 'Intermediate', source_type: 'Out-of-the-Box', example_query_to_send: 'query A' },
          { competency_name: 'Competency B', target_level: 'Intermediate', source_type: 'Out-of-the-Box', example_query_to_send: 'query B' }
        ],
        standard_skills_engine_query_template: 'template'
      };

      mockPromptLoader.loadPrompt
        .mockResolvedValueOnce('Prompt 1 template: {input}')
        .mockResolvedValueOnce('Prompt 2 template: {input}')
        .mockResolvedValueOnce('Prompt 3 template: {initialGap} {expandedBreakdown}');
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce(prompt1Result)
        .mockResolvedValueOnce(prompt2Result)
        .mockResolvedValueOnce({
          learning_modules: [
            { module_id: 'module-1', title: 'Module 1', steps: [] }
          ],
          path_title: 'Test Path'
        });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        'Competency A': { microSkills: [], nanoSkills: [] }
      });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123', competency_target_name: 'course-789' });
      mockJobRepository.updateJob.mockResolvedValue({});

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledTimes(3);
      // Check that Prompt 2 was called with JSON containing Competency A
      const prompt2Call = mockGeminiClient.executePrompt.mock.calls[1];
      expect(prompt2Call[0]).toContain('Competency A');
    });

    it('should request skill breakdown from Skills Engine after Prompt 2', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'processing',
        currentStage: 'competency-identification'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789' // Legacy support
      });

      // Note: The test defines competencies but the actual extraction happens from prompt2Result
      // The extraction maps competency_name -> name, target_level -> targetLevel, etc.

      const skillBreakdown = {
        'Competency A': {
          microSkills: [{ id: 'micro-a1', name: 'Micro A1' }],
          nanoSkills: [{ id: 'nano-a1', name: 'Nano A1' }]
        }
      };

      mockPromptLoader.loadPrompt
        .mockResolvedValueOnce('Prompt 1 template: {input}')
        .mockResolvedValueOnce('Prompt 2 template: {input}')
        .mockResolvedValueOnce('Prompt 3 template: {initialGap} {expandedBreakdown}');
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ 
          expanded_competencies_list: [
            { competency_name: 'Competency A', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' },
            { competency_name: 'Competency B', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' }
          ]
        })
        .mockResolvedValueOnce({ 
          competencies_for_skills_engine_processing: [
            { competency_name: 'Competency A', target_level: 'Intermediate', source_type: 'Out-of-the-Box', example_query_to_send: 'query A' },
            { competency_name: 'Competency B', target_level: 'Intermediate', source_type: 'Out-of-the-Box', example_query_to_send: 'query B' }
          ],
          standard_skills_engine_query_template: 'template'
        })
        .mockResolvedValueOnce({
          learning_modules: [
            { module_id: 'module-1', title: 'Module 1', steps: [] }
          ],
          path_title: 'Test Path'
        });
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue(skillBreakdown);
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123', competency_target_name: 'course-789' });
      mockJobRepository.updateJob.mockResolvedValue({});

      await useCase.processJob(job, skillsGap);

      expect(mockSkillsEngineClient.requestSkillBreakdown).toHaveBeenCalled();
      const breakdownCall = mockSkillsEngineClient.requestSkillBreakdown.mock.calls[0][0];
      expect(breakdownCall).toBeInstanceOf(Array);
      expect(breakdownCall.length).toBe(2); // Should have 2 competencies
      // The extraction maps competency_name to name, so check for name property
      expect(breakdownCall[0]).toHaveProperty('name');
      expect(breakdownCall[0].name).toBe('Competency A');
      expect(breakdownCall[1].name).toBe('Competency B');
    });

    it('should execute Prompt 3 (Path Creation) with combined data', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'processing',
        currentStage: 'skill-breakdown'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        microSkills: [{ id: 'micro-1', name: 'Initial Micro' }]
      });

      const pathResult = {
        learning_modules: [
          { module_id: 'module-1', title: 'Module 1', steps: [{ id: 'step-1', title: 'Step 1', order: 1 }] },
          { module_id: 'module-2', title: 'Module 2', steps: [{ id: 'step-2', title: 'Step 2', order: 2 }] }
        ],
        path_title: 'Test Learning Path'
      };

      mockPromptLoader.loadPrompt
        .mockResolvedValueOnce('Prompt 1 template: {input}')
        .mockResolvedValueOnce('Prompt 2 template: {input}')
        .mockResolvedValueOnce('Prompt 3 template: {initialGap} {expandedBreakdown}');
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ 
          expanded_competencies_list: [
            { competency_name: 'Competency A', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' }
          ]
        })
        .mockResolvedValueOnce({ 
          competencies_for_skills_engine_processing: [{ name: 'Competency A', targetLevel: 'Intermediate' }] 
        })
        .mockResolvedValueOnce(pathResult);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        'Competency A': { microSkills: [], nanoSkills: [] }
      });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123', competency_target_name: 'course-789' });
      mockJobRepository.updateJob.mockResolvedValue({});

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledTimes(3);
      // Check that Prompt 3 was called with the formatted input containing Initial Micro
      const prompt3Call = mockGeminiClient.executePrompt.mock.calls[2];
      expect(prompt3Call[0]).toContain('Initial Micro');
    });

    it('should mark job as completed when path is generated', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'processing'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789' // Legacy support
      });

      const pathResult = {
        learning_modules: [
          { module_id: 'module-1', title: 'Module 1', steps: [{ id: 'step-1', title: 'Step 1' }] }
        ],
        path_title: 'Test Learning Path'
      };

      mockPromptLoader.loadPrompt
        .mockResolvedValueOnce('Prompt 1 template: {input}')
        .mockResolvedValueOnce('Prompt 2 template: {input}')
        .mockResolvedValueOnce('Prompt 3 template: {input}');
      mockGeminiClient.executePrompt
        .mockResolvedValueOnce({ 
          expanded_competencies_list: [
            { competency_name: 'Competency A', competency_type: 'Out-of-the-Box', target_level: 'Intermediate', justification: 'Test' }
          ]
        })
        .mockResolvedValueOnce({ 
          competencies_for_skills_engine_processing: [{ name: 'Competency A', targetLevel: 'Intermediate' }] 
        })
        .mockResolvedValueOnce(pathResult);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        'Competency A': { microSkills: [], nanoSkills: [] }
      });
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123', competency_target_name: 'course-789' });
      mockJobRepository.updateJob.mockResolvedValue({});

      await useCase.processJob(job, skillsGap);

      expect(mockJobRepository.updateJob).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          status: 'completed',
          progress: 100
        })
      );
      expect(mockRepository.saveLearningPath).toHaveBeenCalled();
    });

    it('should handle errors and mark job as failed', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789', // Legacy support
        type: 'path-generation',
        status: 'processing'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        competencyTargetName: 'course-789',
        courseId: 'course-789' // Legacy support
      });

      mockPromptLoader.loadPrompt.mockResolvedValue('Prompt 1 template: {input}');
      const error = new Error('Gemini API failed');
      mockGeminiClient.executePrompt.mockRejectedValue(error);
      mockJobRepository.updateJob.mockResolvedValue({});

      await expect(useCase.processJob(job, skillsGap)).rejects.toThrow('Gemini API failed');

      expect(mockJobRepository.updateJob).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          status: 'failed',
          error: 'Gemini API failed'
        })
      );
    });
  });
});

