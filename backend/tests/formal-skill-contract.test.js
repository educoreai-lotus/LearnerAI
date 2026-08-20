import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { createMockJob } from './testHelpers.js';

/**
 * Formal skill contract for Prompt 3:
 * - combinedSkills is the only allowed formal skill set
 * - Prompt 3 must not receive uncapped taxonomy as mandatory skills
 * - out-of-set formal skills retry, then fail-closed (no save/push)
 * - non-membership validation exhaustion remains soft
 */

const TARGET = 'cache storage';
const MAX = 10;

function makeValidPath(skills) {
  const unique = [...new Set((skills || []).filter(Boolean))];
  // Ensure at least 4 unique skills for a clean 2×2 split
  while (unique.length < 4) {
    unique.push(`filler-skill-${unique.length + 1}`);
  }
  const q1 = unique.slice(0, Math.ceil(unique.length / 4));
  const q2 = unique.slice(q1.length, q1.length + Math.ceil((unique.length - q1.length) / 3));
  const q3 = unique.slice(q1.length + q2.length, q1.length + q2.length + Math.ceil((unique.length - q1.length - q2.length) / 2));
  const q4 = unique.slice(q1.length + q2.length + q3.length);
  const m1 = [...q1, ...q2];
  const m2 = [...q3, ...q4];
  return {
    path_title: TARGET,
    learner_id: 'user-123',
    total_estimated_duration_hours: 8,
    learning_modules: [
      {
        module_order: 1,
        module_title: 'Module 1',
        estimated_duration_hours: 4,
        skills_in_module: m1,
        steps: [
          { step: 1, title: 'S1', description: 'intro', estimatedTime: 2, skills_covered: q1 },
          { step: 2, title: 'S2', description: 'next', estimatedTime: 2, skills_covered: q2 }
        ]
      },
      {
        module_order: 2,
        module_title: 'Module 2',
        estimated_duration_hours: 4,
        skills_in_module: m2,
        steps: [
          { step: 1, title: 'S3', description: 'adv', estimatedTime: 2, skills_covered: q3 },
          { step: 2, title: 'S4', description: 'mastery', estimatedTime: 2, skills_covered: q4 }
        ]
      }
    ]
  };
}

function makePathWithSkills(allowedSkills, extraOutOfSet = []) {
  return makeValidPath([...allowedSkills, ...extraOutOfSet]);
}

function parseExpandedFromPrompt3(promptText) {
  const marker = 'EXPANDED=';
  const idx = promptText.indexOf(marker);
  if (idx === -1) throw new Error('EXPANDED= marker not found');
  const raw = promptText.slice(idx + marker.length);
  // Prompt may append validation feedback after the JSON object
  const end = raw.indexOf('\n\n⚠️');
  const jsonSlice = end === -1 ? raw : raw.slice(0, end);
  return JSON.parse(jsonSlice.trim());
}

function parsePrompt3Expanded(geminiMock) {
  const calls = geminiMock.executePrompt.mock.calls;
  const p3Call = calls.find(([prompt]) => typeof prompt === 'string' && prompt.startsWith('P3 '));
  if (!p3Call) throw new Error('No Prompt 3 call found');
  return parseExpandedFromPrompt3(p3Call[0]);
}

function buildUseCase(overrides = {}) {
  const defaults = {
    geminiClient: { executePrompt: jest.fn() },
    skillsEngineClient: { requestSkillBreakdown: jest.fn() },
    repository: {
      saveLearningPath: jest.fn().mockImplementation(async (lp) => ({
        id: 'path-1',
        competencyTargetName: TARGET,
        courseId: lp.courseId || null,
        pathMetadata: lp.pathMetadata,
        status: lp.status
      })),
      getLearningPathByUserAndTarget: jest.fn().mockResolvedValue(null),
      getLearningPathById: jest.fn().mockResolvedValue(null)
    },
    jobRepository: { updateJob: jest.fn().mockResolvedValue({}) },
    promptLoader: {
      loadPrompt: jest.fn().mockImplementation((name) => {
        if (name === 'prompt1-skill-expansion') return Promise.resolve('P1 {input}');
        if (name === 'prompt2-competency-identification') return Promise.resolve('P2 {input}');
        if (name === 'prompt3-path-creation') {
          return Promise.resolve('P3 INITIAL={initialGap}\nEXPANDED={expandedBreakdown}');
        }
        return Promise.resolve('{input}');
      })
    },
    cacheRepository: { upsertSkillBreakdown: jest.fn().mockResolvedValue({}) },
    checkApprovalPolicyUseCase: { execute: jest.fn().mockResolvedValue({ requiresApproval: false }) },
    requestPathApprovalUseCase: { execute: jest.fn() },
    distributePathUseCase: { execute: jest.fn() },
    skillsGapRepository: { getSkillsGapsByUser: jest.fn().mockResolvedValue([]) },
    skillsExpansionRepository: {
      createSkillsExpansion: jest.fn().mockResolvedValue({ expansion_id: 'exp-1' }),
      updateSkillsExpansion: jest.fn().mockResolvedValue({}),
      getSkillsExpansionById: jest.fn().mockResolvedValue(null),
      getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue(null)
    },
    coordinatorClient: null
  };
  const merged = { ...defaults, ...overrides };
  const uc = new GenerateLearningPathUseCase(merged);
  return { uc, ...merged };
}

function gapSkillsRawData(skills) {
  return { [TARGET]: skills };
}

function makeMockGap(skillsRawData) {
  return {
    gap_id: 'gap-1',
    competency_target_name: TARGET,
    exam_status: 'fail',
    skills_raw_data: skillsRawData
  };
}

function makeSkillsGapEntity(skills) {
  return {
    userId: 'user-123',
    companyId: 'company-1',
    competencyTargetName: TARGET,
    skillsRawData: gapSkillsRawData(skills),
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

function makeExpansionSkills(n, prefix = 'expansion-skill') {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`);
}

function wireFullModeGemini(geminiClient, pathFactory) {
  geminiClient.executePrompt.mockImplementation(async (prompt) => {
    if (typeof prompt === 'string' && prompt.startsWith('P1 ')) {
      return { expanded_competencies_list: [{ competency_name: 'CompA' }, { competency_name: 'CompB' }] };
    }
    if (typeof prompt === 'string' && prompt.startsWith('P2 ')) {
      return {
        competencies_for_skills_engine_processing: [
          { competency_name: 'CompA' },
          { competency_name: 'CompB' }
        ]
      };
    }
    return typeof pathFactory === 'function' ? pathFactory(prompt) : pathFactory;
  });
}

describe('Formal skill contract — Prompt 3 membership', () => {
  // TEST 1 + 2 covered by personalized-path-skill-cap; re-assert briefly here
  it('TEST 1/2 — combinedSkills cap preserves genuine gaps (>10 never truncated)', async () => {
    const gap3 = ['manual invalidation', 'time-to-live (ttl)', 'least frequently used (lfu)'];
    const expansion = makeExpansionSkills(50);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion, CompB: makeExpansionSkills(20, 'other') });

    let capturedCombined = null;
    wireFullModeGemini(geminiClient, (prompt) => {
      if (prompt.startsWith('P3 ')) {
        const expanded = parseExpandedFromPrompt3(prompt);
        capturedCombined = expanded.COMPLETE_COMBINED_SKILL_LIST;
        return makeValidPath(capturedCombined);
      }
      return {};
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));
    expect(capturedCombined.length).toBe(MAX);
    for (const s of gap3) expect(capturedCombined).toContain(s);

    // gap > 10
    const gap15 = Array.from({ length: 15 }, (_, i) => `genuine-${i + 1}`);
    const ctx2 = buildUseCase();
    ctx2.skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap15))]);
    ctx2.skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });
    let captured15 = null;
    wireFullModeGemini(ctx2.geminiClient, (prompt) => {
      if (prompt.startsWith('P3 ')) {
        const expanded = parseExpandedFromPrompt3(prompt);
        captured15 = expanded.COMPLETE_COMBINED_SKILL_LIST;
        return makeValidPath(captured15);
      }
      return {};
    });
    await ctx2.uc.processJob(createMockJob({ id: 'job-15' }), makeSkillsGapEntity(gap15));
    expect(captured15.length).toBe(15);
    for (const s of gap15) expect(captured15).toContain(s);
  });

  it('TEST 3 — Prompt 3 formal fields contain only combinedSkills, not full taxonomy', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(50);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, cacheRepository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });
    wireFullModeGemini(geminiClient, (prompt) => {
      if (prompt.startsWith('P3 ')) {
        const expanded = parseExpandedFromPrompt3(prompt);
        return makeValidPath(expanded.COMPLETE_COMBINED_SKILL_LIST);
      }
      return {};
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));

    // Full taxonomy still cached internally
    const cached = cacheRepository.upsertSkillBreakdown.mock.calls[0][1];
    expect(cached.CompA.length).toBe(50);

    const expanded = parsePrompt3Expanded(geminiClient);
    expect(expanded.COMPLETE_COMBINED_SKILL_LIST.length).toBe(MAX);
    expect(expanded.ALLOWED_FORMAL_SKILLS).toEqual(expanded.COMPLETE_COMBINED_SKILL_LIST);
    expect(expanded.EXTRACTED_SKILLS).toEqual(expanded.COMPLETE_COMBINED_SKILL_LIST);
    expect(expanded.skillBreakdown.Allowed_Formal_Skills).toEqual(expanded.COMPLETE_COMBINED_SKILL_LIST);
    // Must not dump all 50 expansion skills as EXTRACTED_SKILLS
    expect(expanded.EXTRACTED_SKILLS.length).toBeLessThanOrEqual(MAX);
    expect(expanded.INSTRUCTION).toMatch(/ALLOWED formal skills/i);
    expect(expanded.INSTRUCTION).not.toMatch(/Expanded Breakdown skills \(50\)/);
  });

  it('TEST 4 — valid in-set path saves and completes normally', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(20);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, repository, jobRepository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });
    wireFullModeGemini(geminiClient, (prompt) => {
      if (prompt.startsWith('P3 ')) {
        const expanded = parseExpandedFromPrompt3(prompt);
        return makeValidPath(expanded.COMPLETE_COMBINED_SKILL_LIST);
      }
      return {};
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));
    expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
    expect(jobRepository.updateJob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('TEST 5 — out-of-set skill triggers retry with actionable feedback', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(20);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });

    let p3Calls = 0;
    let allowed = null;
    wireFullModeGemini(geminiClient, (prompt) => {
      if (!prompt.startsWith('P3 ')) return {};
      p3Calls += 1;
      const expanded = parseExpandedFromPrompt3(prompt);
      allowed = expanded.COMPLETE_COMBINED_SKILL_LIST;
      if (p3Calls === 1) {
        return makePathWithSkills(allowed, ['Chaos Engineering']);
      }
      return makeValidPath(allowed);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));
    expect(p3Calls).toBe(2);
    const secondPrompt = geminiClient.executePrompt.mock.calls.filter(([p]) => p.startsWith('P3 '))[1][0];
    expect(secondPrompt).toMatch(/Chaos Engineering/);
    expect(secondPrompt).toMatch(/Out-of-set formal skills/i);
    expect(secondPrompt).toMatch(/Allowed formal skills/i);
  });

  it('TEST 6 — invalid then valid succeeds and saves once', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(20);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, repository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });

    let p3Calls = 0;
    wireFullModeGemini(geminiClient, (prompt) => {
      if (!prompt.startsWith('P3 ')) return {};
      p3Calls += 1;
      const expanded = parseExpandedFromPrompt3(prompt);
      const allowed = expanded.COMPLETE_COMBINED_SKILL_LIST;
      if (p3Calls === 1) return makePathWithSkills(allowed, ['rate limiting']);
      return makeValidPath(allowed);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));
    expect(p3Calls).toBe(2);
    expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
    const saved = repository.saveLearningPath.mock.calls[0][0];
    const formal = [];
    for (const m of saved.pathMetadata.learning_modules) {
      formal.push(...(m.skills_in_module || []));
      for (const s of m.steps || []) formal.push(...(s.skills_covered || []));
    }
    expect(formal).not.toContain('rate limiting');
  });

  it('TEST 7 — all attempts out-of-set → no save, no push, job failed', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(20);
    const mockPush = jest.fn().mockResolvedValue({});
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, repository, jobRepository } = buildUseCase({
      coordinatorClient: {
        isConfigured: () => true,
        postFillContentMetrics: mockPush
      }
    });
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });

    let p3Calls = 0;
    wireFullModeGemini(geminiClient, (prompt) => {
      if (!prompt.startsWith('P3 ')) return {};
      p3Calls += 1;
      const expanded = parseExpandedFromPrompt3(prompt);
      return makePathWithSkills(expanded.COMPLETE_COMBINED_SKILL_LIST, [`bad-skill-${p3Calls}`]);
    });

    await expect(uc.processJob(createMockJob({ id: 'job-fail-closed' }), makeSkillsGapEntity(gap3)))
      .rejects.toThrow(/outside allowed personalized set/i);

    expect(p3Calls).toBe(3);
    expect(repository.saveLearningPath).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(jobRepository.updateJob).toHaveBeenCalledWith(
      'job-fail-closed',
      expect.objectContaining({ status: 'failed' })
    );
  });

  it('TEST 8 — non-membership validation exhaustion remains soft (still saves)', async () => {
    const gap3 = ['a', 'b', 'c'];
    const expansion = makeExpansionSkills(20);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, repository } = buildUseCase();
    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gap3))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ CompA: expansion });

    // Spy: force structural-only failures (no out-of-set), then soft continue
    jest.spyOn(uc, '_validateLearningPath').mockImplementation(() => {
      return {
        valid: false,
        errors: ['Module 1 has incorrect module_order: 99'],
        outOfSetSkills: []
      };
    });

    wireFullModeGemini(geminiClient, (prompt) => {
      if (!prompt.startsWith('P3 ')) return {};
      const expanded = parseExpandedFromPrompt3(prompt);
      return makeValidPath(expanded.COMPLETE_COMBINED_SKILL_LIST);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));
    expect(repository.saveLearningPath).toHaveBeenCalledTimes(1);
    expect(uc._validateLearningPath.mock.calls.length).toBe(3);
  });

  it('TEST 9 — update mode: full cached breakdown intact; Prompt 3 formal set bounded', async () => {
    const gap3 = ['aggregateerror', 'rangeerror', 'typeerror'];
    const taxonomy = makeExpansionSkills(40, 'taxonomy');
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository, cacheRepository } = buildUseCase({
      repository: {
        saveLearningPath: jest.fn().mockResolvedValue({ id: 'path-1', competencyTargetName: TARGET }),
        getLearningPathByUserAndTarget: jest.fn().mockResolvedValue({
          competencyTargetName: TARGET,
          userId: 'user-123',
          courseId: 'course-existing'
        }),
        getLearningPathById: jest.fn().mockResolvedValue(null)
      },
      skillsExpansionRepository: {
        createSkillsExpansion: jest.fn().mockResolvedValue({ expansion_id: 'exp-1' }),
        updateSkillsExpansion: jest.fn().mockResolvedValue({}),
        getSkillsExpansionById: jest.fn().mockResolvedValue(null),
        getLatestSkillsExpansionByUserAndGap: jest.fn().mockResolvedValue({
          expansion_id: 'exp-existing',
          prompt_1_output: { expanded_competencies_list: [{ competency_name: 'ErrorHandling' }] },
          prompt_2_output: {
            competencies_for_skills_engine_processing: [{ competency_name: 'ErrorHandling' }]
          }
        })
      }
    });

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([{
      gap_id: 'gap-1',
      competency_target_name: TARGET,
      exam_status: 'fail',
      skills_raw_data: gapSkillsRawData(gap3)
    }]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ ErrorHandling: taxonomy });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      const expanded = parseExpandedFromPrompt3(prompt);
      return makeValidPath(expanded.COMPLETE_COMBINED_SKILL_LIST);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gap3));

    const cached = cacheRepository.upsertSkillBreakdown.mock.calls[0][1];
    expect(cached.ErrorHandling.length).toBe(40);

    const expanded = parsePrompt3Expanded(geminiClient);
    expect(expanded.COMPLETE_COMBINED_SKILL_LIST.length).toBeLessThanOrEqual(MAX);
    expect(expanded.EXTRACTED_SKILLS.length).toBeLessThanOrEqual(MAX);
    for (const s of gap3) expect(expanded.COMPLETE_COMBINED_SKILL_LIST).toContain(s);
  });
});

describe('Unit — _validateLearningPath membership', () => {
  it('flags out-of-set skills case-insensitively and returns outOfSetSkills', () => {
    const uc = new GenerateLearningPathUseCase({});
    const allowed = ['manual invalidation', 'TTL', 'LFU', 'cache-aside'];
    const path = {
      path_title: TARGET,
      learner_id: 'user-123',
      total_estimated_duration_hours: 4,
      learning_modules: [
        {
          module_order: 1,
          module_title: 'M1',
          estimated_duration_hours: 2,
          skills_in_module: ['manual invalidation', 'Chaos Engineering'],
          steps: [
            { step: 1, title: 't', description: 'd', estimatedTime: 1, skills_covered: ['manual invalidation'] },
            { step: 2, title: 't', description: 'd', estimatedTime: 1, skills_covered: ['Chaos Engineering'] }
          ]
        },
        {
          module_order: 2,
          module_title: 'M2',
          estimated_duration_hours: 2,
          skills_in_module: ['ttl', 'LFU'],
          steps: [
            { step: 1, title: 't', description: 'd', estimatedTime: 1, skills_covered: ['ttl'] },
            { step: 2, title: 't', description: 'd', estimatedTime: 1, skills_covered: ['LFU'] }
          ]
        }
      ]
    };

    const result = uc._validateLearningPath(path, allowed);
    expect(result.outOfSetSkills.map((s) => s.toLowerCase())).toContain('chaos engineering');
    expect(result.valid).toBe(false);
    expect(result.outOfSetSkills.map((s) => s.toLowerCase())).not.toContain('ttl');
  });
});
