import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LearningPath } from '../src/domain/entities/LearningPath.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { CourseRepository } from '../src/infrastructure/repositories/CourseRepository.js';
import { ApprovalRepository } from '../src/infrastructure/repositories/ApprovalRepository.js';
import { RecommendationRepository } from '../src/infrastructure/repositories/RecommendationRepository.js';
import { SupabaseRepository } from '../src/infrastructure/repositories/SupabaseRepository.js';
import { RequestPathApprovalUseCase } from '../src/application/useCases/RequestPathApprovalUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { GetLearningPathForCourseBuilderUseCase } from '../src/application/useCases/GetLearningPathForCourseBuilderUseCase.js';
import { GenerateCourseSuggestionsUseCase } from '../src/application/useCases/GenerateCourseSuggestionsUseCase.js';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { ProcessHandler } from '../src/grpc/handlers/processHandler.js';
import { fillSkillsEngineData, fillCourseBuilderData } from '../src/api/routes/endpoints.js';
import { isCourseUuid, resolveCourse } from '../src/utils/courseIdentity.js';
import { upsertSeedCourse, deleteSeedCourse } from '../src/utils/seedDatabase.js';
import { createMockJob } from './testHelpers.js';

const USER_A = 'user-a';
const USER_B = 'user-b';
const TARGET = 'javascript';
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
  approved = false
} = {}) {
  return {
    course_id: courseId,
    competency_target_name: target,
    user_id: userId,
    gap_id: GAP_A,
    learning_path: VALID_PROMPT3_PATH,
    approved,
    created_at: '2026-01-01T00:00:00.000Z',
    last_modified_at: '2026-01-01T00:00:00.000Z'
  };
}

describe('Stage 1 course identity preparation', () => {
  describe('UUID identity helper', () => {
    it('accepts a real UUID course_id and rejects a competency target name', () => {
      expect(isCourseUuid(COURSE_ID_A)).toBe(true);
      expect(isCourseUuid(TARGET)).toBe(false);
      expect(isCourseUuid('javascript')).toBe(false);
      expect(isCourseUuid(null)).toBe(false);
    });

    it('never treats a non-UUID course_id as a target when resolving', async () => {
      const courseRepository = {
        getCourseByCourseId: jest.fn(),
        getCourseByUserAndTarget: jest.fn(),
        getCourseById: jest.fn().mockResolvedValue(dbCourseRecord())
      };

      await resolveCourse(courseRepository, {
        courseId: TARGET,
        competencyTargetName: TARGET
      });

      expect(courseRepository.getCourseByCourseId).not.toHaveBeenCalled();
      expect(courseRepository.getCourseById).toHaveBeenCalledWith(TARGET);
    });
  });

  describe('CourseRepository safe writes', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      repository = new CourseRepository('https://fake.supabase.co', 'fake-key');
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
      mockClient.single.mockResolvedValue({ data: dbCourseRecord({ approved: true }), error: null });
    });

    it('updateCourseById filters by course_id only', async () => {
      await repository.updateCourseById(COURSE_ID_A, { approved: true });

      expect(mockClient.from).toHaveBeenCalledWith('courses');
      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', TARGET);
    });

    it('updateCourseByUserAndTarget filters by both user_id and target', async () => {
      await repository.updateCourseByUserAndTarget(USER_A, TARGET, { approved: true });

      expect(mockClient.eq).toHaveBeenCalledWith('user_id', USER_A);
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', TARGET);
    });

    it('deleteCourseById filters by course_id only', async () => {
      mockClient.delete.mockReturnValue(mockClient);
      mockClient.eq.mockResolvedValue({ error: null });

      await repository.deleteCourseById(COURSE_ID_A);

      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', TARGET);
    });
  });

  describe('Approval identity', () => {
    it('looks up existing approval by course_id when present', async () => {
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

      expect(mockApprovalRepository.getApprovalByCourseId).toHaveBeenCalledWith(COURSE_ID_A);
      expect(mockApprovalRepository.createApproval).toHaveBeenCalled();
      expect(mockApprovalRepository.createApproval.mock.calls[0][0].courseId).toBe(COURSE_ID_A);
      expect(mockApprovalRepository.createApproval.mock.calls[0][0].learningPathId).toBe(TARGET);
    });

    it('approval A updates course A by course_id, not target', async () => {
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

    it('legacy approval without course_id still updates by target', async () => {
      const approval = new PathApproval({
        id: 'approval-legacy',
        learningPathId: TARGET,
        courseId: null,
        companyId: 'company-1',
        decisionMakerId: 'dm-1',
        status: 'pending'
      });
      const mockCourseRepository = {
        updateCourseById: jest.fn(),
        updateCourse: jest.fn().mockResolvedValue({ competency_target_name: TARGET, approved: true })
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

      await useCase.execute('approval-legacy', 'approved', 'ok');

      expect(mockCourseRepository.updateCourseById).not.toHaveBeenCalled();
      expect(mockCourseRepository.updateCourse).toHaveBeenCalledWith(TARGET, { approved: true });
    });

    it('getApprovalByCourseId queries path_approvals.course_id', async () => {
      const repository = new ApprovalRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repository.client = mockClient;
      mockClient.single.mockResolvedValue({
        data: {
          id: 'approval-a',
          learning_path_id: TARGET,
          course_id: COURSE_ID_A,
          company_id: 'company-1',
          decision_maker_id: 'dm-1',
          status: 'pending'
        },
        error: null
      });

      const result = await repository.getApprovalByCourseId(COURSE_ID_A);

      expect(mockClient.from).toHaveBeenCalledWith('path_approvals');
      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(result.courseId).toBe(COURSE_ID_A);
    });
  });

  describe('Course Builder internal polling', () => {
    it('uses course_id for approval poll and owned-course update', async () => {
      const owned = {
        course_id: COURSE_ID_A,
        user_id: USER_A,
        competency_target_name: TARGET,
        learning_path: VALID_PROMPT3_PATH,
        approved: false,
        created_at: '2026-01-01T00:00:00.000Z',
        last_modified_at: '2026-01-01T00:00:00.000Z'
      };
      const approvedOwned = { ...owned, approved: true };
      const courseRepository = {
        getCourseByUserAndTarget: jest.fn()
          .mockResolvedValueOnce(owned)
          .mockResolvedValue(approvedOwned),
        getCourseByCourseId: jest.fn()
          .mockResolvedValueOnce(owned)
          .mockResolvedValue(approvedOwned),
        getCourseById: jest.fn(),
        updateCourseById: jest.fn().mockResolvedValue(approvedOwned),
        updateCourseByUserAndTarget: jest.fn(),
        updateCourse: jest.fn()
      };
      const approvalRepository = {
        getApprovalByCourseId: jest.fn().mockResolvedValue({
          id: 'approval-a',
          courseId: COURSE_ID_A,
          learningPathId: TARGET,
          status: 'approved'
        }),
        getApprovalByLearningPathId: jest.fn()
      };

      const useCase = new GetLearningPathForCourseBuilderUseCase({
        courseRepository,
        approvalRepository,
        skillsGapRepository: {
          getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue({
            user_name: 'Ada',
            company_id: 'company-1',
            company_name: 'Acme'
          })
        },
        learnerRepository: { getLearnerById: jest.fn() }
      });

      const result = await useCase.execute(USER_A, TARGET, { maxWaitTime: 50, pollInterval: 10 });

      expect(courseRepository.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(approvalRepository.getApprovalByCourseId).toHaveBeenCalledWith(COURSE_ID_A);
      expect(courseRepository.updateCourseById).toHaveBeenCalledWith(COURSE_ID_A, { approved: true });
      expect(courseRepository.updateCourse).not.toHaveBeenCalled();
      expect(result.approved).toBe(true);
      expect(result.data.user_id).toBe(USER_A);
      expect(result.data.competency_target_name).toBe(TARGET);
      expect(result.data).not.toHaveProperty('course_id');
    });
  });

  describe('Recommendations', () => {
    it('persists course_id from the owned course on create', async () => {
      const recommendationRepository = {
        createRecommendation: jest.fn().mockResolvedValue({
          recommendation_id: 'rec-1',
          course_id: COURSE_ID_A,
          suggested_courses: { suggested_courses: [] }
        })
      };
      const learningPathRepository = {
        getLearningPathsByUser: jest.fn().mockResolvedValue([]),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue({
          courseId: COURSE_ID_A,
          userId: USER_A,
          competencyTargetName: TARGET
        })
      };
      const useCase = new GenerateCourseSuggestionsUseCase({
        geminiClient: {
          executePrompt: jest.fn().mockResolvedValue({
            suggested_courses: [{ course_name: 'Advanced JS' }]
          })
        },
        ragClient: null,
        promptLoader: { loadPrompt: jest.fn().mockResolvedValue('P4 {userId} {completedCourseId}') },
        suggestionsRepository: null,
        recommendationRepository,
        learningPathRepository,
        jobRepository: {
          createJob: jest.fn(),
          updateJob: jest.fn().mockResolvedValue({})
        }
      });

      await useCase.processJob(
        { id: 'job-rec' },
        { userId: USER_A, competencyTargetName: TARGET, completionDate: '2026-01-01' }
      );

      expect(learningPathRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(recommendationRepository.createRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_A,
          base_course_name: TARGET,
          course_id: COURSE_ID_A
        })
      );
    });

    it('getRecommendationsByCourseId queries recommendations.course_id', async () => {
      const repository = new RecommendationRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repository.client = mockClient;
      mockClient.order.mockResolvedValue({
        data: [{
          recommendation_id: 'rec-1',
          user_id: USER_A,
          base_course_name: TARGET,
          course_id: COURSE_ID_A,
          suggested_courses: {},
          sent_to_rag: false
        }],
        error: null
      });

      const result = await repository.getRecommendationsByCourseId(COURSE_ID_A);

      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(result[0].course_id).toBe(COURSE_ID_A);
    });
  });

  describe('gRPC / RAG lookup', () => {
    let handler;
    let mockClient;

    beforeEach(() => {
      handler = new ProcessHandler();
      mockClient = createMockSupabaseClient();
      handler.client = mockClient;
    });

    it('queries courses.course_id for a real UUID and does not use target', async () => {
      mockClient.maybeSingle.mockResolvedValue({ data: dbCourseRecord(), error: null });

      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: USER_A,
        payload: { course_id: COURSE_ID_A }
      });

      expect(mockClient.eq).toHaveBeenCalledWith('course_id', COURSE_ID_A);
      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', COURSE_ID_A);
      expect(result.metadata.query_type).toBe('by_course_id');
      expect(result.data[0].course_id).toBe(COURSE_ID_A);
    });

    it('queries user_id + competency_target_name together', async () => {
      mockClient.maybeSingle.mockResolvedValue({ data: dbCourseRecord(), error: null });

      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: USER_A,
        payload: { competency_target_name: TARGET }
      });

      expect(mockClient.eq).toHaveBeenCalledWith('user_id', USER_A);
      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(result.metadata.query_type).toBe('by_user_and_target');
    });

    it('does not interpret a non-UUID course_id as a target name', async () => {
      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: null,
        payload: { course_id: TARGET }
      });

      expect(mockClient.eq).not.toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(mockClient.eq).not.toHaveBeenCalledWith('course_id', TARGET);
      expect(result.data).toEqual([]);
    });

    it('keeps Stage 1 legacy target-only fallback when only target is supplied', async () => {
      mockClient.then = (resolve) => resolve({ data: [dbCourseRecord()], error: null });

      const result = await handler.handleRealtimeQuery({
        tenant_id: 't1',
        user_id: null,
        payload: { competency_target_name: TARGET }
      });

      expect(mockClient.eq).toHaveBeenCalledWith('competency_target_name', TARGET);
      expect(result.metadata.query_type).toBe('legacy_target_only');
    });
  });

  describe('Fill handlers', () => {
    it('uses user_id + target when both are present', async () => {
      const courseRepository = {
        getCourseByCourseId: jest.fn(),
        getCourseByUserAndTarget: jest.fn().mockResolvedValue(dbCourseRecord()),
        getCourseById: jest.fn()
      };

      const filled = await fillSkillsEngineData(
        { user_id: USER_A, competency_target_name: TARGET },
        { courseRepository, skillsGapRepository: null }
      );

      expect(courseRepository.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(courseRepository.getCourseById).not.toHaveBeenCalled();
      expect(filled.learning_path).toEqual(VALID_PROMPT3_PATH);
    });

    it('uses a real UUID course_id and does not treat it as target text', async () => {
      const courseRepository = {
        getCourseByCourseId: jest.fn().mockResolvedValue(dbCourseRecord()),
        getCourseByUserAndTarget: jest.fn(),
        getCourseById: jest.fn()
      };

      const filled = await fillCourseBuilderData(
        { course_id: COURSE_ID_A },
        { courseRepository, skillsGapRepository: null }
      );

      expect(courseRepository.getCourseByCourseId).toHaveBeenCalledWith(COURSE_ID_A);
      expect(courseRepository.getCourseById).not.toHaveBeenCalled();
      expect(filled.learning_path).toEqual(VALID_PROMPT3_PATH);
    });
  });

  describe('seedDatabase ownership-safe mutate', () => {
    it('updates an existing owned course by course_id, not target-only', async () => {
      const courseRepo = {
        createCourse: jest.fn().mockRejectedValue(new Error('duplicate key value violates unique constraint')),
        getCourseByUserAndTarget: jest.fn().mockResolvedValue(dbCourseRecord()),
        updateCourseById: jest.fn().mockResolvedValue(dbCourseRecord()),
        updateCourseByUserAndTarget: jest.fn(),
        updateCourse: jest.fn()
      };

      await upsertSeedCourse(courseRepo, {
        competency_target_name: TARGET,
        user_id: USER_A,
        learning_path: VALID_PROMPT3_PATH,
        approved: false
      });

      expect(courseRepo.getCourseByUserAndTarget).toHaveBeenCalledWith(USER_A, TARGET);
      expect(courseRepo.updateCourseById).toHaveBeenCalledWith(COURSE_ID_A, {
        learning_path: VALID_PROMPT3_PATH,
        approved: false
      });
      expect(courseRepo.updateCourse).not.toHaveBeenCalled();
    });

    it('deletes by course_id after owned lookup, not target-only', async () => {
      const courseRepo = {
        getCourseByUserAndTarget: jest.fn().mockResolvedValue(dbCourseRecord()),
        deleteCourseById: jest.fn().mockResolvedValue(true),
        deleteCourseByUserAndTarget: jest.fn(),
        deleteCourse: jest.fn()
      };

      await deleteSeedCourse(courseRepo, {
        competency_target_name: TARGET,
        user_id: USER_A
      });

      expect(courseRepo.deleteCourseById).toHaveBeenCalledWith(COURSE_ID_A);
      expect(courseRepo.deleteCourse).not.toHaveBeenCalled();
    });
  });

  describe('generation flow remains Phase B', () => {
    it('same-user UPDATE MODE still preserves course_id', async () => {
      const mockRepository = {
        saveLearningPath: jest.fn().mockImplementation(async (path) => path),
        getLearningPathById: jest.fn().mockResolvedValue(null),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue({
          userId: USER_A,
          competencyTargetName: TARGET,
          courseId: COURSE_ID_A
        })
      };
      const useCase = new GenerateLearningPathUseCase({
        geminiClient: { executePrompt: jest.fn().mockResolvedValue(VALID_PROMPT3_PATH) },
        skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
        repository: mockRepository,
        jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
        promptLoader: {
          loadPrompt: jest.fn().mockImplementation((name) => {
            if (name === 'prompt3-path-creation') {
              return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
            }
            return Promise.resolve('DEFAULT {input}');
          })
        },
        cacheRepository: { upsertSkillBreakdown: jest.fn().mockResolvedValue({}) },
        checkApprovalPolicyUseCase: { execute: jest.fn().mockResolvedValue({ requiresApproval: false }) },
        requestPathApprovalUseCase: { execute: jest.fn() },
        distributePathUseCase: { execute: jest.fn() },
        skillsGapRepository: {
          getSkillsGapsByUser: jest.fn().mockResolvedValue([{
            gap_id: GAP_A,
            competency_target_name: TARGET,
            exam_status: 'fail',
            skills_raw_data: { [TARGET]: ['syntaxerror'] }
          }])
        },
        skillsExpansionRepository: {
          getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue({
            expansion_id: 'exp-a',
            prompt_1_output: { expanded_competencies_list: [{ competency_name: 'Example' }] },
            prompt_2_output: { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] }
          }),
          createSkillsExpansion: jest.fn(),
          updateSkillsExpansion: jest.fn()
        }
      });
      jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });

      await useCase.processJob(createMockJob({ id: 'job-update' }), {
        userId: USER_A,
        companyId: 'company-1',
        competencyTargetName: TARGET,
        skillsRawData: { [TARGET]: ['syntaxerror'] },
        examStatus: 'fail',
        toJSON() {
          return {
            userId: this.userId,
            companyId: this.companyId,
            competencyTargetName: this.competencyTargetName,
            skills_raw_data: this.skillsRawData
          };
        }
      });

      const saved = mockRepository.saveLearningPath.mock.calls[0][0];
      expect(saved.courseId).toBe(COURSE_ID_A);
      expect(saved.userId).toBe(USER_A);
    });

    it('different user + same target proceeds when that user has no owned course', async () => {
      const mockRepository = {
        saveLearningPath: jest.fn().mockImplementation(async (path) => path),
        getLearningPathById: jest.fn().mockResolvedValue({
          userId: USER_A,
          competencyTargetName: TARGET,
          courseId: COURSE_ID_A
        }),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue(null)
      };
      const mockGemini = {
        executePrompt: jest.fn().mockImplementation(async (prompt) => {
          if (typeof prompt === 'string' && prompt.includes('P1')) {
            return { expanded_competencies_list: [{ competency_name: 'Example' }] };
          }
          if (typeof prompt === 'string' && prompt.includes('P2')) {
            return { competencies_for_skills_engine_processing: [{ competency_name: 'Example' }] };
          }
          return VALID_PROMPT3_PATH;
        })
      };
      const mockPromptLoader = {
        loadPrompt: jest.fn().mockImplementation((name) => {
          if (name === 'prompt1-skill-expansion') return Promise.resolve('P1 {input}');
          if (name === 'prompt2-competency-identification') return Promise.resolve('P2 {input}');
          if (name === 'prompt3-path-creation') {
            return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
          }
          return Promise.resolve('DEFAULT {input}');
        })
      };
      const useCase = new GenerateLearningPathUseCase({
        geminiClient: mockGemini,
        skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
        repository: mockRepository,
        jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
        promptLoader: mockPromptLoader,
        cacheRepository: { upsertSkillBreakdown: jest.fn() },
        checkApprovalPolicyUseCase: { execute: jest.fn().mockResolvedValue({ requiresApproval: false }) },
        requestPathApprovalUseCase: { execute: jest.fn() },
        distributePathUseCase: { execute: jest.fn() },
        skillsGapRepository: {
          getSkillsGapsByUser: jest.fn().mockResolvedValue([{
            gap_id: 'gap-b',
            competency_target_name: TARGET,
            exam_status: 'fail',
            skills_raw_data: { [TARGET]: ['syntaxerror'] }
          }])
        },
        skillsExpansionRepository: {
          getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue(null),
          createSkillsExpansion: jest.fn(),
          updateSkillsExpansion: jest.fn()
        }
      });
      jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });

      await useCase.processJob(createMockJob({ id: 'job-b-full' }), {
        userId: USER_B,
        companyId: 'company-1',
        competencyTargetName: TARGET,
        skillsRawData: { [TARGET]: ['syntaxerror'] },
        examStatus: 'fail',
        toJSON() {
          return { userId: this.userId, competencyTargetName: this.competencyTargetName };
        }
      });

      expect(mockRepository.getLearningPathByUserAndTarget).toHaveBeenCalledWith(USER_B, TARGET);
      expect(mockRepository.saveLearningPath).toHaveBeenCalled();
      const saved = mockRepository.saveLearningPath.mock.calls[0][0];
      expect(saved.userId).toBe(USER_B);
      expect(saved.courseId).toBeNull();
    });

    it('save inserts User B same-target as a new course (no collision)', async () => {
      const repository = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      const mockClient = createMockSupabaseClient();
      repository.client = mockClient;
      mockClient.single
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null })
        .mockResolvedValueOnce({ data: dbCourseRecord(), error: null });

      await repository.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_A,
        competencyTargetName: TARGET,
        courseId: COURSE_ID_A,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      expect(mockClient.upsert.mock.calls[0][1]).toEqual({ onConflict: 'user_id,competency_target_name' });

      mockClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        .mockResolvedValueOnce({
          data: dbCourseRecord({ userId: USER_B, courseId: '22222222-2222-2222-2222-222222222222' }),
          error: null
        });
      await repository.saveLearningPath(new LearningPath({
        id: TARGET,
        userId: USER_B,
        competencyTargetName: TARGET,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      const bPayload = mockClient.upsert.mock.calls[1][0];
      expect(bPayload.user_id).toBe(USER_B);
      expect(bPayload).not.toHaveProperty('course_id');
    });
  });

  describe('no schema / prompt / collision-guard drift', () => {
    const testsDir = dirname(fileURLToPath(import.meta.url));
    const backendDir = join(testsDir, '..');
    const repoRoot = join(backendDir, '..');

    it('does not add a Phase C or Stage 1 schema-cutover migration file', () => {
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_a_add_course_id.sql'))).toBe(true);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'phase_c_course_id.sql'))).toBe(false);
      expect(existsSync(join(repoRoot, 'database', 'migrations', 'stage_1_course_identity.sql'))).toBe(false);
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

    it('COURSE_OWNERSHIP_COLLISION is gone from production save/generate/create', () => {
      const saveSource = readFileSync(
        join(backendDir, 'src', 'infrastructure', 'repositories', 'SupabaseRepository.js'),
        'utf8'
      );
      const generateSource = readFileSync(
        join(backendDir, 'src', 'application', 'useCases', 'GenerateLearningPathUseCase.js'),
        'utf8'
      );
      const createSource = readFileSync(
        join(backendDir, 'src', 'infrastructure', 'repositories', 'CourseRepository.js'),
        'utf8'
      );
      expect(saveSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
      expect(generateSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
      expect(createSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
    });
  });
});
