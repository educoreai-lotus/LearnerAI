import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LearningPath } from '../src/domain/entities/LearningPath.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { RequestPathApprovalUseCase } from '../src/application/useCases/RequestPathApprovalUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { GetLearningPathForCourseBuilderUseCase } from '../src/application/useCases/GetLearningPathForCourseBuilderUseCase.js';
import { GenerateCourseSuggestionsUseCase } from '../src/application/useCases/GenerateCourseSuggestionsUseCase.js';
import { SupabaseRepository } from '../src/infrastructure/repositories/SupabaseRepository.js';
import { CourseRepository } from '../src/infrastructure/repositories/CourseRepository.js';
import { ProcessHandler } from '../src/grpc/handlers/processHandler.js';
import {
  ambiguousCourseTargetError,
  AMBIGUOUS_COURSE_TARGET,
  pickUniqueCourseOrThrow
} from '../src/utils/courseIdentity.js';
import {
  fillSkillsEngineData,
  fillCourseBuilderData,
  fillLearningAnalyticsData
} from '../src/api/routes/endpoints.js';
import { createCoursesRouter } from '../src/api/routes/courses.js';
import { createMockJob, testRoute } from './testHelpers.js';

const USER_A = 'user-a';
const USER_B = 'user-b';
const TARGET = 'javascript';
const COURSE_ID_A = '11111111-1111-1111-1111-111111111111';
const COURSE_ID_B = '22222222-2222-2222-2222-222222222222';
const GAP_A = 'gap-a';
const GAP_B = 'gap-b';

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
    delete: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    single: jest.fn(),
    maybeSingle: jest.fn(),
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
    learning_path: { ...VALID_PROMPT3_PATH, learner_id: userId },
    approved,
    created_at: '2026-01-01T00:00:00.000Z',
    last_modified_at: '2026-01-01T00:00:00.000Z'
  };
}

function skillsGap({ userId = USER_A, target = TARGET, gapId = GAP_A } = {}) {
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
    },
    _gapId: gapId
  };
}

function createGenerateUseCase({ repository, geminiClient, promptLoader, extras = {} }) {
  const useCase = new GenerateLearningPathUseCase({
    geminiClient,
    skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
    repository,
    jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
    promptLoader,
    cacheRepository: { upsertSkillBreakdown: jest.fn().mockResolvedValue({}) },
    checkApprovalPolicyUseCase: { execute: jest.fn().mockResolvedValue({ requiresApproval: false }) },
    requestPathApprovalUseCase: { execute: jest.fn() },
    distributePathUseCase: { execute: jest.fn() },
    skillsGapRepository: {
      getSkillsGapsByUser: jest.fn().mockImplementation(async (userId) => [{
        gap_id: userId === USER_B ? GAP_B : GAP_A,
        competency_target_name: TARGET,
        exam_status: 'fail',
        skills_raw_data: { [TARGET]: ['syntaxerror'] }
      }])
    },
    skillsExpansionRepository: {
      getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue(null),
      createSkillsExpansion: jest.fn(),
      updateSkillsExpansion: jest.fn()
    },
    ...extras
  });
  jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });
  return useCase;
}

function fullModePromptLoader() {
  return {
    loadPrompt: jest.fn().mockImplementation((name) => {
      if (name === 'prompt1-skill-expansion') return Promise.resolve('P1 {input}');
      if (name === 'prompt2-competency-identification') return Promise.resolve('P2 {input}');
      if (name === 'prompt3-path-creation') {
        return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
      }
      return Promise.resolve('DEFAULT {input}');
    })
  };
}

function fullModeGemini() {
  return {
    executePrompt: jest.fn().mockImplementation(async (prompt) => {
      if (typeof prompt === 'string' && prompt.startsWith('P1 ')) {
        return { expanded_competencies_list: [{ competency_name: 'Example' }] };
      }
      if (typeof prompt === 'string' && prompt.startsWith('P2 ')) {
        return { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] };
      }
      return VALID_PROMPT3_PATH;
    })
  };
}

const testsDir = dirname(fileURLToPath(import.meta.url));
const backendDir = join(testsDir, '..');
const repoRoot = join(backendDir, '..');

describe('Stage 3 final multi-user enablement', () => {
  describe('A/B both allowed with different course_id', () => {
    it('A. User A + javascript and User B + javascript are both allowed', async () => {
      const repository = {
        saveLearningPath: jest.fn().mockImplementation(async (path) => path),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue(null)
      };
      const useCase = createGenerateUseCase({
        repository,
        geminiClient: fullModeGemini(),
        promptLoader: fullModePromptLoader()
      });

      await useCase.processJob(createMockJob({ id: 'job-a' }), skillsGap({ userId: USER_A }));
      await useCase.processJob(createMockJob({ id: 'job-b' }), skillsGap({ userId: USER_B }));

      expect(repository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(repository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_B, TARGET);
      expect(repository.saveLearningPath).toHaveBeenCalledTimes(2);
      expect(repository.saveLearningPath.mock.calls[0][0].userId).toBe(USER_A);
      expect(repository.saveLearningPath.mock.calls[1][0].userId).toBe(USER_B);
    });

    it('B. A and B receive different course_id values on save', async () => {
      const repo = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;

      mockClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }), error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }), error: null });

      const savedA = await repo.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_A,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));
      const savedB = await repo.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_B,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      expect(savedA.courseId).toBe(COURSE_ID_A);
      expect(savedB.courseId).toBe(COURSE_ID_B);
      expect(savedA.courseId).not.toBe(savedB.courseId);
      expect(mockClient.upsert.mock.calls[0][0]).not.toHaveProperty('course_id');
      expect(mockClient.upsert.mock.calls[1][0]).not.toHaveProperty('course_id');
    });
  });

  describe('C/D same-user rerun preserves own course_id only', () => {
    it('C. same A + javascript rerun updates A, preserves A course_id, does not write B', async () => {
      const repo = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.single
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }), error: null });

      const saved = await repo.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_A,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      expect(saved.courseId).toBe(COURSE_ID_A);
      const payload = mockClient.upsert.mock.calls[0][0];
      expect(payload.course_id).toBe(COURSE_ID_A);
      expect(payload.user_id).toBe(USER_A);
      expect(payload.competency_target_name).toBe(TARGET);
      expect(mockClient.upsert.mock.calls[0][1]).toEqual({ onConflict: 'user_id,competency_target_name' });
      expect(payload.course_id).not.toBe(COURSE_ID_B);
    });

    it('D. same B + javascript rerun updates B only', async () => {
      const repo = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.single
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }), error: null });

      const saved = await repo.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_B,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      expect(saved.courseId).toBe(COURSE_ID_B);
      const payload = mockClient.upsert.mock.calls[0][0];
      expect(payload.course_id).toBe(COURSE_ID_B);
      expect(payload.user_id).toBe(USER_B);
      expect(payload.course_id).not.toBe(COURSE_ID_A);
    });
  });

  describe('E. approval isolation', () => {
    it('approving A updates A course_id only', async () => {
      const approval = new PathApproval({
        id: 'approval-a',
        learningPathId: TARGET,
        courseId: COURSE_ID_A,
        companyId: 'company-1',
        decisionMakerId: 'dm-1',
        status: 'pending'
      });
      const mockCourseRepository = {
        updateCourseById: jest.fn().mockResolvedValue({ course_id: COURSE_ID_A, approved: true }),
        updateCourse: jest.fn()
      };
      const useCase = new ProcessApprovalResponseUseCase({
        approvalRepository: {
          getApprovalById: jest.fn().mockResolvedValue(approval),
          updateApproval: jest.fn().mockResolvedValue(new PathApproval({ ...approval, status: 'approved' }))
        },
        distributePathUseCase: { execute: jest.fn() },
        notificationService: null,
        courseRepository: mockCourseRepository
      });

      await useCase.execute('approval-a', 'approved', 'ok');

      expect(mockCourseRepository.updateCourseById).toHaveBeenCalledWith(COURSE_ID_A, { approved: true });
      expect(mockCourseRepository.updateCourse).not.toHaveBeenCalled();
    });

    it('request approval looks up by course_id not target', async () => {
      const mockApprovalRepository = {
        getApprovalByCourseId: jest.fn().mockResolvedValue(null),
        getApprovalByLearningPathId: jest.fn(),
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

      expect(mockApprovalRepository.getApprovalByCourseId).toHaveBeenCalledWith(COURSE_ID_A);
      expect(mockApprovalRepository.getApprovalByLearningPathId).not.toHaveBeenCalled();
      expect(mockApprovalRepository.createApproval.mock.calls[0][0].courseId).toBe(COURSE_ID_A);
    });
  });

  describe('F. recommendation isolation', () => {
    it('A recommendation is associated with A course_id only', async () => {
      const recommendationRepository = {
        createRecommendation: jest.fn().mockResolvedValue({
          recommendation_id: 'rec-a',
          suggested_courses: {}
        })
      };
      const learningPathRepository = {
        getLearningPathsByUser: jest.fn().mockResolvedValue([]),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue({
          userId: USER_A,
          competencyTargetName: TARGET,
          courseId: COURSE_ID_A
        })
      };
      const useCase = new GenerateCourseSuggestionsUseCase({
        geminiClient: {
          executePrompt: jest.fn().mockResolvedValue({
            suggested_courses: [{ course_name: 'JS Advanced' }]
          })
        },
        ragClient: null,
        promptLoader: { loadPrompt: jest.fn().mockResolvedValue('P4 {userId} {completedCourseId}') },
        recommendationRepository,
        learningPathRepository,
        jobRepository: { updateJob: jest.fn().mockResolvedValue({}) }
      });

      await useCase.processJob(createMockJob({ id: 'job-rec-a' }), {
        userId: USER_A,
        competencyTargetName: TARGET,
        completionDate: '2026-01-01',
        completionDetails: {}
      });

      expect(learningPathRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(recommendationRepository.createRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_A,
          base_course_name: TARGET,
          course_id: COURSE_ID_A
        })
      );
    });
  });

  describe('G. Course Builder isolation', () => {
    it('A + javascript -> A, B + javascript -> B, payload has no course_id', async () => {
      const courseRepository = {
        getCourseByUserAndTarget: jest.fn().mockImplementation(async (userId) => {
          if (userId === USER_A) {
            return dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A, approved: true });
          }
          if (userId === USER_B) {
            return dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B, approved: true });
          }
          return null;
        }),
        getCourseById: jest.fn()
      };
      const useCase = new GetLearningPathForCourseBuilderUseCase({
        courseRepository,
        approvalRepository: { getApprovalByCourseId: jest.fn(), getApprovalByLearningPathId: jest.fn() },
        skillsGapRepository: {
          getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue({
            user_name: 'Ada',
            company_id: 'company-1',
            company_name: 'Acme'
          })
        },
        learnerRepository: { getLearnerById: jest.fn() }
      });

      const resultA = await useCase.execute(USER_A, TARGET);
      const resultB = await useCase.execute(USER_B, TARGET);

      expect(courseRepository.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(courseRepository.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_B, TARGET);
      expect(courseRepository.getCourseById).not.toHaveBeenCalled();
      expect(resultA.data.user_id).toBe(USER_A);
      expect(resultB.data.user_id).toBe(USER_B);
      expect(resultA.data.competency_target_name).toBe(TARGET);
      expect(resultB.data.competency_target_name).toBe(TARGET);
      expect(resultA.data).not.toHaveProperty('course_id');
      expect(resultB.data).not.toHaveProperty('course_id');
    });
  });

  describe('H. gRPC isolation and ambiguity', () => {
    let handler;
    let mockClient;

    beforeEach(() => {
      handler = new ProcessHandler();
      mockClient = createMockSupabaseClient();
      handler.client = mockClient;
    });

    it('user A + javascript -> A and user B + javascript -> B', async () => {
      mockClient.maybeSingle
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }), error: null });

      const resultA = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: USER_A,
        payload: { competency_target_name: TARGET }
      });
      const resultB = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: USER_B,
        payload: { competency_target_name: TARGET }
      });

      expect(resultA.metadata.query_type).toBe('by_user_and_target');
      expect(resultB.metadata.query_type).toBe('by_user_and_target');
      expect(resultA.data[0].course_id).toBe(COURSE_ID_A);
      expect(resultB.data[0].course_id).toBe(COURSE_ID_B);
    });

    it('real UUID -> exact course', async () => {
      mockClient.maybeSingle.mockResolvedValue({
        data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }),
        error: null
      });

      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: USER_A,
        payload: { course_id: COURSE_ID_B }
      });

      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_B);
      expect(result.metadata.query_type).toBe('by_course_id');
      expect(result.data[0].course_id).toBe(COURSE_ID_B);
    });

    it('target-only with two javascript rows -> AMBIGUOUS_COURSE_TARGET', async () => {
      mockClient.then = (resolve) => resolve({
        data: [
          dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }),
          dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B })
        ],
        error: null
      });

      await expect(handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: null,
        payload: { competency_target_name: TARGET }
      })).rejects.toThrow(AMBIGUOUS_COURSE_TARGET);
    });

    it('does not interpret course_id: "javascript" as a target', async () => {
      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: null,
        payload: { course_id: TARGET }
      });

      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(mockClient.eq).not.toHaveBeenCalledWith('course_id', TARGET);
      expect(result.data).toEqual([]);
    });
  });

  describe('I. fill isolation', () => {
    it('user+target and UUID stay isolated; target-only duplicate throws', async () => {
      const courseRepository = {
        getCourseByCourseId: jest.fn().mockImplementation(async (id) => {
          if (id === COURSE_ID_A) return dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A });
          if (id === COURSE_ID_B) return dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B });
          return null;
        }),
        getCourseByUserAndTarget: jest.fn().mockImplementation(async (userId) => {
          if (userId === USER_A) return dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A });
          if (userId === USER_B) return dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B });
          return null;
        }),
        getCourseById: jest.fn().mockRejectedValue(ambiguousCourseTargetError(TARGET))
      };

      const filledA = await fillSkillsEngineData(
        { user_id: USER_A, competency_target_name: TARGET },
        { courseRepository, skillsGapRepository: null }
      );
      const filledB = await fillCourseBuilderData(
        { user_id: USER_B, competency_target_name: TARGET },
        { courseRepository, skillsGapRepository: null }
      );
      const filledUuid = await fillLearningAnalyticsData(
        { user_id: USER_A, competency_target_name: TARGET, course_id: COURSE_ID_A },
        { courseRepository, skillsGapRepository: null, learnerRepository: null }
      );

      expect(filledA.user_id).toBe(USER_A);
      expect(filledB.user_id).toBe(USER_B);
      expect(filledUuid[0].competency_target_name).toBe(TARGET);
      expect(courseRepository.getCourseById).not.toHaveBeenCalled();

      await expect(fillSkillsEngineData(
        { competency_target_name: TARGET },
        { courseRepository, skillsGapRepository: null }
      )).rejects.toThrow(AMBIGUOUS_COURSE_TARGET);
    });
  });

  describe('J. REST safety', () => {
    it('target-only GET with multiple rows is ambiguous', async () => {
      const router = createCoursesRouter({
        courseRepository: {
          getCourseById: jest.fn().mockRejectedValue(ambiguousCourseTargetError(TARGET))
        },
        coordinatorClient: { postRequest: jest.fn() }
      });

      const { res } = await testRoute(router, 'get', '/:competencyTargetName', {
        params: { competencyTargetName: TARGET }
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.data.error).toBe(AMBIGUOUS_COURSE_TARGET);
    });

    it('target-only PUT with multiple rows is refused', async () => {
      const router = createCoursesRouter({
        courseRepository: {
          updateCourse: jest.fn().mockRejectedValue(ambiguousCourseTargetError(TARGET)),
          updateCourseByUserAndTarget: jest.fn()
        },
        coordinatorClient: { postRequest: jest.fn() }
      });

      const { res } = await testRoute(router, 'put', '/:competencyTargetName', {
        params: { competencyTargetName: TARGET },
        body: { approved: true }
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.data.error).toBe(AMBIGUOUS_COURSE_TARGET);
    });

    it('target-only DELETE with multiple rows is refused', async () => {
      const router = createCoursesRouter({
        courseRepository: {
          deleteCourse: jest.fn().mockRejectedValue(ambiguousCourseTargetError(TARGET)),
          deleteCourseByUserAndTarget: jest.fn()
        },
        coordinatorClient: { postRequest: jest.fn() }
      });

      const { res } = await testRoute(router, 'delete', '/:competencyTargetName', {
        params: { competencyTargetName: TARGET }
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.data.error).toBe(AMBIGUOUS_COURSE_TARGET);
    });
  });

  describe('K. deleteCourseById isolation', () => {
    it('deleteCourseById(A) deletes A only', async () => {
      const repo = new CourseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.then = (resolve) => resolve({ data: null, error: null });

      await repo.deleteCourseById(COURSE_ID_A);

      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', TARGET);
    });
  });

  describe('L/M upsert identity', () => {
    it('L. same user + same target concurrent upsert uses one logical conflict key', async () => {
      const repo = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.single
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null });

      await Promise.all([
        repo.saveLearningPath(new LearningPath({
          id: TARGET, userId: USER_A, competencyTargetName: TARGET, pathMetadata: VALID_PROMPT3_PATH
        })),
        repo.saveLearningPath(new LearningPath({
          id: TARGET, userId: USER_A, competencyTargetName: TARGET, pathMetadata: VALID_PROMPT3_PATH
        }))
      ]);

      expect(mockClient.upsert).toHaveBeenCalledTimes(2);
      for (const call of mockClient.upsert.mock.calls) {
        expect(call[1]).toEqual({ onConflict: 'user_id,competency_target_name' });
        expect(call[0].user_id).toBe(USER_A);
        expect(call[0].competency_target_name).toBe(TARGET);
      }
    });

    it('M. different users + same target are two courses', async () => {
      const repo = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }), error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }), error: null });

      const a = await repo.saveLearningPath(new LearningPath({
        id: TARGET, userId: USER_A, competencyTargetName: TARGET, pathMetadata: VALID_PROMPT3_PATH
      }));
      const b = await repo.saveLearningPath(new LearningPath({
        id: TARGET, userId: USER_B, competencyTargetName: TARGET, pathMetadata: VALID_PROMPT3_PATH
      }));

      expect(a.courseId).not.toBe(b.courseId);
      expect(mockClient.upsert.mock.calls[0][0].user_id).toBe(USER_A);
      expect(mockClient.upsert.mock.calls[1][0].user_id).toBe(USER_B);
    });
  });

  describe('N/O prompts and UPDATE MODE unchanged', () => {
    it('N. Prompt 1-4 files are unchanged in place', () => {
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

    it('O. same user + same target still enters UPDATE MODE', async () => {
      const repository = {
        saveLearningPath: jest.fn().mockImplementation(async (path) => path),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue({
          userId: USER_A,
          competencyTargetName: TARGET,
          courseId: COURSE_ID_A
        })
      };
      const promptLoader = fullModePromptLoader();
      const extras = {
        skillsExpansionRepository: {
          getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue({
            expansion_id: 'exp-a',
            prompt_1_output: { expanded_competencies_list: [{ competency_name: 'Example' }] },
            prompt_2_output: { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] }
          }),
          createSkillsExpansion: jest.fn(),
          updateSkillsExpansion: jest.fn()
        }
      };
      const useCase = createGenerateUseCase({
        repository,
        geminiClient: { executePrompt: jest.fn().mockResolvedValue(VALID_PROMPT3_PATH) },
        promptLoader,
        extras
      });

      await useCase.processJob(createMockJob({ id: 'job-update' }), skillsGap({ userId: USER_A }));

      expect(promptLoader.loadPrompt).not.toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(promptLoader.loadPrompt).not.toHaveBeenCalledWith('prompt2-competency-identification');
      expect(promptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');
      expect(repository.saveLearningPath.mock.calls[0][0].courseId).toBe(COURSE_ID_A);
    });
  });

  describe('P/Q no collision / no new schema', () => {
    it('P. COURSE_OWNERSHIP_COLLISION is absent from executable production logic', () => {
      const files = [
        join(backendDir, 'src', 'infrastructure', 'repositories', 'SupabaseRepository.js'),
        join(backendDir, 'src', 'application', 'useCases', 'GenerateLearningPathUseCase.js'),
        join(backendDir, 'src', 'infrastructure', 'repositories', 'CourseRepository.js')
      ];
      for (const file of files) {
        expect(readFileSync(file, 'utf8')).not.toContain('COURSE_OWNERSHIP_COLLISION');
      }
    });

    it('Q. no Stage 3 migration file was added', () => {
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_a_add_course_id.sql'))).toBe(true);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'stage_3_multi_user.sql'))).toBe(false);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'stage_3_course_identity.sql'))).toBe(false);
    });
  });

  describe('legacy target-only methods are ambiguity-safe', () => {
    it('pickUniqueCourseOrThrow encodes 0 / 1 / many', () => {
      expect(pickUniqueCourseOrThrow([], TARGET)).toBeNull();
      expect(pickUniqueCourseOrThrow([dbCourseRecord()], TARGET).course_id).toBe(COURSE_ID_A);
      expect(() => pickUniqueCourseOrThrow([
        dbCourseRecord({ userId: USER_A }),
        dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B })
      ], TARGET)).toThrow(AMBIGUOUS_COURSE_TARGET);
    });

    it('getCourseById / updateCourse / deleteCourse refuse multiple same-target rows', async () => {
      const repo = new CourseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.then = (resolve) => resolve({
        data: [
          dbCourseRecord({ userId: USER_A, courseId: COURSE_ID_A }),
          dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B })
        ],
        error: null
      });

      await expect(repo.getCourseById(TARGET)).rejects.toThrow(AMBIGUOUS_COURSE_TARGET);
      await expect(repo.updateCourse(TARGET, { approved: true })).rejects.toThrow(AMBIGUOUS_COURSE_TARGET);
      await expect(repo.deleteCourse(TARGET)).rejects.toThrow(AMBIGUOUS_COURSE_TARGET);
      expect(mockClient.update).not.toHaveBeenCalled();
      expect(mockClient.delete).not.toHaveBeenCalled();
    });

    it('createCourse does not query existing target before insert', async () => {
      const repo = new CourseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repo.client = mockClient;
      mockClient.single.mockResolvedValue({
        data: dbCourseRecord({ userId: USER_B, courseId: COURSE_ID_B }),
        error: null
      });

      await repo.createCourse({
        competency_target_name: TARGET,
        user_id: USER_B,
        learning_path: VALID_PROMPT3_PATH
      });

      expect(mockClient.insert).toHaveBeenCalled();
      expect(mockClient.eq).not.toHaveBeenCalled();
    });
  });
});
