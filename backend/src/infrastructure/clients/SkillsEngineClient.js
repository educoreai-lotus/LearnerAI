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
   * Requests the LOWEST LAYER (nano/micro skills) for the given competencies.
   * This matches the level of the initial skills gap (nano/micro skills).
   * 
   * @param {Array} competencies - Array of competency names (strings) or objects with 'name' property
   * @param {object} options - Request options (maxRetries, retryDelay, useMockData)
   * @returns {Promise<object>} Skill breakdown with micro/nano divisions (lowest layer)
   * 
   * Response format:
   * {
   *   "Competency_Name": {
   *     "microSkills": [...],  // Lowest layer - mid level
   *     "nanoSkills": [...]    // Lowest layer - most granular
   *   }
   * }
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
        // Send simple array of competency names (strings)
        // Note: Skills Engine returns the LOWEST LAYER (nano/micro skills) by default
        // This matches the level of the initial skills gap
        const response = await this.httpClient.post(
          `${this.baseUrl}/api/skills/breakdown`,
          {
            competencies: competencyNames
            // If Skills Engine requires a parameter to specify lowest layer, add it here:
            // level: "lowest" or granularity: "nano" or depth: "full"
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
      // Extract competency name - handle both strings and objects
      const compName = typeof comp === 'string' 
        ? comp 
        : (comp.name || comp.competency_name || `Competency ${index + 1}`);
      
      breakdown[compName] = {
        microSkills: [
          { id: `micro-${index}-1`, name: `${compName} - Micro Skill 1` },
          { id: `micro-${index}-2`, name: `${compName} - Micro Skill 2` }
        ],
        nanoSkills: [
          { id: `nano-${index}-1`, name: `${compName} - Nano Skill 1` },
          { id: `nano-${index}-2`, name: `${compName} - Nano Skill 2` }
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

