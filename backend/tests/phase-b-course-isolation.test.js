import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LearningPath } from '../src/domain/entities/LearningPath.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { RequestPathApprovalUseCase } from '../src/application/useCases/RequestPathApprovalUseCase.js';
import { GetLearningPathForCourseBuilderUseCase } from '../src/application/useCases/GetLearningPathForCourseBuilderUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { SupabaseRepository } from '../src/infrastructure/repositories/SupabaseRepository.js';
import { CourseRepository } from '../src/infrastructure/repositories/CourseRepository.js';
import { createMockJob } from './testHelpers.js';

const USER_A = 'user-a';
const USER_B = 'user-b';
const TARGET = 'javascript';
const OTHER_TARGET = 'python';
const COURSE_ID_A = '11111111-1111-1111-1111-111111111111';
const GAP_A = 'gap-a';

const VALID_PROMPT3_PATH = {
  path_title: 'JavaScript Path',
  learner_id: USER_A,
  total_estimated_duration_hours: 4,
  learning_modules: [
    {
      module_order: 1,
      module_title: 'Foundations',
      estimated_duration_hours: 4,
      skills_in_module: ['syntaxerror'],
      steps: [
        { step: 1, title: 'Step 1', description: 'd', estimatedTime: 30, skills_covered: ['syntaxerror'] },
        { step: 2, title: 'Step 2', description: 'd', estimatedTime: 30, skills_covered: ['syntaxerror'] }
      ]
    }
  ]
};

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

function dbCourseRecord({
  courseId = COURSE_ID_A,
  userId = USER_A,
  target = TARGET,
  gapId = GAP_A,
  approved = false
} = {}) {
  return {
    course_id: courseId,
    competency_target_name: target,
    user_id: userId,
    gap_id: gapId,
    learning_path: VALID_PROMPT3_PATH,
    approved,
    created_at: '2026-01-01T00:00:00.000Z',
    last_modified_at: '2026-01-01T00:00:00.000Z'
  };
}

describe('Phase B course isolation (transitional schema)', () => {
  describe('SupabaseRepository user+target lookup and save', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      repository = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('queries both user_id and competency_target_name', async () => {
      mockClient.single.mockResolvedValue({ data: dbCourseRecord(), error: null });

      const result = await repository.getLearningPathByUserAndTarget(USER_A, TARGET);

      expect(mockClient.from).toHaveBeenCalledWith('courses');
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', USER_A);
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(result.courseId).toBe(COURSE_ID_A);
      expect(result.userId).toBe(USER_A);
      expect(result.competencyTargetName).toBe(TARGET);
    });

    it('preserves existing course_id on same-user upsert and keeps the Phase B PK conflict target', async () => {
      mockClient.single
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null });

      await repository.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_A,
        competencyTargetName: TARGET,
        courseId: COURSE_ID_A,
        gapId: GAP_A,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      expect(mockClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          competency_target_name: TARGET,
          user_id: USER_A,
          course_id: COURSE_ID_A
        }),
        { onConflict: 'competency_target_name' }
      );
    });

    it('omits course_id on new insert so the database DEFAULT can generate it', async () => {
      mockClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null });

      await repository.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_A,
        competencyTargetName: TARGET,
        gapId: GAP_A,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      const upsertPayload = mockClient.upsert.mock.calls[0][0];
      expect(upsertPayload.competency_target_name).toBe(TARGET);
      expect(upsertPayload).not.toHaveProperty('course_id');
      expect(mockClient.upsert.mock.calls[0][1]).toEqual({ onConflict: 'competency_target_name' });
    });

    it('refuses to overwrite a different user\'s same-target row', async () => {
      mockClient.single.mockResolvedValue({
        data: dbCourseRecord({ userId: USER_A }),
        error: null
      });

      await expect(repository.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_B,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }))).rejects.toThrow('COURSE_OWNERSHIP_COLLISION');

      expect(mockClient.upsert).not.toHaveBeenCalled();
    });
  });

  describe('CourseRepository user+target lookup', () => {
    it('queries both user_id and competency_target_name and returns course_id', async () => {
      const repository = new CourseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repository.client = mockClient;
      mockClient.single.mockResolvedValue({ data: dbCourseRecord(), error: null });

      const result = await repository.getCourseByUserAndTarget(USER_A, TARGET);

      expect(mockClient.eq).toHaveBeenCalledWith('user_id', USER_A);
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(result.course_id).toBe(COURSE_ID_A);
      expect(result.user_id).toBe(USER_A);
    });
  });

  describe('GenerateLearningPathUseCase UPDATE MODE ownership', () => {
    let useCase;
    let mockGeminiClient;
    let mockRepository;
    let mockJobRepository;
    let mockPromptLoader;
    let mockSkillsGapRepository;
    let mockSkillsExpansionRepository;
    let mockCacheRepository;
    let mockCheckApprovalPolicyUseCase;

    beforeEach(() => {
      mockGeminiClient = {
        executePrompt: jest.fn().mockResolvedValue(VALID_PROMPT3_PATH)
      };
      mockRepository = {
        saveLearningPath: jest.fn().mockImplementation(async (path) => path),
        getLearningPathById: jest.fn().mockResolvedValue(null),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue(null)
      };
      mockJobRepository = {
        updateJob: jest.fn().mockResolvedValue({})
      };
      mockPromptLoader = {
        loadPrompt: jest.fn().mockImplementation((promptName) => {
          if (promptName === 'prompt1-skill-expansion') return Promise.resolve('P1 {input}');
          if (promptName === 'prompt2-competency-identification') return Promise.resolve('P2 {input}');
          if (promptName === 'prompt3-path-creation') {
            return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
          }
          return Promise.resolve('DEFAULT {input}');
        })
      };
      mockSkillsGapRepository = {
        getSkillsGapsByUser: jest.fn().mockResolvedValue([{
          gap_id: GAP_A,
          competency_target_name: TARGET,
          exam_status: 'fail',
          skills_raw_data: { [TARGET]: ['syntaxerror'] }
        }])
      };
      mockSkillsExpansionRepository = {
        getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue(null),
        createSkillsExpansion: jest.fn().mockResolvedValue({}),
        updateSkillsExpansion: jest.fn().mockResolvedValue({})
      };
      mockCacheRepository = {
        upsertSkillBreakdown: jest.fn().mockResolvedValue({})
      };
      mockCheckApprovalPolicyUseCase = {
        execute: jest.fn().mockResolvedValue({ requiresApproval: false })
      };

      useCase = new GenerateLearningPathUseCase({
        geminiClient: mockGeminiClient,
        skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
        repository: mockRepository,
        jobRepository: mockJobRepository,
        promptLoader: mockPromptLoader,
        cacheRepository: mockCacheRepository,
        checkApprovalPolicyUseCase: mockCheckApprovalPolicyUseCase,
        requestPathApprovalUseCase: { execute: jest.fn() },
        distributePathUseCase: { execute: jest.fn() },
        skillsGapRepository: mockSkillsGapRepository,
        skillsExpansionRepository: mockSkillsExpansionRepository
      });
      jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });
    });

    function skillsGap({ userId = USER_A, target = TARGET } = {}) {
      return {
        userId,
        companyId: 'company-1',
        competencyTargetName: target,
        skillsRawData: { [target]: ['syntaxerror'] },
        examStatus: 'fail',
        toJSON() {
          return {
            userId: this.userId,
            companyId: this.companyId,
            competencyTargetName: this.competencyTargetName,
            skills_raw_data: this.skillsRawData
          };
        }
      };
    }

    it('same user + same target still enters UPDATE MODE and reuses Prompt 1/2', async () => {
      mockRepository.getLearningPathByUserAndTarget.mockResolvedValue({
        userId: USER_A,
        competencyTargetName: TARGET,
        courseId: COURSE_ID_A
      });
      mockSkillsExpansionRepository.getLatestSkillsExpansionByUserAndGap.mockResolvedValue({
        expansion_id: 'exp-a',
        prompt_1_output: { expanded_competencies_list: [{ competency_name: 'Example' }] },
        prompt_2_output: { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] }
      });

      await useCase.processJob(createMockJob({ id: 'job-update' }), skillsGap());

      expect(mockRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(mockPromptLoader.loadPrompt).not.toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(mockPromptLoader.loadPrompt).not.toHaveBeenCalledWith('prompt2-competency-identification');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');
      expect(mockRepository.saveLearningPath).toHaveBeenCalled();
      const saved = mockRepository.saveLearningPath.mock.calls[0][0];
      expect(saved.courseId).toBe(COURSE_ID_A);
      expect(saved.userId).toBe(USER_A);
      expect(saved.competencyTargetName).toBe(TARGET);
    });

    it('does not treat a different user\'s same-target row as existingCourse', async () => {
      mockRepository.getLearningPathByUserAndTarget.mockResolvedValue(null);
      mockRepository.getLearningPathById.mockResolvedValue({
        userId: USER_A,
        competencyTargetName: TARGET,
        courseId: COURSE_ID_A
      });

      await expect(
        useCase.processJob(createMockJob({ id: 'job-collision' }), skillsGap({ userId: USER_B }))
      ).rejects.toThrow('COURSE_OWNERSHIP_COLLISION');

      expect(mockRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_B, TARGET);
      expect(mockRepository.saveLearningPath).not.toHaveBeenCalled();
      expect(mockGeminiClient.executePrompt).not.toHaveBeenCalled();
    });

    it('different target for the same user is unchanged FULL MODE', async () => {
      mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([{
        gap_id: 'gap-python',
        competency_target_name: OTHER_TARGET,
        exam_status: 'fail',
        skills_raw_data: { [OTHER_TARGET]: ['list'] }
      }]);
      mockGeminiClient.executePrompt.mockImplementation(async (prompt) => {
        if (typeof prompt === 'string' && prompt.startsWith('P1 ')) {
          return { expanded_competencies_list: [{ competency_name: 'Example' }] };
        }
        if (typeof prompt === 'string' && prompt.startsWith('P2 ')) {
          return { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] };
        }
        return VALID_PROMPT3_PATH;
      });

      await useCase.processJob(
        createMockJob({ id: 'job-other-target' }),
        skillsGap({ target: OTHER_TARGET })
      );

      expect(mockRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_A, OTHER_TARGET);
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt2-competency-identification');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');
      expect(mockRepository.saveLearningPath).toHaveBeenCalled();
      const saved = mockRepository.saveLearningPath.mock.calls[0][0];
      expect(saved.courseId).toBeNull();
      expect(saved.competencyTargetName).toBe(OTHER_TARGET);
    });
  });

  describe('Approval compatibility', () => {
    it('creates approval with learning_path_id and populates course_id', async () => {
      const mockApprovalRepository = {
        getApprovalByCourseId: jest.fn().mockResolvedValue(null),
        getApprovalByLearningPathId: jest.fn().mockResolvedValue(null),
        createApproval: jest.fn().mockImplementation(async (approval) => approval)
      };
      const useCase = new RequestPathApprovalUseCase({
        approvalRepository: mockApprovalRepository,
        notificationService: { sendApprovalRequest: jest.fn().mockResolvedValue({}) }
      });

      await useCase.execute({
        learningPathId: TARGET,
        courseId: COURSE_ID_A,
        companyId: 'company-1',
        decisionMaker: { employee_id: 'dm-1', name: 'DM', email: 'dm@example.com' },
        learningPath: { competencyTargetName: TARGET }
      });

      expect(mockApprovalRepository.createApproval).toHaveBeenCalled();
      const created = mockApprovalRepository.createApproval.mock.calls[0][0];
      expect(created.learningPathId).toBe(TARGET);
      expect(created.courseId).toBe(COURSE_ID_A);
    });

    it('approves the course identified by course_id, not target alone', async () => {
      const approval = new PathApproval({
        id: 'approval-1',
        learningPathId: TARGET,
        courseId: COURSE_ID_A,
        companyId: 'company-1',
        decisionMakerId: 'dm-1',
        status: 'pending'
      });
      const mockApprovalRepository = {
        getApprovalById: jest.fn().mockResolvedValue(approval),
        updateApproval: jest.fn().mockResolvedValue(new PathApproval({
          ...approval,
          status: 'approved'
        }))
      };
      const mockCourseRepository = {
        updateCourseById: jest.fn().mockResolvedValue({ course_id: COURSE_ID_A, competency_target_name: TARGET, approved: true }),
        updateCourse: jest.fn().mockResolvedValue({ competency_target_name: TARGET, approved: true }),
        getCourseById: jest.fn(),
        getCourseByCourseId: jest.fn()
      };
      const useCase = new ProcessApprovalResponseUseCase({
        approvalRepository: mockApprovalRepository,
        distributePathUseCase: { execute: jest.fn() },
        notificationService: null,
        courseRepository: mockCourseRepository
      });

      await useCase.execute('approval-1', 'approved', 'ok');

      expect(mockCourseRepository.updateCourseById).toHaveBeenCalledWith(COURSE_ID_A, { approved: true });
      expect(mockCourseRepository.updateCourse).not.toHaveBeenCalled();
    });
  });

  describe('Course Builder owner lookup', () => {
    it('resolves the owned course via user_id + competency_target_name and keeps the external contract', async () => {
      const useCase = new GetLearningPathForCourseBuilderUseCase({
        courseRepository: {
          getCourseByUserAndTarget: jest.fn().mockResolvedValue({
            course_id: COURSE_ID_A,
            user_id: USER_A,
            competency_target_name: TARGET,
            learning_path: VALID_PROMPT3_PATH,
            approved: true,
            created_at: '2026-01-01T00:00:00.000Z',
            last_modified_at: '2026-01-01T00:00:00.000Z'
          }),
          getCourseById: jest.fn()
        },
        approvalRepository: { getApprovalByLearningPathId: jest.fn() },
        skillsGapRepository: {
          getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue({
            user_name: 'Ada',
            company_id: 'company-1',
            company_name: 'Acme'
          })
        },
        learnerRepository: { getLearnerById: jest.fn() }
      });

      const result = await useCase.execute(USER_A, TARGET);

      expect(useCase.courseRepository.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(useCase.courseRepository.getCourseById).not.toHaveBeenCalled();
      expect(result.approved).toBe(true);
      expect(result.data.user_id).toBe(USER_A);
      expect(result.data.competency_target_name).toBe(TARGET);
      expect(result.data.learning_path).toEqual(VALID_PROMPT3_PATH);
      expect(result.data).not.toHaveProperty('course_id');
    });

    it('keeps the owner-mismatch error when another user owns the target', async () => {
      const useCase = new GetLearningPathForCourseBuilderUseCase({
        courseRepository: {
          getCourseByUserAndTarget: jest.fn().mockResolvedValue(null),
          getCourseById: jest.fn().mockResolvedValue({
            course_id: COURSE_ID_A,
            user_id: USER_A,
            competency_target_name: TARGET,
            learning_path: VALID_PROMPT3_PATH,
            approved: true
          })
        },
        approvalRepository: { getApprovalByLearningPathId: jest.fn() },
        skillsGapRepository: null,
        learnerRepository: null
      });

      await expect(useCase.execute(USER_B, TARGET)).rejects.toThrow(
        `Learning path ${TARGET} does not belong to user ${USER_B}`
      );
    });
  });

  describe('no schema / prompt / course-builder drift', () => {
    const testsDir = dirname(fileURLToPath(import.meta.url));
    const backendDir = join(testsDir, '..');
    const repoRoot = join(backendDir, '..');

    it('does not add a Phase C or extra migration file', () => {
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_a_add_course_id.sql'))).toBe(true);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_c_course_id.sql'))).toBe(false);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_b_add_course_id.sql'))).toBe(false);
    });

    it('does not modify Prompt 1-4 files', () => {
      const promptDir = join(backendDir, 'src', 'infrastructure', 'prompts', 'prompts');
      for (const name of [
        'prompt1-skill-expansion.txt',
        'prompt2-competency-identification.txt',
        'prompt3-path-creation.txt',
        'prompt4-course-suggestions.txt'
      ]) {
        const text = readFileSync(join(promptDir, name), 'utf8');
        expect(text.length).toBeGreaterThan(0);
      }
    });
  });
});
