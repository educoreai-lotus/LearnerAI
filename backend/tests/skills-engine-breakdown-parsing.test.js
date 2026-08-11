import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SkillsEngineClient } from '../src/infrastructure/clients/SkillsEngineClient.js';

const COMPETENCY_A = 'JavaScript Error Handling, Debugging, and Resilient Code Development';
const REAL_SKILL = { skill_id: '1', skill_name: 'Skill A' };

function realCompetencyMap() {
  return {
    [COMPETENCY_A]: [REAL_SKILL]
  };
}

describe('SkillsEngineClient Coordinator breakdown parsing', () => {
  let client;
  let mockCoordinatorClient;

  beforeEach(() => {
    mockCoordinatorClient = {
      isConfigured: jest.fn(() => true),
      postFillContentMetrics: jest.fn()
    };

    client = new SkillsEngineClient({
      coordinatorClient: mockCoordinatorClient
    });
  });

  it('extracts response.response.competencies from the live Coordinator envelope on attempt 1', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      requester_service: 'learnerAI',
      payload: {
        action: 'request_skills_breakdown',
        description: 'request skills in the lowest layer of the sended competences',
        competencies: [COMPETENCY_A]
      },
      response: {
        competencies: realCompetencyMap()
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(result).toEqual(realCompetencyMap());
    expect(result[COMPETENCY_A][0]).toEqual(REAL_SKILL);
    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
    expect(result[COMPETENCY_A][0].skill_name).not.toMatch(/variables and scoping|Skill 1/);
    expect(mockCoordinatorClient.postFillContentMetrics.mock.calls[0][0]).toMatchObject({
      requester_service: 'learnerAI',
      payload: {
        action: 'request_skills_breakdown',
        competencies: [COMPETENCY_A]
      }
    });
  });

  it('unwraps a direct competencies wrapper', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      competencies: realCompetencyMap()
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(result).toEqual(realCompetencyMap());
    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
  });

  it('still accepts legacy response.response.answer competency map', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      response: {
        answer: JSON.stringify(realCompetencyMap())
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(result).toEqual(realCompetencyMap());
    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
  });

  it('still accepts legacy response.response.answer with competencies wrapper', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      response: {
        answer: { competencies: realCompetencyMap() }
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(result).toEqual(realCompetencyMap());
    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(1);
  });

  it('treats request-echo-only envelopes as failure and falls back to mock', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      requester_service: 'learnerAI',
      payload: {
        action: 'request_skills_breakdown',
        description: 'request skills in the lowest layer of the sended competences'
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(3);
    expect(result[COMPETENCY_A]).toBeDefined();
    expect(Array.isArray(result[COMPETENCY_A])).toBe(true);
    expect(result[COMPETENCY_A].some((s) => s === 'Skill A' || s?.skill_name === 'Skill A')).toBe(false);
  });

  it('retries on Coordinator HTTP failure and mocks after the last attempt', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockRejectedValue(
      new Error('Coordinator responded 502: bad gateway')
    );

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(3);
    expect(result[COMPETENCY_A]).toBeDefined();
    expect(result[COMPETENCY_A].some((s) => s === 'Skill A' || s?.skill_name === 'Skill A')).toBe(false);
  });

  it('does not silently accept malformed response.competencies', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      payload: {
        action: 'request_skills_breakdown',
        description: '...'
      },
      response: {
        competencies: {
          [COMPETENCY_A]: []
        }
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(mockCoordinatorClient.postFillContentMetrics).toHaveBeenCalledTimes(3);
    expect(result[COMPETENCY_A]?.[0]?.skill_name).not.toBe('Skill A');
  });

  it('returns skill objects with skill_id and skill_name for downstream normalization', async () => {
    mockCoordinatorClient.postFillContentMetrics.mockResolvedValue({
      payload: {
        action: 'request_skills_breakdown',
        description: '...'
      },
      response: {
        competencies: {
          [COMPETENCY_A]: [{ skill_id: 'abc', skill_name: 'aggregateerror' }]
        }
      }
    });

    const result = await client.requestSkillBreakdown([COMPETENCY_A], {
      maxRetries: 3,
      retryDelay: 1
    });

    expect(result[COMPETENCY_A]).toEqual([{ skill_id: 'abc', skill_name: 'aggregateerror' }]);
  });
});
