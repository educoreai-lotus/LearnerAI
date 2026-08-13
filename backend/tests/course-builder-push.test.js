import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { createMockJob } from './testHelpers.js';

const USER_ID = 'b2b400ed-bc11-4aa9-a89e-f4a00d0f6321';
const COMPANY_ID = 'c3c511fe-cd22-5bb0-b90f-a5b11e1g7432';
const COURSE_ID = '11111111-1111-1111-1111-111111111111';
const TARGET = 'javascript';

const VALID_PROMPT3_PATH = {
  path_title: 'JavaScript Path',
  learner_id: USER_ID,
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

const PERSISTED_GAP = {
  gap_id: 'gap-123',
  user_id: USER_ID,
  company_id: COMPANY_ID,
  company_name: 'Acme Corp',
  user_name: 'Ada Lovelace',
  competency_target_name: TARGET,
  exam_status: 'fail',
  preferred_language: 'en',
  skills_raw_data: { [TARGET]: ['syntaxerror', 'throw statement'] }
};

function thinSkillsGap() {
  return {
    userId: USER_ID,
    companyId: COMPANY_ID,
    competencyTargetName: TARGET,
    toJSON() {
      return {
        userId: this.userId,
        companyId: this.companyId,
        competencyTargetName: this.competencyTargetName
      };
    }
  };
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

function createCoordinatorClient({ reject = false } = {}) {
  const postFillContentMetrics = reject
    ? jest.fn().mockRejectedValue(new Error('Coordinator responded 503: unavailable'))
    : jest.fn().mockResolvedValue({});
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    postFillContentMetrics
  };
}

function createGenerateUseCase({
  requiresApproval = false,
  coordinatorClient,
  distributePathUseCase,
  extras = {}
} = {}) {
  const callOrder = [];
  const repository = {
    saveLearningPath: jest.fn().mockImplementation(async (path) => {
      callOrder.push('saveLearningPath');
      return {
        ...path,
        courseId: COURSE_ID,
        pathMetadata: path.pathMetadata || VALID_PROMPT3_PATH,
        learning_path: path.pathMetadata || VALID_PROMPT3_PATH
      };
    }),
    getLearningPathByUserAndTarget: jest.fn().mockResolvedValue(null)
  };

  const useCase = new GenerateLearningPathUseCase({
    geminiClient: fullModeGemini(),
    skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
    coordinatorClient,
    repository,
    jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
    promptLoader: fullModePromptLoader(),
    cacheRepository: { upsertSkillBreakdown: jest.fn().mockResolvedValue({}) },
    checkApprovalPolicyUseCase: {
      execute: jest.fn().mockResolvedValue({
        requiresApproval,
        company: requiresApproval
          ? { decisionMaker: { employee_id: 'dm-1', name: 'Approver' } }
          : { decisionMaker: null }
      })
    },
    requestPathApprovalUseCase: { execute: jest.fn().mockResolvedValue({ id: 'approval-1' }) },
    distributePathUseCase: distributePathUseCase || { execute: jest.fn() },
    skillsGapRepository: {
      getSkillsGapsByUser: jest.fn().mockResolvedValue([PERSISTED_GAP]),
      getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue(PERSISTED_GAP)
    },
    skillsExpansionRepository: {
      getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue(null),
      createSkillsExpansion: jest.fn(),
      updateSkillsExpansion: jest.fn()
    },
    ...extras
  });
  jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });

  if (coordinatorClient?.postFillContentMetrics) {
    const original = coordinatorClient.postFillContentMetrics;
    coordinatorClient.postFillContentMetrics = jest.fn(async (...args) => {
      callOrder.push('postFillContentMetrics');
      return original(...args);
    });
  }

  return { useCase, repository, callOrder, distributePathUseCase: useCase.distributePathUseCase };
}

function pendingApproval({ courseId = COURSE_ID } = {}) {
  return new PathApproval({
    id: 'approval-1',
    learningPathId: TARGET,
    courseId,
    companyId: COMPANY_ID,
    decisionMakerId: 'dm-1',
    status: 'pending'
  });
}

function approvedCourse() {
  return {
    course_id: COURSE_ID,
    user_id: USER_ID,
    competency_target_name: TARGET,
    learning_path: VALID_PROMPT3_PATH,
    approved: true
  };
}

describe('Course Builder personalized course push', () => {
  describe('auto-approved generation', () => {
    it('persists an approved path then sends exactly one Coordinator envelope', async () => {
      const coordinatorClient = createCoordinatorClient();
      const { useCase, repository, callOrder, distributePathUseCase } = createGenerateUseCase({
        requiresApproval: false,
        coordinatorClient
      });

      const saved = await useCase.processJob(createMockJob({ id: 'job-auto' }), thinSkillsGap());

      expect(saved.status).toBe('approved');
      expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
      expect(coordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(['saveLearningPath', 'postFillContentMetrics']);
      expect(distributePathUseCase.execute).not.toHaveBeenCalled();

      const envelope = coordinatorClient.postFillContentMetrics.mock.calls[0][0];
      expect(envelope.requester_service).toBe('learnerAI');
      expect(envelope.response).toEqual({});
      expect(Object.keys(envelope.response)).toHaveLength(0);
      expect(envelope.payload.action).toBe('push_learning_path');
      expect(envelope.payload.user_id).toBe(USER_ID);
      expect(envelope.payload.competency_target_name).toBe(TARGET);
      expect(envelope.payload.learning_path).toMatchObject({
        path_title: VALID_PROMPT3_PATH.path_title,
        learner_id: USER_ID,
        learning_modules: expect.any(Array)
      });
      expect(envelope.payload.learning_path.learning_modules.length).toBeGreaterThan(0);
    });

    it('hydrates user_name, preferred_language, company_name, exam_status, and skills_raw_data from persisted gap', async () => {
      const coordinatorClient = createCoordinatorClient();
      const { useCase } = createGenerateUseCase({
        requiresApproval: false,
        coordinatorClient
      });

      await useCase.processJob(createMockJob({ id: 'job-hydrate' }), thinSkillsGap());

      const payload = coordinatorClient.postFillContentMetrics.mock.calls[0][0].payload;
      expect(payload.user_name).toBe('Ada Lovelace');
      expect(payload.preferred_language).toBe('en');
      expect(payload.company_id).toBe(COMPANY_ID);
      expect(payload.company_name).toBe('Acme Corp');
      expect(payload.exam_status).toBe('fail');
      expect(payload.skills_raw_data).toEqual(expect.arrayContaining(['syntaxerror', 'throw statement']));
      expect(payload.user_name).not.toBeNull();
      expect(payload.preferred_language).not.toBeNull();
      expect(payload.company_name).not.toBeNull();
      expect(payload.exam_status).not.toBeNull();
      expect(payload.skills_raw_data).not.toEqual([]);
    });

    it('does not push when the generated path is pending manual approval', async () => {
      const coordinatorClient = createCoordinatorClient();
      const { useCase, repository, distributePathUseCase } = createGenerateUseCase({
        requiresApproval: true,
        coordinatorClient
      });

      const saved = await useCase.processJob(createMockJob({ id: 'job-pending' }), thinSkillsGap());

      expect(saved.status).toBe('pending');
      expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
      expect(coordinatorClient.postFillContentMetrics).not.toHaveBeenCalled();
      expect(distributePathUseCase.execute).not.toHaveBeenCalled();
    });

    it('keeps the persisted approved path when Coordinator fails', async () => {
      const coordinatorClient = createCoordinatorClient({ reject: true });
      const { useCase, repository } = createGenerateUseCase({
        requiresApproval: false,
        coordinatorClient
      });

      const saved = await useCase.processJob(createMockJob({ id: 'job-fail' }), thinSkillsGap());

      expect(saved.status).toBe('approved');
      expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
      expect(coordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
      expect(useCase.jobRepository.updateJob).toHaveBeenCalledWith(
        'job-fail',
        expect.objectContaining({ status: 'completed' })
      );
      expect(useCase.jobRepository.updateJob).not.toHaveBeenCalledWith(
        'job-fail',
        expect.objectContaining({ status: 'failed' })
      );
    });
  });

  describe('manual approval', () => {
    let coordinatorClient;
    let courseRepository;
    let skillsGapRepository;
    let distributePathUseCase;
    let useCase;

    beforeEach(() => {
      coordinatorClient = createCoordinatorClient();
      courseRepository = {
        updateCourseById: jest.fn().mockResolvedValue({ course_id: COURSE_ID, approved: true }),
        updateCourse: jest.fn(),
        getCourseByCourseId: jest.fn().mockResolvedValue(approvedCourse()),
        getCourseById: jest.fn()
      };
      skillsGapRepository = {
        getSkillsGapByUserAndCompetency: jest.fn().mockResolvedValue(PERSISTED_GAP)
      };
      distributePathUseCase = { execute: jest.fn() };
      const approval = pendingApproval();
      useCase = new ProcessApprovalResponseUseCase({
        approvalRepository: {
          getApprovalById: jest.fn().mockResolvedValue(approval),
          updateApproval: jest.fn().mockResolvedValue(new PathApproval({ ...approval, status: 'approved' }))
        },
        distributePathUseCase,
        notificationService: null,
        courseRepository,
        learnerRepository: null,
        skillsGapRepository,
        coordinatorClient
      });
    });

    it('pushes exactly once after approval persistence', async () => {
      const callOrder = [];
      courseRepository.updateCourseById.mockImplementation(async (...args) => {
        callOrder.push('updateCourseById');
        return { course_id: COURSE_ID, approved: true };
      });
      const originalPost = coordinatorClient.postFillContentMetrics;
      coordinatorClient.postFillContentMetrics = jest.fn(async (...args) => {
        callOrder.push('postFillContentMetrics');
        return originalPost(...args);
      });

      await useCase.execute('approval-1', 'approved', 'ok');

      expect(courseRepository.updateCourseById).toHaveBeenCalledWith(COURSE_ID, { approved: true });
      expect(coordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(['updateCourseById', 'postFillContentMetrics']);
      expect(distributePathUseCase.execute).not.toHaveBeenCalled();

      const envelope = coordinatorClient.postFillContentMetrics.mock.calls[0][0];
      expect(envelope.response).toEqual({});
      expect(envelope.payload.user_id).toBe(USER_ID);
      expect(envelope.payload.competency_target_name).toBe(TARGET);
      expect(envelope.payload.learning_path.learning_modules.length).toBeGreaterThan(0);
      expect(envelope.payload.user_name).toBe('Ada Lovelace');
      expect(envelope.payload.preferred_language).toBe('en');
    });

    it('does not push on rejection', async () => {
      const approval = pendingApproval();
      useCase = new ProcessApprovalResponseUseCase({
        approvalRepository: {
          getApprovalById: jest.fn().mockResolvedValue(approval),
          updateApproval: jest.fn().mockResolvedValue(new PathApproval({ ...approval, status: 'rejected' }))
        },
        distributePathUseCase,
        notificationService: null,
        courseRepository,
        skillsGapRepository,
        coordinatorClient
      });

      await useCase.execute('approval-1', 'rejected', 'not yet');

      expect(coordinatorClient.postFillContentMetrics).not.toHaveBeenCalled();
      expect(courseRepository.updateCourseById).not.toHaveBeenCalled();
      expect(distributePathUseCase.execute).not.toHaveBeenCalled();
    });

    it('resolves the course by course_id, not target-only lookup', async () => {
      await useCase.execute('approval-1', 'approved', 'ok');

      expect(courseRepository.getCourseByCourseId).toHaveBeenCalledWith(COURSE_ID);
      expect(courseRepository.getCourseById).not.toHaveBeenCalled();
      expect(skillsGapRepository.getSkillsGapByUserAndCompetency).toHaveBeenCalledWith(USER_ID, TARGET);
    });

    it('does not fail approval when Coordinator fails', async () => {
      coordinatorClient.postFillContentMetrics.mockRejectedValue(new Error('Coordinator responded 502: bad gateway'));

      const result = await useCase.execute('approval-1', 'approved', 'ok');

      expect(result.status).toBe('approved');
      expect(courseRepository.updateCourseById).toHaveBeenCalledWith(COURSE_ID, { approved: true });
      expect(distributePathUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
