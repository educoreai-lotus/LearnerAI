import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GenerateLearningPathUseCase } from '../src/application/useCases/GenerateLearningPathUseCase.js';
import { createMockJob } from './testHelpers.js';

const COMPETENCY_ERROR_HANDLING = 'Error Handling';
const COMPETENCY_ARCHITECTURE = 'Advanced Architecture';
const TARGET = 'javascript';

const REMAINING_GAP_SKILLS = ['aggregateerror', 'rangeerror', 'syntaxerror'];
const REAL_ERROR_SKILLS = [
  'throw statement',
  'try-catch statement',
  'promise.catch method'
];
const REAL_ARCHITECTURE_SKILLS = [
  'console logging',
  'fallback mechanism design'
];

const VALID_PROMPT3_PATH = {
  path_title: 'JavaScript Error Handling',
  learner_id: 'user-123',
  total_estimated_duration_hours: 4,
  learning_modules: [
    {
      module_order: 1,
      module_title: 'Foundations',
      estimated_duration_hours: 2,
      skills_in_module: ['syntaxerror', 'throw statement'],
      steps: [
        { step: 1, title: 'Step 1', description: 'd', estimatedTime: 30, skills_covered: ['syntaxerror'] },
        { step: 2, title: 'Step 2', description: 'd', estimatedTime: 30, skills_covered: ['throw statement'] }
      ]
    },
    {
      module_order: 2,
      module_title: 'Applied Handling',
      estimated_duration_hours: 2,
      skills_in_module: ['try-catch statement', 'promise.catch method'],
      steps: [
        { step: 1, title: 'Step 3', description: 'd', estimatedTime: 30, skills_covered: ['try-catch statement'] },
        { step: 2, title: 'Step 4', description: 'd', estimatedTime: 30, skills_covered: ['promise.catch method'] }
      ]
    }
  ]
};

function prompt2Output(competencyNames) {
  return {
    competencies_for_skills_engine_processing: competencyNames.map((competency_name) => ({
      competency_name
    }))
  };
}

function parsePrompt3Assembly(promptText) {
  const initialMarker = 'INITIAL_GAP=';
  const expandedMarker = '\nEXPANDED_BREAKDOWN=';
  const initialStart = promptText.indexOf(initialMarker);
  const expandedStart = promptText.indexOf(expandedMarker);
  if (initialStart === -1 || expandedStart === -1) {
    throw new Error('Prompt 3 template markers not found');
  }
  const initialGap = JSON.parse(
    promptText.slice(initialStart + initialMarker.length, expandedStart)
  );
  const expandedBreakdown = JSON.parse(
    promptText.slice(expandedStart + expandedMarker.length)
  );
  return { initialGap, expandedBreakdown };
}

describe('UPDATE MODE skill-breakdown filtering', () => {
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
    mockGeminiClient = {
      executePrompt: jest.fn().mockResolvedValue(VALID_PROMPT3_PATH)
    };
    mockSkillsEngineClient = {
      requestSkillBreakdown: jest.fn()
    };
    mockRepository = {
      saveLearningPath: jest.fn().mockResolvedValue({ id: 'path-123', competencyTargetName: TARGET }),
      getLearningPath: jest.fn(),
      getLearningPathById: jest.fn(),
      getLearningPathsByUser: jest.fn(),
      updateLearningPath: jest.fn()
    };
    mockJobRepository = {
      createJob: jest.fn(),
      updateJob: jest.fn().mockResolvedValue({}),
      getJob: jest.fn()
    };
    mockPromptLoader = {
      loadPrompt: jest.fn().mockImplementation((promptName) => {
        if (promptName === 'prompt1-skill-expansion') {
          return Promise.resolve('P1 {input}');
        }
        if (promptName === 'prompt2-competency-identification') {
          return Promise.resolve('P2 {input}');
        }
        if (promptName === 'prompt3-path-creation') {
          return Promise.resolve('P3 INITIAL_GAP={initialGap}\nEXPANDED_BREAKDOWN={expandedBreakdown}');
        }
        return Promise.resolve('DEFAULT {input}');
      })
    };
    mockCheckApprovalPolicyUseCase = {
      execute: jest.fn().mockResolvedValue({ requiresApproval: false })
    };
    mockRequestPathApprovalUseCase = {
      execute: jest.fn()
    };
    mockDistributePathUseCase = {
      execute: jest.fn()
    };
    mockSkillsGapRepository = {
      getSkillsGapByUserAndCompetency: jest.fn(),
      getSkillsGapsByUser: jest.fn()
    };
    mockSkillsExpansionRepository = {
      createSkillsExpansion: jest.fn().mockResolvedValue({ expansionId: 'exp-123' }),
      updateSkillsExpansion: jest.fn().mockResolvedValue({}),
      getSkillsExpansionById: jest.fn().mockResolvedValue(null),
      getSkillsExpansionsByGapId: jest.fn().mockResolvedValue([]),
      getLatestSkillsExpansionByUserAndGap: jest.fn()
    };
    mockCacheRepository = {
      getSkillsGapByUserAndCompetency: jest.fn(),
      upsertSkillBreakdown: jest.fn().mockResolvedValue({})
    };

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

    jest.spyOn(useCase, '_validateLearningPath').mockReturnValue({ valid: true, errors: [] });
  });

  function createSkillsGap() {
    return {
      userId: 'user-123',
      companyId: 'company-456',
      competencyTargetName: TARGET,
      skillsRawData: { [TARGET]: REMAINING_GAP_SKILLS },
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

  function mockExistingGap(skillsRawData) {
    mockSkillsGapRepository.getSkillsGapsByUser.mockResolvedValue([{
      gap_id: 'gap-123',
      competency_target_name: TARGET,
      exam_status: 'fail',
      skills_raw_data: skillsRawData
    }]);
  }

  function enterUpdateMode(competencyNames) {
    mockRepository.getLearningPathById.mockResolvedValue({
      competencyTargetName: TARGET,
      userId: 'user-123'
    });
    mockSkillsExpansionRepository.getLatestSkillsExpansionByUserAndGap.mockResolvedValue({
      expansion_id: 'exp-existing',
      prompt_1_output: {
        expanded_competencies_list: competencyNames.map((competency_name) => ({ competency_name }))
      },
      prompt_2_output: prompt2Output(competencyNames)
    });
  }

  async function runProcessJob() {
    const job = createMockJob({ id: 'job-update-1' });
    return useCase.processJob(job, createSkillsGap());
  }

  function cachedBreakdown() {
    expect(mockCacheRepository.upsertSkillBreakdown).toHaveBeenCalled();
    return mockCacheRepository.upsertSkillBreakdown.mock.calls[0][1];
  }

  function lastPrompt3Assembly() {
    const prompt3Calls = mockGeminiClient.executePrompt.mock.calls.filter(
      ([prompt]) => typeof prompt === 'string' && prompt.startsWith('P3 ')
    );
    expect(prompt3Calls.length).toBeGreaterThan(0);
    return parsePrompt3Assembly(prompt3Calls[0][0]);
  }

  describe('zero name overlap + valid breakdown', () => {
    it('preserves the real Skills Engine skills instead of dropping the competency', async () => {
      mockExistingGap({ [TARGET]: REMAINING_GAP_SKILLS });
      enterUpdateMode([COMPETENCY_ERROR_HANDLING]);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        [COMPETENCY_ERROR_HANDLING]: REAL_ERROR_SKILLS
      });

      await runProcessJob();

      const breakdown = cachedBreakdown();
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).toEqual(REAL_ERROR_SKILLS);
      expect(breakdown[COMPETENCY_ERROR_HANDLING].length).toBeGreaterThan(0);

      const { initialGap, expandedBreakdown } = lastPrompt3Assembly();
      expect(initialGap.EXTRACTED_SKILLS).toEqual(expect.arrayContaining(REMAINING_GAP_SKILLS));
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual(REAL_ERROR_SKILLS);
      expect(expandedBreakdown.EXTRACTED_SKILLS.length).toBeGreaterThan(0);
      expect(expandedBreakdown.COMPLETE_COMBINED_SKILL_LIST.length).toBeGreaterThan(
        initialGap.EXTRACTED_SKILLS.length
      );
    });
  });

  describe('partial / real name overlap', () => {
    it('keeps only matching skills and does not fall back to the full breakdown', async () => {
      mockExistingGap({ [TARGET]: ['syntaxerror'] });
      enterUpdateMode(['Example']);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        Example: ['syntaxerror', 'throw statement']
      });

      await runProcessJob();

      const breakdown = cachedBreakdown();
      expect(breakdown.Example).toEqual(['syntaxerror']);
      expect(breakdown.Example).not.toContain('throw statement');

      const { expandedBreakdown } = lastPrompt3Assembly();
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual(['syntaxerror']);
      expect(expandedBreakdown.skillBreakdown.Example).toEqual(['syntaxerror']);
    });
  });

  describe('empty / unusable breakdown', () => {
    it('does not invent skills when the competency breakdown is an empty array', async () => {
      mockExistingGap({ [TARGET]: REMAINING_GAP_SKILLS });
      enterUpdateMode([COMPETENCY_ERROR_HANDLING]);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        [COMPETENCY_ERROR_HANDLING]: []
      });

      await runProcessJob();

      const breakdown = cachedBreakdown();
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).toBeUndefined();
      expect(Object.keys(breakdown)).toHaveLength(0);

      const { expandedBreakdown } = lastPrompt3Assembly();
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual([]);
    });

    it('does not invent skills when Skills Engine returns no usable competency map', async () => {
      mockExistingGap({ [TARGET]: REMAINING_GAP_SKILLS });
      enterUpdateMode([COMPETENCY_ERROR_HANDLING]);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue([]);

      await runProcessJob();

      const breakdown = cachedBreakdown();
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).toBeUndefined();
      expect(Object.keys(breakdown).filter((key) => Array.isArray(breakdown[key]) && breakdown[key].length > 0)).toHaveLength(0);

      const { expandedBreakdown } = lastPrompt3Assembly();
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual([]);
    });
  });

  describe('multiple competencies', () => {
    it('filters matching competencies and preserves zero-overlap competencies that have real SE skills', async () => {
      mockExistingGap({ [TARGET]: ['syntaxerror'] });
      enterUpdateMode([COMPETENCY_ERROR_HANDLING, COMPETENCY_ARCHITECTURE]);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        [COMPETENCY_ERROR_HANDLING]: ['syntaxerror', 'throw statement'],
        [COMPETENCY_ARCHITECTURE]: REAL_ARCHITECTURE_SKILLS
      });

      await runProcessJob();

      const breakdown = cachedBreakdown();
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).toEqual(['syntaxerror']);
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).not.toContain('throw statement');
      expect(breakdown[COMPETENCY_ARCHITECTURE]).toEqual(REAL_ARCHITECTURE_SKILLS);

      const { expandedBreakdown } = lastPrompt3Assembly();
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual(expect.arrayContaining([
        'syntaxerror',
        ...REAL_ARCHITECTURE_SKILLS
      ]));
      expect(expandedBreakdown.EXTRACTED_SKILLS).not.toContain('throw statement');
    });
  });

  describe('FULL MODE regression', () => {
    it('does not apply UPDATE MODE filtering when no existing course/expansion is present', async () => {
      mockRepository.getLearningPathById.mockResolvedValue(null);
      mockExistingGap({ [TARGET]: REMAINING_GAP_SKILLS });
      mockSkillsExpansionRepository.getLatestSkillsExpansionByUserAndGap.mockResolvedValue(null);

      mockGeminiClient.executePrompt.mockImplementation(async (prompt) => {
        if (typeof prompt === 'string' && prompt.startsWith('P1 ')) {
          return {
            expanded_competencies_list: [
              { competency_name: COMPETENCY_ERROR_HANDLING },
              { competency_name: COMPETENCY_ARCHITECTURE }
            ]
          };
        }
        if (typeof prompt === 'string' && prompt.startsWith('P2 ')) {
          return prompt2Output([COMPETENCY_ERROR_HANDLING, COMPETENCY_ARCHITECTURE]);
        }
        return VALID_PROMPT3_PATH;
      });

      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        [COMPETENCY_ERROR_HANDLING]: REAL_ERROR_SKILLS,
        [COMPETENCY_ARCHITECTURE]: REAL_ARCHITECTURE_SKILLS
      });

      await runProcessJob();

      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt2-competency-identification');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');

      const promptNames = mockGeminiClient.executePrompt.mock.calls.map(([prompt]) => {
        if (typeof prompt !== 'string') return 'unknown';
        if (prompt.startsWith('P1 ')) return 'prompt1';
        if (prompt.startsWith('P2 ')) return 'prompt2';
        if (prompt.startsWith('P3 ')) return 'prompt3';
        return 'unknown';
      });
      expect(promptNames).toEqual(expect.arrayContaining(['prompt1', 'prompt2', 'prompt3']));

      const breakdown = cachedBreakdown();
      expect(breakdown[COMPETENCY_ERROR_HANDLING]).toEqual(REAL_ERROR_SKILLS);
      expect(breakdown[COMPETENCY_ARCHITECTURE]).toEqual(REAL_ARCHITECTURE_SKILLS);

      const { initialGap, expandedBreakdown } = lastPrompt3Assembly();
      expect(initialGap.EXTRACTED_SKILLS).toEqual(expect.arrayContaining(REMAINING_GAP_SKILLS));
      expect(expandedBreakdown.EXTRACTED_SKILLS).toEqual(expect.arrayContaining([
        ...REAL_ERROR_SKILLS,
        ...REAL_ARCHITECTURE_SKILLS
      ]));
    });
  });

  describe('Prompt 3 pipeline', () => {
    it('sends current gap plus preserved real expansion into Prompt 3 assembly', async () => {
      mockExistingGap({ [TARGET]: REMAINING_GAP_SKILLS });
      enterUpdateMode([COMPETENCY_ERROR_HANDLING, COMPETENCY_ARCHITECTURE]);
      mockSkillsEngineClient.requestSkillBreakdown.mockResolvedValue({
        [COMPETENCY_ERROR_HANDLING]: REAL_ERROR_SKILLS,
        [COMPETENCY_ARCHITECTURE]: REAL_ARCHITECTURE_SKILLS
      });

      await runProcessJob();

      expect(mockPromptLoader.loadPrompt).not.toHaveBeenCalledWith('prompt1-skill-expansion');
      expect(mockPromptLoader.loadPrompt).toHaveBeenCalledWith('prompt3-path-creation');

      const { initialGap, expandedBreakdown } = lastPrompt3Assembly();
      expect(initialGap.skills_raw_data).toEqual({ [TARGET]: REMAINING_GAP_SKILLS });
      expect(initialGap.EXTRACTED_SKILLS).toEqual(expect.arrayContaining(REMAINING_GAP_SKILLS));
      expect(expandedBreakdown.skillBreakdown[COMPETENCY_ERROR_HANDLING]).toEqual(REAL_ERROR_SKILLS);
      expect(expandedBreakdown.skillBreakdown[COMPETENCY_ARCHITECTURE]).toEqual(REAL_ARCHITECTURE_SKILLS);
      expect(expandedBreakdown.EXTRACTED_SKILLS.length).toBeGreaterThan(0);
      expect(expandedBreakdown.COMPLETE_COMBINED_SKILL_LIST.length).toBeGreaterThan(
        initialGap.EXTRACTED_SKILLS.length
      );
      expect(new Set(expandedBreakdown.COMPLETE_COMBINED_SKILL_LIST)).toEqual(
        new Set([...initialGap.EXTRACTED_SKILLS, ...expandedBreakdown.EXTRACTED_SKILLS])
      );
    });
  });
});
