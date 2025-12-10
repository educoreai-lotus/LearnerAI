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
   * Explicitly requests the LOWEST LEVEL skills for the given competencies,
   * including expansions competencies. This matches the level of the initial skills gap.
   * 
   * @param {Array} competencies - Array of competency names (strings) or objects with 'name' property
   * @param {object} options - Request options (maxRetries, retryDelay, useMockData, includeExpansions)
   * @param {boolean} options.includeExpansions - Whether to include expansions competencies (default: true)
   * @returns {Promise<object>} Skill breakdown with lowest level skills (list of skills at the lowest level in Skills Engine hierarchy)
   * 
   * Response format:
   * {
   *   "Competency_Name": {
   *     "skills": [...]  // List of skills at the lowest level in Skills Engine hierarchy
   *   }
   * }
   */
  async requestSkillBreakdown(competencies, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useMockData = false,
      includeExpansions = true // Default to true: always request lowest layer (expansions)
    } = options;

    if (useMockData) {
      return this._getMockSkillBreakdown(competencies);
    }

    // Extract competency names - handle both string arrays and object arrays
    const competencyNames = competencies.map(comp => {
      if (typeof comp === 'string') {
        return comp;
      }
      // If it's an object, extract the name
      return comp.name || comp.competency_name || String(comp);
    });

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Explicitly request the lowest level skills (expansions competencies) from Skills Engine
        // This ensures we get the list of skills at the lowest level in Skills Engine hierarchy for each competency
        const requestBody = {
          competencies: competencyNames,
          // Explicitly request lowest level skills (expansions competencies)
          level: "lowest",           // Request lowest level in hierarchy
          include_expansions: includeExpansions,  // Include expansions competencies
          granularity: "lowest"     // Request lowest level granularity
        };

        console.log(`📤 Requesting skill breakdown for ${competencyNames.length} competencies (lowest level/expansions: ${includeExpansions})`);

        const response = await this.httpClient.post(
          `${this.baseUrl}/api/skills/breakdown`,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.serviceToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ Skills Engine returned breakdown for ${Object.keys(response.data || {}).length} competencies`);
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
   * Returns a list of skills at the lowest level for each competency
   */
  _getMockSkillBreakdown(competencies) {
    const breakdown = {};
    competencies.forEach((comp, index) => {
      // Extract competency name - handle both strings and objects
      const compName = typeof comp === 'string' 
        ? comp 
        : (comp.name || comp.competency_name || `Competency ${index + 1}`);
      
      // Return list of skills at the lowest level (not categorized as micro/nano)
      breakdown[compName] = {
        skills: [
          { id: `skill-${index}-1`, name: `${compName} - Skill 1` },
          { id: `skill-${index}-2`, name: `${compName} - Skill 2` },
          { id: `skill-${index}-3`, name: `${compName} - Skill 3` }
        ]
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

