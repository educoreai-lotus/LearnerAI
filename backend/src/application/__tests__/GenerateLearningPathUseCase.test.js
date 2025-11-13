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

    useCase = new GenerateLearningPathUseCase({
      geminiClient: mockGeminiClient,
      skillsEngineClient: mockSkillsEngineClient,
      repository: mockRepository,
      jobRepository: mockJobRepository
    });
  });

  describe('execute', () => {
    it('should create a job and return job ID when skills gap is received', async () => {
      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789',
        microSkills: [{ id: 'micro-1', name: 'Micro Skill 1' }],
        nanoSkills: [{ id: 'nano-1', name: 'Nano Skill 1' }]
      });

      const mockJob = new Job({
        id: 'job-123',
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789',
        type: 'path-generation',
        status: 'pending'
      });

      mockJobRepository.createJob.mockResolvedValue(mockJob);

      const result = await useCase.execute(skillsGap);

      expect(mockJobRepository.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          companyId: 'company-456',
          courseId: 'course-789',
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
        courseId: 'course-789'
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
        courseId: 'course-789',
        type: 'path-generation',
        status: 'pending'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789',
        microSkills: [{ id: 'micro-1', name: 'Micro Skill 1' }]
      });

      mockGeminiClient.executePrompt.mockResolvedValue({
        expandedSkills: ['Competency A', 'Competency B']
      });

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledWith(
        expect.stringContaining('skill-expansion'),
        expect.any(String)
      );
      expect(mockJobRepository.updateJob).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          currentStage: 'skill-expansion',
          progress: expect.any(Number)
        })
      );
    });

    it('should execute Prompt 2 (Competency Identification) after Prompt 1', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        type: 'path-generation',
        status: 'processing',
        currentStage: 'skill-expansion'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789'
      });

      const prompt1Result = {
        expandedSkills: 'Competency A, Competency B, Competency C'
      };

      const prompt2Result = {
        competencies: [
          { name: 'Competency A', description: 'Desc A' },
          { name: 'Competency B', description: 'Desc B' }
        ]
      };

      mockGeminiClient.executePrompt
        .mockResolvedValueOnce(prompt1Result)
        .mockResolvedValueOnce(prompt2Result);

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledTimes(2);
      expect(mockGeminiClient.executePrompt).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('competency-identification'),
        expect.stringContaining('Competency A')
      );
    });

    it('should request skill breakdown from Skills Engine after Prompt 2', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        type: 'path-generation',
        status: 'processing',
        currentStage: 'competency-identification'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789'
      });

      const competencies = [
        { name: 'Competency A', description: 'Desc A' },
        { name: 'Competency B', description: 'Desc B' }
      ];

      const skillBreakdown = {
        'Competency A': {
          microSkills: [{ id: 'micro-a1', name: 'Micro A1' }],
          nanoSkills: [{ id: 'nano-a1', name: 'Nano A1' }]
        }
      };

      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue(skillBreakdown);

      await useCase.processJob(job, skillsGap);

      expect(mockSkillsEngineClient.requestSkillBreakdown).toHaveBeenCalledWith(
        competencies
      );
    });

    it('should execute Prompt 3 (Path Creation) with combined data', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        type: 'path-generation',
        status: 'processing',
        currentStage: 'skill-breakdown'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789',
        microSkills: [{ id: 'micro-1', name: 'Initial Micro' }]
      });

      const combinedData = {
        initialGap: skillsGap.toJSON(),
        expandedBreakdown: {
          'Competency A': {
            microSkills: [{ id: 'micro-a1', name: 'Micro A1' }]
          }
        }
      };

      const pathResult = {
        pathSteps: [
          { id: 'step-1', title: 'Step 1', order: 1 },
          { id: 'step-2', title: 'Step 2', order: 2 }
        ]
      };

      mockGeminiClient.executePrompt.mockResolvedValue(pathResult);

      await useCase.processJob(job, skillsGap);

      expect(mockGeminiClient.executePrompt).toHaveBeenCalledWith(
        expect.stringContaining('path-creation'),
        expect.stringContaining('Initial Micro')
      );
    });

    it('should mark job as completed when path is generated', async () => {
      const job = new Job({
        id: 'job-123',
        userId: 'user-123',
        type: 'path-generation',
        status: 'processing'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789'
      });

      const pathResult = {
        pathSteps: [{ id: 'step-1', title: 'Step 1' }]
      };

      mockGeminiClient.executePrompt.mockResolvedValue(pathResult);
      mockRepository.saveLearningPath.mockResolvedValue({ id: 'path-123' });

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
        type: 'path-generation',
        status: 'processing'
      });

      const skillsGap = new SkillsGap({
        userId: 'user-123',
        companyId: 'company-456',
        courseId: 'course-789'
      });

      const error = new Error('Gemini API failed');
      mockGeminiClient.executePrompt.mockRejectedValue(error);

      await useCase.processJob(job, skillsGap);

      expect(mockJobRepository.updateJob).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          status: 'failed',
          error: expect.any(String)
        })
      );
    });
  });
});

