import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { createMockJob } from './testHelpers.js';

/**
 * Focused tests for the MAX_PERSONALIZED_PATH_SKILLS expansion cap.
 *
 * What we verify here:
 *   - The final `combinedSkills` passed as COMPLETE_COMBINED_SKILL_LIST to Prompt 3 is bounded.
 *   - Genuine gap skills (initialSkills) are NEVER discarded, even when > 10.
 *   - Only the non-authoritative expansion portion is capped.
 *   - The Skills Engine breakdown itself (skillBreakdown) is NOT truncated.
 *   - Update-mode zero-overlap fallback still fires and preserves the full breakdown.
 */

const TARGET = 'javascript';
const MAX = 10; // Must match constant in GenerateLearningPathUseCase.js

// Reusable valid Prompt 3 response (2 modules × 2 steps)
function makeValidPath(skills) {
  const half = Math.ceil(skills.length / 2);
  const q1 = skills.slice(0, Math.ceil(half / 2));
  const q2 = skills.slice(Math.ceil(half / 2), half);
  const q3 = skills.slice(half, half + Math.ceil((skills.length - half) / 2));
  const q4 = skills.slice(half + Math.ceil((skills.length - half) / 2));
  return {
    path_title: TARGET,
    learner_id: 'user-123',
    total_estimated_duration_hours: 8,
    learning_modules: [
      {
        module_order: 1,
        module_title: 'Module 1',
        estimated_duration_hours: 4,
        skills_in_module: [...q1, ...q2],
        steps: [
          { step: 1, title: 'S1', description: 'd', estimatedTime: 2, skills_covered: q1.length ? q1 : ['placeholder'] },
          { step: 2, title: 'S2', description: 'd', estimatedTime: 2, skills_covered: q2.length ? q2 : ['placeholder2'] }
        ]
      },
      {
        module_order: 2,
        module_title: 'Module 2',
        estimated_duration_hours: 4,
        skills_in_module: [...q3, ...q4],
        steps: [
          { step: 1, title: 'S3', description: 'd', estimatedTime: 2, skills_covered: q3.length ? q3 : ['placeholder3'] },
          { step: 2, title: 'S4', description: 'd', estimatedTime: 2, skills_covered: q4.length ? q4 : ['placeholder4'] }
        ]
      }
    ]
  };
}

function buildUseCase(overrides = {}) {
  const defaults = {
    geminiClient: { executePrompt: jest.fn() },
    skillsEngineClient: { requestSkillBreakdown: jest.fn() },
    repository: {
      saveLearningPath: jest.fn().mockResolvedValue({ id: 'path-1', competencyTargetName: TARGET }),
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
    }
  };
  const merged = { ...defaults, ...overrides };
  const uc = new GenerateLearningPathUseCase(merged);
  jest.spyOn(uc, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });
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
      return { userId: this.userId, companyId: this.companyId, competencyTargetName: this.competencyTargetName, skills_raw_data: this.skillsRawData };
    }
  };
}

/** Extract COMPLETE_COMBINED_SKILL_LIST from the Prompt 3 expandedBreakdown argument */
function extractCombinedSkillsFromPrompt3(geminiMock) {
  const calls = geminiMock.executePrompt.mock.calls;
  const p3Call = calls.find(([prompt]) => typeof prompt === 'string' && prompt.startsWith('P3 '));
  if (!p3Call) throw new Error('No Prompt 3 call found');
  const promptText = p3Call[0];
  const marker = 'EXPANDED=';
  const idx = promptText.indexOf(marker);
  if (idx === -1) throw new Error('EXPANDED= marker not found in Prompt 3');
  const expanded = JSON.parse(promptText.slice(idx + marker.length));
  return expanded.COMPLETE_COMBINED_SKILL_LIST;
}

/** Extract EXTRACTED_SKILLS from the Prompt 3 initialGap argument */
function extractInitialSkillsFromPrompt3(geminiMock) {
  const calls = geminiMock.executePrompt.mock.calls;
  const p3Call = calls.find(([prompt]) => typeof prompt === 'string' && prompt.startsWith('P3 '));
  if (!p3Call) throw new Error('No Prompt 3 call found');
  const promptText = p3Call[0];
  const startMarker = 'INITIAL=';
  const endMarker = '\nEXPANDED=';
  const start = promptText.indexOf(startMarker);
  const end = promptText.indexOf(endMarker);
  if (start === -1 || end === -1) throw new Error('Markers not found in Prompt 3');
  const initial = JSON.parse(promptText.slice(start + startMarker.length, end));
  return initial.EXTRACTED_SKILLS;
}

// Generate N unique expansion skill names
function makeExpansionSkills(n, prefix = 'expansion-skill') {
  return Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`);
}

// -------------------------------------------------------------------
// TEST 1 — production-like: 3 gap skills + 50 expansion → cap to 10
// -------------------------------------------------------------------
describe('TEST 1 — production-like expansion (3 gap → cap 10)', () => {
  it('combines 3 genuine gap skills with exactly 7 unique expansion skills', async () => {
    const gapSkills = ['aggregateerror', 'rangeerror', 'typeerror'];
    const expansionSkills = makeExpansionSkills(50);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gapSkills))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({
      'ErrorHandling': expansionSkills
    });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      if (prompt.startsWith('P1 ')) {
        return { expanded_competencies_list: [{ competency_name: 'ErrorHandling' }] };
      }
      if (prompt.startsWith('P2 ')) {
        return { competencies_for_skills_engine_processing: [{ competency_name: 'ErrorHandling' }] };
      }
      // Prompt 3 — return a path using whatever skills the combined list has
      return makeValidPath(gapSkills.concat(expansionSkills.slice(0, 7)));
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));

    const combined = extractCombinedSkillsFromPrompt3(geminiClient);
    expect(combined.length).toBe(MAX);

    // All 3 genuine gap skills present
    for (const s of gapSkills) {
      expect(combined).toContain(s);
    }
    // Exactly 7 expansion skills
    const expansionInCombined = combined.filter(s => !gapSkills.includes(s));
    expect(expansionInCombined.length).toBe(7);

    // Genuine gap skills appear first
    expect(combined[0]).toBe('aggregateerror');
    expect(combined[1]).toBe('rangeerror');
    expect(combined[2]).toBe('typeerror');
  });
});

// -------------------------------------------------------------------
// TEST 2 — genuine gap > MAX: 15 skills, all retained, zero expansion
// -------------------------------------------------------------------
describe('TEST 2 — genuine gap exceeds maximum (15 skills)', () => {
  it('retains ALL 15 genuine skills and adds zero expansion skills', async () => {
    const gapSkills = Array.from({ length: 15 }, (_, i) => `genuine-skill-${i + 1}`);
    const expansionSkills = makeExpansionSkills(50);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gapSkills))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ 'SomeComp': expansionSkills });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      if (prompt.startsWith('P1 ')) return { expanded_competencies_list: [{ competency_name: 'SomeComp' }] };
      if (prompt.startsWith('P2 ')) return { competencies_for_skills_engine_processing: [{ competency_name: 'SomeComp' }] };
      return makeValidPath(gapSkills);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));

    const combined = extractCombinedSkillsFromPrompt3(geminiClient);
    expect(combined.length).toBe(15);
    for (const s of gapSkills) {
      expect(combined).toContain(s);
    }
    // No expansion skills present
    for (const s of expansionSkills) {
      expect(combined).not.toContain(s);
    }
  });
});

// -------------------------------------------------------------------
// TEST 3 — exactly at maximum: 10 gap skills, zero expansion included
// -------------------------------------------------------------------
describe('TEST 3 — exactly at maximum (10 genuine gap skills)', () => {
  it('retains all 10 and includes zero expansion', async () => {
    const gapSkills = Array.from({ length: 10 }, (_, i) => `exact-skill-${i + 1}`);
    const expansionSkills = makeExpansionSkills(20);
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gapSkills))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ 'SomeComp': expansionSkills });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      if (prompt.startsWith('P1 ')) return { expanded_competencies_list: [{ competency_name: 'SomeComp' }] };
      if (prompt.startsWith('P2 ')) return { competencies_for_skills_engine_processing: [{ competency_name: 'SomeComp' }] };
      return makeValidPath(gapSkills);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));

    const combined = extractCombinedSkillsFromPrompt3(geminiClient);
    expect(combined.length).toBe(10);
    for (const s of gapSkills) {
      expect(combined).toContain(s);
    }
    for (const s of expansionSkills) {
      expect(combined).not.toContain(s);
    }
  });
});

// -------------------------------------------------------------------
// TEST 4 — duplicates: gap duplicates and expansion overlaps with gap
// -------------------------------------------------------------------
describe('TEST 4 — duplicate handling', () => {
  it('deduplicates gap; overlap between gap and expansion does not consume budget', async () => {
    // Gap has duplicate "rangeerror" and one unique skill
    const rawGapWithDuplicates = ['rangeerror', 'rangeerror', 'typeerror'];
    // Expansion starts with "typeerror" (already in gap) then unique skills
    const expansionSkills = ['typeerror', ...makeExpansionSkills(50)];
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(rawGapWithDuplicates))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ 'Comp': expansionSkills });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      if (prompt.startsWith('P1 ')) return { expanded_competencies_list: [{ competency_name: 'Comp' }] };
      if (prompt.startsWith('P2 ')) return { competencies_for_skills_engine_processing: [{ competency_name: 'Comp' }] };
      return makeValidPath(['rangeerror', 'typeerror']);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(rawGapWithDuplicates));

    const combined = extractCombinedSkillsFromPrompt3(geminiClient);

    // Deduplicated gap: 2 unique skills
    expect(combined).toContain('rangeerror');
    expect(combined).toContain('typeerror');

    // Budget = 10 - 2 = 8 expansion skills (typeerror already in gap, doesn't count)
    const uniqueGapCount = 2;
    const expansionInCombined = combined.filter(s => !['rangeerror', 'typeerror'].includes(s));
    expect(expansionInCombined.length).toBe(MAX - uniqueGapCount);
    expect(combined.length).toBe(MAX);

    // typeerror appears exactly once
    expect(combined.filter(s => s === 'typeerror').length).toBe(1);
  });
});

// -------------------------------------------------------------------
// TEST 5 — no expansion skills available
// -------------------------------------------------------------------
describe('TEST 5 — no expansion skills', () => {
  it('returns exactly the genuine gap skills without padding', async () => {
    const gapSkills = ['aggregateerror', 'rangeerror', 'typeerror'];
    const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gapSkills))]);
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ 'Comp': [] });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      if (prompt.startsWith('P1 ')) return { expanded_competencies_list: [{ competency_name: 'Comp' }] };
      if (prompt.startsWith('P2 ')) return { competencies_for_skills_engine_processing: [{ competency_name: 'Comp' }] };
      return makeValidPath(gapSkills);
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));

    const combined = extractCombinedSkillsFromPrompt3(geminiClient);
    expect(combined).toEqual(gapSkills);
    expect(combined.length).toBe(3);
  });
});

// -------------------------------------------------------------------
// TEST 6 — deterministic order: same input → same output twice
// -------------------------------------------------------------------
describe('TEST 6 — deterministic ordering', () => {
  it('produces identical combined skill list on two runs with the same input', async () => {
    const gapSkills = ['aggregateerror', 'rangeerror', 'typeerror'];
    const expansionSkills = makeExpansionSkills(50);

    async function run() {
      const { uc, geminiClient, skillsEngineClient, skillsGapRepository } = buildUseCase();
      skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([makeMockGap(gapSkillsRawData(gapSkills))]);
      skillsEngineClient.requestSkillBreakdown.mockResolvedValue({ 'Comp': expansionSkills });
      geminiClient.executePrompt.mockImplementation(async (prompt) => {
        if (prompt.startsWith('P1 ')) return { expanded_competencies_list: [{ competency_name: 'Comp' }] };
        if (prompt.startsWith('P2 ')) return { competencies_for_skills_engine_processing: [{ competency_name: 'Comp' }] };
        return makeValidPath(gapSkills.concat(expansionSkills.slice(0, 7)));
      });
      await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));
      return extractCombinedSkillsFromPrompt3(geminiClient);
    }

    const first = await run();
    const second = await run();
    expect(first).toEqual(second);
  });
});

// -------------------------------------------------------------------
// TEST 7 — update-mode zero-overlap fallback still preserves full breakdown internally
// -------------------------------------------------------------------
describe('TEST 7 — update-mode zero-overlap fallback preserved; only Prompt 3 list is bounded', () => {
  it('caches the full Skills Engine skills but passes only capped list to Prompt 3', async () => {
    const gapSkills = ['aggregateerror', 'rangeerror', 'typeerror'];
    // 20 Skills Engine skills with zero textual overlap with gap
    const taxonomySkills = makeExpansionSkills(20, 'taxonomy');

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
          prompt_2_output: { competencies_for_skills_engine_processing: [{ competency_name: 'ErrorHandling' }] }
        })
      }
    });

    skillsGapRepository.getSkillsGapsByUser.mockResolvedValue([{
      gap_id: 'gap-1',
      competency_target_name: TARGET,
      exam_status: 'fail',
      skills_raw_data: gapSkillsRawData(gapSkills)
    }]);

    // Skills Engine returns 20 taxonomy skills that have no textual overlap with gap
    skillsEngineClient.requestSkillBreakdown.mockResolvedValue({
      'ErrorHandling': taxonomySkills
    });

    geminiClient.executePrompt.mockImplementation(async (prompt) => {
      return makeValidPath(gapSkills.concat(taxonomySkills.slice(0, 7)));
    });

    await uc.processJob(createMockJob(), makeSkillsGapEntity(gapSkills));

    // Full breakdown is cached — NOT truncated
    const cachedBreakdown = cacheRepository.upsertSkillBreakdown.mock.calls[0][1];
    expect(cachedBreakdown['ErrorHandling'].length).toBe(20);

    // But Prompt 3 COMPLETE_COMBINED_SKILL_LIST is bounded
    const combined = extractCombinedSkillsFromPrompt3(geminiClient);
    expect(combined.length).toBeLessThanOrEqual(MAX);
    // All 3 genuine gap skills present
    for (const s of gapSkills) {
      expect(combined).toContain(s);
    }
  });
});
