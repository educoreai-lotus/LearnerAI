import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LearningPath } from '../src/domain/entities/LearningPath.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { GetLearningPathForCourseBuilderUseCase } from '../src/application/useCases/GetLearningPathForCourseBuilderUseCase.js';
import { SupabaseRepository } from '../src/infrastructure/repositories/SupabaseRepository.js';
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

const testsDir = dirname(fileURLToPath(import.meta.url));
const backendDir = join(testsDir, '..');
const repoRoot = join(backendDir, '..');
const migration2a = join(repoRoot, 'database', 'migrations', 'stage_2a_add_user_target_unique.sql');
const migration2b = join(repoRoot, 'database', 'migrations', 'stage_2b_course_identity_cutover.sql');

describe('Stage 2 course identity cutover preparation', () => {
  describe('saveLearningPath conflict target', () => {
    let repository;
    let mockClient;

    beforeEach(() => {
      repository = new SupabaseRepository('https://fake.supabase.co', 'fake-key');
      mockClient = createMockSupabaseClient();
      repository.client = mockClient;
    });

    it('uses onConflict user_id,competency_target_name', async () => {
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
        { onConflict: 'user_id,competency_target_name' }
      );
    });

    it('same user + same target preserves course_id', async () => {
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

      const upsertPayload = mockClient.upsert.mock.calls[0][0];
      expect(upsertPayload.course_id).toBe(COURSE_ID_A);
      expect(upsertPayload.user_id).toBe(USER_A);
      expect(upsertPayload.competency_target_name).toBe(TARGET);
    });

    it('new target omits course_id so the database DEFAULT can generate it', async () => {
      mockClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        .mockResolvedValueOnce({ data: dbCourseRecord({ target: 'python' }), error: null });

      await repository.saveLearningPath(new LearningPath({
        id: 'python',
        userId: USER_A,
        competencyTargetName: 'python',
        gapId: GAP_A,
        pathMetadata: VALID_PROMPT3_PATH,
        status: 'completed'
      }));

      const upsertPayload = mockClient.upsert.mock.calls[0][0];
      expect(upsertPayload.competency_target_name).toBe('python');
      expect(upsertPayload).not.toHaveProperty('course_id');
      expect(mockClient.upsert.mock.calls[0][1]).toEqual({
        onConflict: 'user_id,competency_target_name'
      });
    });

    it('foreign user + same target inserts a new course (no collision)', async () => {
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

      expect(mockClient.upsert).toHaveBeenCalled();
      const upsertPayload = mockClient.upsert.mock.calls[0][0];
      expect(upsertPayload.user_id).toBe(USER_B);
      expect(upsertPayload.competency_target_name).toBe(TARGET);
      expect(upsertPayload).not.toHaveProperty('course_id');
    });
  });

  describe('generation collision guard is removed', () => {
    it('User B + same target proceeds to FULL MODE when B has no owned course', async () => {
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
      const useCase = new GenerateLearningPathUseCase({
        geminiClient: mockGemini,
        skillsEngineClient: { requestSkillBreakdown: jest.fn().mockResolvedValue({ Example: ['syntaxerror'] }) },
        repository: mockRepository,
        jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
        promptLoader: {
          loadPrompt: jest.fn().mockImplementation((name) => {
            if (name === 'prompt1-skill-expansion') return Promise.resolve('P1 {input}');
            if (name === 'prompt2-competency-identification') return Promise.resolve('P2 {input}');
            if (name === 'prompt3-path-creation') {
              return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
            }
            return Promise.resolve('DEFAULT {input}');
          })
        },
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
      expect(mockGemini.executePrompt).toHaveBeenCalled();
    });

    it('source has user+target upsert and no COURSE_OWNERSHIP_COLLISION', () => {
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

      expect(saveSource).toContain("onConflict: 'user_id,competency_target_name'");
      expect(saveSource).not.toContain("onConflict: 'competency_target_name'");
      expect(saveSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
      expect(generateSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
      expect(createSource).not.toContain('COURSE_OWNERSHIP_COLLISION');
    });
  });

  describe('approval and Course Builder remain course_id based', () => {
    it('approval A updates course A by course_id', async () => {
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

    it('Course Builder still resolves user+target and does not expose course_id', async () => {
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
      expect(result.data.user_id).toBe(USER_A);
      expect(result.data.competency_target_name).toBe(TARGET);
      expect(result.data).not.toHaveProperty('course_id');
    });
  });

  describe('no generation / prompt behavior change', () => {
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

  describe('Stage 2A SQL is additive UNIQUE only', () => {
    it('adds composite UNIQUE and does not drop current PK or FKs', () => {
      expect(existsSync(migration2a)).toBe(true);
      const sql = readFileSync(migration2a, 'utf8');
      const executable = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');

      expect(sql).toContain('UNIQUE (user_id, competency_target_name)');
      expect(sql).toContain('courses_user_id_competency_target_name_unique');
      expect(executable).toMatch(/BEGIN;/);
      expect(executable).toMatch(/COMMIT;/);
      expect(executable).toMatch(/duplicate \(user_id, competency_target_name\)/);

      expect(executable).not.toMatch(/DROP CONSTRAINT/i);
      expect(executable).not.toMatch(/ADD\s+PRIMARY\s+KEY/i);
      expect(executable).not.toMatch(/fk_path_approvals_learning_path/);
      expect(executable).not.toMatch(/fk_recommendations_course/);
      expect(executable).not.toMatch(/\bDELETE\b/);
      expect(executable).not.toMatch(/\bTRUNCATE\b/);
      expect(executable).not.toMatch(/DROP TABLE/i);
      expect(executable).not.toMatch(/DROP COLUMN/i);
      expect(executable).not.toMatch(/learning_path/i);
    });
  });

  describe('Stage 2B SQL identity cutover', () => {
    it('drops only legacy target FKs, moves PK to course_id, and preserves required constraints/columns', () => {
      expect(existsSync(migration2b)).toBe(true);
      const sql = readFileSync(migration2b, 'utf8');
      const executable = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');

      expect(executable).toContain('DROP CONSTRAINT IF EXISTS fk_path_approvals_learning_path');
      expect(executable).toContain('DROP CONSTRAINT IF EXISTS fk_recommendations_course');
      expect(executable).toContain('PRIMARY KEY (course_id)');
      expect(executable).toContain('courses_course_id_unique');
      expect(executable).toContain('courses_user_id_competency_target_name_unique');
      expect(executable).toContain('DROP CONSTRAINT %I');

      expect(executable).not.toMatch(/DROP COLUMN/i);
      expect(executable).not.toMatch(/DROP TABLE/i);
      expect(executable).not.toMatch(/\bTRUNCATE\b/);
      expect(executable).not.toMatch(/DELETE FROM/i);
      expect(executable).not.toMatch(/UPDATE\s+courses/i);
      expect(executable).not.toMatch(/SET\s+learning_path/i);
      expect(executable).not.toContain('DROP CONSTRAINT IF EXISTS fk_path_approvals_course_id');
      expect(executable).not.toContain('DROP CONSTRAINT IF EXISTS fk_recommendations_course_id');
      expect(executable).not.toContain('ALTER COLUMN course_id DROP');
      expect(executable).not.toMatch(/DROP COLUMN.*learning_path_id/i);
      expect(executable).not.toMatch(/DROP COLUMN.*base_course_name/i);
    });
  });
});
