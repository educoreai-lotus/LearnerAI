/**
 * SkillsEngineClient
 * Handles communication with the Skills Engine microservice via Coordinator
 */
export class SkillsEngineClient {
  constructor({ baseUrl, serviceToken, httpClient, coordinatorClient }) {
    this.baseUrl = baseUrl;
    this.serviceToken = serviceToken;
    this.httpClient = httpClient;
    this.coordinatorClient = coordinatorClient || null;
  }

  /**
   * Request skill breakdown for competencies
   * Explicitly requests the LOWEST LEVEL skills for the given competencies.
   * This matches the level of the initial skills gap.
   * 
   * @param {Array} competencies - Array of competency names (strings) or objects with 'name' property
   * @param {object} options - Request options (maxRetries, retryDelay, useMockData, includeExpansions)
   * @param {boolean} options.includeExpansions - Whether to include expansions competencies (default: true)
   * @returns {Promise<object>} Skill breakdown with lowest level skills (array of skill names per competency)
   * 
   * Response format:
   * {
   *   "Competency_Name": [
   *     "Skill Name 1",
   *     "Skill Name 2",
   *     "Skill Name 3"
   *   ]
   * }
   * 
   * Note: Returns only skill names (strings) in the lowest layer - no IDs, no micro/nano separation
   */
  async requestSkillBreakdown(competencies, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useMockData = false,
      includeExpansions = true, // Default to true: always request lowest layer (expansions)
      timeoutMs = 300000 // Default 5 minutes (300000ms) for Skills Engine breakdown requests
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

    // Use Coordinator if available, otherwise fallback to direct HTTP
    if (this.coordinatorClient && this.coordinatorClient.isConfigured()) {
      return this._requestViaCoordinator(competencyNames, { ...options, timeoutMs });
    } else {
      // Fallback to direct HTTP if Coordinator not configured
      console.warn('⚠️  Coordinator not configured, using direct HTTP call to Skills Engine');
      return this._requestDirect(competencyNames, { ...options, timeoutMs });
    }
  }

  /**
   * Request skill breakdown via Coordinator
   * @private
   */
  async _requestViaCoordinator(competencyNames, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useMockData = false,
      timeoutMs = 300000 // Default 5 minutes for Skills Engine requests
    } = options;

    if (useMockData) {
      return this._getMockSkillBreakdown(competencyNames.map(c => typeof c === 'string' ? c : (c.name || c.competency_name || String(c))));
    }

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build payload in Coordinator format
        const coordinatorPayload = {
          requester_service: "learnerAI",
          payload: {
            action: "request_skills_breakdown",
            description: "request skills in the lowest layer of the sended competences",
            competencies: competencyNames
          },
          response: {}
        };

        console.log(`📤 Requesting skill breakdown via Coordinator for ${competencyNames.length} competencies (lowest level)`);
        console.log(`   Competencies: ${competencyNames.join(', ')}`);
        console.log(`   Timeout: ${timeoutMs}ms (${Math.round(timeoutMs / 1000)}s)`);

        const response = await this.coordinatorClient.postFillContentMetrics(coordinatorPayload, { timeoutMs });

        // DEBUG: Log full response structure to understand Coordinator format
        console.log(`🔍 [COORDINATOR RESPONSE DEBUG]`);
        console.log(`   Response type: ${typeof response}`);
        console.log(`   Response keys: ${response && typeof response === 'object' ? Object.keys(response).join(', ') : 'N/A'}`);
        if (response && response.response) {
          console.log(`   response.response keys: ${Object.keys(response.response).join(', ')}`);
          if (response.response.answer) {
            console.log(`   response.response.answer type: ${typeof response.response.answer}`);
            console.log(`   response.response.answer preview: ${typeof response.response.answer === 'string' ? response.response.answer.substring(0, 500) : JSON.stringify(response.response.answer).substring(0, 500)}`);
          }
        }
        console.log(`   Full response: ${JSON.stringify(response, null, 2).substring(0, 2000)}`);

        // Extract the breakdown from Coordinator response
        // Coordinator response format: { requester_service, payload, response: { answer: <data> } }
        let breakdown = null;
        
        // Check if response has nested structure
        if (response && response.response && response.response.answer) {
          // Coordinator returns data in response.answer
          const answerData = response.response.answer;
          console.log(`   📋 Attempting to parse response.response.answer...`);
          console.log(`   answerData type: ${typeof answerData}`);
          console.log(`   answerData preview: ${typeof answerData === 'string' ? answerData.substring(0, 500) : JSON.stringify(answerData).substring(0, 500)}`);
          
          try {
            breakdown = typeof answerData === 'string' ? JSON.parse(answerData) : answerData;
            console.log(`   ✅ Parsed breakdown from response.response.answer`);
            console.log(`   Breakdown type: ${typeof breakdown}`);
            console.log(`   Breakdown keys: ${breakdown && typeof breakdown === 'object' ? Object.keys(breakdown).join(', ') : 'N/A'}`);
            
            // Check if breakdown is nested (e.g., { data: {...} } or { payload: {...} })
            if (breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown)) {
              // If it has 'data' field, try that
              if (breakdown.data && typeof breakdown.data === 'object') {
                console.log(`   🔍 Found nested 'data' field, using that as breakdown`);
                breakdown = breakdown.data;
              }
              // If it has 'payload' field, try that
              else if (breakdown.payload && typeof breakdown.payload === 'object') {
                const payloadData = typeof breakdown.payload === 'string' ? JSON.parse(breakdown.payload) : breakdown.payload;
                // Check if payload is the request (has action) or the breakdown
                if (payloadData && !payloadData.action && !payloadData.description) {
                  console.log(`   🔍 Found nested 'payload' field without action/description, using as breakdown`);
                  breakdown = payloadData;
                }
              }
              // If it has 'response' field with nested data
              else if (breakdown.response && breakdown.response.data) {
                console.log(`   🔍 Found nested 'response.data' field, using that as breakdown`);
                breakdown = breakdown.response.data;
              }
            }
          } catch (parseError) {
            console.error(`   ❌ Failed to parse answerData: ${parseError.message}`);
            // Try to extract from nested structure if answer is an object
            if (typeof answerData === 'object' && answerData.data) {
              breakdown = answerData.data;
              console.log(`   ✅ Found breakdown in answerData.data`);
            } else if (typeof answerData === 'object' && answerData.payload) {
              breakdown = typeof answerData.payload === 'string' ? JSON.parse(answerData.payload) : answerData.payload;
              console.log(`   ✅ Found breakdown in answerData.payload`);
            }
          }
        } else if (response && response.data) {
          breakdown = response.data;
          console.log(`   ✅ Found breakdown in response.data`);
        } else if (response && response.payload) {
          // Check if payload is the request (has action/description) or the actual breakdown
          const payloadData = typeof response.payload === 'string' ? JSON.parse(response.payload) : response.payload;
          
          // If payload has 'action' or 'description', it's the request, not the breakdown
          if (payloadData && (payloadData.action || payloadData.description)) {
            console.warn(`   ⚠️ Response.payload contains request data, not breakdown. Looking for breakdown elsewhere...`);
            // Try to find breakdown in other fields
            if (response.response && response.response.data) {
              breakdown = typeof response.response.data === 'string' ? JSON.parse(response.response.data) : response.response.data;
              console.log(`   ✅ Found breakdown in response.response.data`);
            } else {
              // Last resort: check if response itself is the breakdown (object with competency keys, no action/description)
              const responseKeys = Object.keys(response);
              const hasCompetencyStructure = responseKeys.some(key => 
                Array.isArray(response[key]) && response[key].length > 0 && typeof response[key][0] === 'string'
              );
              if (hasCompetencyStructure && !response.action && !response.description) {
                breakdown = response;
                console.log(`   ✅ Using response directly as breakdown (has competency structure)`);
              } else {
                throw new Error(`Response payload contains request data, not breakdown. Full response: ${JSON.stringify(response).substring(0, 500)}`);
              }
            }
          } else {
            // Payload is the breakdown
            breakdown = payloadData;
            console.log(`   ✅ Found breakdown in response.payload`);
          }
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
          // Check if response itself is the breakdown (object with competency keys, no action/description)
          const hasActionOrDescription = response.action || response.description;
          const hasCompetencyStructure = Object.keys(response).some(key => 
            Array.isArray(response[key]) && response[key].length > 0 && typeof response[key][0] === 'string'
          );
          
          if (!hasActionOrDescription && hasCompetencyStructure) {
            breakdown = response;
            console.log(`   ✅ Using response directly as breakdown (has competency structure, no action/description)`);
          } else if (hasActionOrDescription) {
            throw new Error(`Response contains request data (action/description), not breakdown. Full response: ${JSON.stringify(response).substring(0, 500)}`);
          }
        }

        if (breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown)) {
          // Validate breakdown structure: should have competency names as keys with arrays of skills
          const breakdownKeys = Object.keys(breakdown);
          console.log(`   🔍 Validating breakdown structure...`);
          console.log(`   Breakdown keys: ${breakdownKeys.join(', ')}`);
          
          const isValidBreakdown = breakdownKeys.some(key => 
            Array.isArray(breakdown[key]) && breakdown[key].length > 0
          );
          
          if (isValidBreakdown) {
            // Log sample of breakdown to verify it's not mock data
            const sampleKey = breakdownKeys[0];
            const sampleSkills = breakdown[sampleKey];
            console.log(`   ✅ Valid breakdown structure found`);
            console.log(`   Sample competency "${sampleKey}": ${sampleSkills.length} skills`);
            console.log(`   Sample skills: ${JSON.stringify(sampleSkills.slice(0, 3))}`);
            
            // Check if it's mock data (has "- Skill 1" pattern)
            const isMockData = sampleSkills.some(skill => 
              typeof skill === 'string' && skill.includes(' - Skill ')
            );
            if (isMockData) {
              console.warn(`   ⚠️ WARNING: Breakdown appears to be mock data (contains "- Skill " pattern)`);
              console.warn(`   This means Skills Engine did not return actual breakdown. Check Coordinator/Skills Engine integration.`);
            }
            
            console.log(`✅ Skills Engine returned breakdown via Coordinator for ${breakdownKeys.length} competencies`);
            return breakdown;
          } else {
            console.error(`   ❌ Invalid breakdown structure: keys don't contain skill arrays`);
            breakdownKeys.forEach(key => {
              console.error(`   Key "${key}": ${typeof breakdown[key]}, isArray: ${Array.isArray(breakdown[key])}, length: ${Array.isArray(breakdown[key]) ? breakdown[key].length : 'N/A'}`);
            });
            throw new Error(`Invalid breakdown structure: keys don't contain skill arrays. Keys: ${breakdownKeys.join(', ')}`);
          }
        } else {
          console.error(`   ❌ Breakdown is null or not an object`);
          console.error(`   Breakdown type: ${typeof breakdown}, isArray: ${Array.isArray(breakdown)}`);
          throw new Error(`Invalid response format from Coordinator: ${JSON.stringify(response).substring(0, 500)}`);
        }
      } catch (error) {
        lastError = error;
        console.warn(`Skills Engine request via Coordinator attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }

    // Fallback to mock data if all retries fail
    console.warn('Skills Engine unavailable via Coordinator, using mock data');
    return this._getMockSkillBreakdown(competencyNames.map(c => typeof c === 'string' ? c : (c.name || c.competency_name || String(c))));
  }

  /**
   * Request skill breakdown via direct HTTP (fallback)
   * @private
   */
  async _requestDirect(competencyNames, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useMockData = false,
      includeExpansions = true
    } = options;

    if (useMockData) {
      return this._getMockSkillBreakdown(competencyNames.map(c => typeof c === 'string' ? c : (c.name || c.competency_name || String(c))));
    }

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

        console.log(`📤 Requesting skill breakdown directly for ${competencyNames.length} competencies (lowest level/expansions: ${includeExpansions})`);

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
    return this._getMockSkillBreakdown(competencyNames.map(c => typeof c === 'string' ? c : (c.name || c.competency_name || String(c))));
  }

  /**
   * Get mock skill breakdown (fallback)
   * Returns a list of skill names at the lowest level for each competency
   * Format: { "Competency_Name": ["Skill Name 1", "Skill Name 2", ...] }
   */
  _getMockSkillBreakdown(competencies) {
    const breakdown = {};
    competencies.forEach((comp, index) => {
      // Extract competency name - handle both strings and objects
      const compName = typeof comp === 'string' 
        ? comp 
        : (comp.name || comp.competency_name || `Competency ${index + 1}`);
      
      // Return array of skill names at the lowest level (no IDs, no micro/nano separation)
      breakdown[compName] = [
        `${compName} - Skill 1`,
        `${compName} - Skill 2`,
        `${compName} - Skill 3`
      ];
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

