/**
 * SkillsEngineClient
 * Handles communication with the Skills Engine microservice
 */
export class SkillsEngineClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl;
    this.serviceToken = serviceToken;
    this.httpClient = httpClient;
  }

  /**
   * Request skill breakdown for competencies
   * @param {Array} competencies - Array of competency objects (may include queryTemplate/exampleQuery from Prompt 2)
   * @returns {Promise<object>} Skill breakdown with micro/nano divisions
   */
  async requestSkillBreakdown(competencies, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useMockData = false
    } = options;

    if (useMockData) {
      return this._getMockSkillBreakdown(competencies);
    }

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // If competencies have exampleQuery from Prompt 2, use those queries
        const requestBody = competencies.map(comp => {
          if (comp.exampleQuery) {
            // Use the standardized query from Prompt 2
            return {
              query: comp.exampleQuery,
              competency_name: comp.name,
              target_level: comp.targetLevel,
              source_type: comp.sourceType
            };
          } else {
            // Fallback to simple format
            return {
              competency_name: comp.name,
              target_level: comp.targetLevel || 'Intermediate',
              description: comp.description || ''
            };
          }
        });

        const response = await this.httpClient.post(
          `${this.baseUrl}/api/skills/breakdown`,
          {
            competencies: requestBody,
            query_template: competencies[0]?.queryTemplate || null
          },
          {
            headers: {
              'Authorization': `Bearer ${this.serviceToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return response.data;
      } catch (error) {
        lastError = error;
        console.warn(`Skills Engine request attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }

    // Fallback to mock data if all retries fail
    console.warn('Skills Engine unavailable, using mock data');
    return this._getMockSkillBreakdown(competencies);
  }

  /**
   * Get mock skill breakdown (fallback)
   */
  _getMockSkillBreakdown(competencies) {
    const breakdown = {};
    competencies.forEach((comp, index) => {
      const compName = comp.name || comp.competency_name || `Competency ${index + 1}`;
      breakdown[compName] = {
        microSkills: [
          { id: `micro-${index}-1`, name: `${compName} - Micro Skill 1` },
          { id: `micro-${index}-2`, name: `${compName} - Micro Skill 2` }
        ],
        nanoSkills: [
          { id: `nano-${index}-1`, name: `${compName} - Nano Skill 1` },
          { id: `nano-${index}-2`, name: `${compName} - Nano Skill 2` }
        ],
        targetLevel: comp.targetLevel || comp.target_level || 'Intermediate',
        sourceType: comp.sourceType || comp.source_type || 'Out-of-the-Box'
      };
    });
    return breakdown;
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

