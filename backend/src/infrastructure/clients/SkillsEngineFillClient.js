import { HttpClient } from './HttpClient.js';

/**
 * SkillsEngineFillClient
 * Handles communication with Skills Engine microservice using fill-fields protocol
 * Uses Stringified JSON Protocol over application/x-www-form-urlencoded
 * 
 * Protocol:
 * - Request: POST with serviceName="LearnerAI" and payload=JSON.stringify(object)
 * - Response: { serviceName: "LearnerAI", payload: "<stringified JSON>" }
 */
export class SkillsEngineFillClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.SKILLS_ENGINE_URL;
    this.serviceToken = serviceToken || process.env.SKILLS_ENGINE_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    
    if (this.baseUrl) {
      // Remove trailing slash if present
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Get rollback mock data when external request fails
   * @param {Object} payload - Original payload sent to Skills Engine
   * @returns {Object} Mock data matching expected structure
   */
  getRollbackMockData(payload) {
    // Determine request type based on payload structure
    if (payload.hasOwnProperty('competency_target_name')) {
      // Learning path/competency data rollback
      return {
        competency_target_name: payload.competency_target_name || '',
        learning_path: payload.learning_path || null,
        approved: payload.approved !== undefined ? payload.approved : false,
        user_id: payload.user_id || ''
      };
    } else if (payload.hasOwnProperty('user_id') && payload.hasOwnProperty('competency_target_name')) {
      // Skills gap data rollback
      return {
        user_id: payload.user_id || '',
        competency_target_name: payload.competency_target_name || '',
        gap_id: payload.gap_id || null,
        skills_raw_data: payload.skills_raw_data || null,
        exam_status: payload.exam_status || null
      };
    }
    
    // Generic fallback
    return {
      ...payload,
      learning_path: payload.learning_path || null,
      skills_raw_data: payload.skills_raw_data || null
    };
  }

  /**
   * Send request to Skills Engine microservice using fill-fields protocol
   * @param {Object} payload - Payload object to send
   * @returns {Promise<Object>} Parsed response from Skills Engine or rollback mock data
   */
  async sendRequest(payload) {
    // If baseUrl is not configured, return rollback immediately
    if (!this.baseUrl) {
      console.warn('[SkillsEngineFillClient] Skills Engine URL not configured, using rollback mock data');
      return this.getRollbackMockData(payload);
    }

    const endpoint = `${this.baseUrl}/api/fill-skills-engine-fields`;

    try {
      // Validate payload
      if (typeof payload !== 'object' || payload === null) {
        console.warn('[SkillsEngineFillClient] Invalid payload, using rollback mock data');
        return this.getRollbackMockData(payload || {});
      }

      // Convert payload to JSON string
      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
      } catch (stringifyError) {
        console.warn('[SkillsEngineFillClient] Failed to stringify payload, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Build request body using URLSearchParams
      const body = new URLSearchParams({
        serviceName: 'LearnerAI',
        payload: payloadString
      }).toString();

      // Send POST request
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      if (this.serviceToken) {
        headers['Authorization'] = `Bearer ${this.serviceToken}`;
      }
      
      const response = await this.httpClient.post(endpoint, body, { headers });

      // Validate response structure
      if (!response.data || typeof response.data !== 'object' || response.data === null) {
        console.warn('[SkillsEngineFillClient] Skills Engine returned invalid response structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (!response.data.payload || typeof response.data.payload !== 'string') {
        console.warn('[SkillsEngineFillClient] Skills Engine response missing or invalid payload field, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Parse payload string
      let responsePayload;
      try {
        responsePayload = JSON.parse(response.data.payload);
      } catch (parseError) {
        console.warn('[SkillsEngineFillClient] Failed to parse payload from Skills Engine response, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Validate that parsed payload is an object
      if (typeof responsePayload !== 'object' || responsePayload === null) {
        console.warn('[SkillsEngineFillClient] Skills Engine returned invalid payload structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      return responsePayload;
    } catch (error) {
      // All errors result in rollback
      console.warn('[SkillsEngineFillClient] External request failed, using rollback mock data instead', {
        error: error.message,
        endpoint
      });
      return this.getRollbackMockData(payload);
    }
  }

  /**
   * Fetch learning path data from Skills Engine
   * @param {string} competencyTargetName - Competency target name
   * @returns {Promise<Object>} Learning path data with filled fields
   */
  async fetchLearningPathData(competencyTargetName) {
    if (!competencyTargetName || typeof competencyTargetName !== 'string') {
      throw new Error('competencyTargetName must be a non-empty string');
    }

    // Build payload object with null/empty fields
    const payload = {
      competency_target_name: competencyTargetName,
      learning_path: null,
      approved: null,
      user_id: ''
    };

    // Send request to Skills Engine
    return await this.sendRequest(payload);
  }

  /**
   * Fetch skills gap data from Skills Engine
   * @param {string} userId - User ID
   * @param {string} competencyTargetName - Competency target name
   * @returns {Promise<Object>} Skills gap data with filled fields
   */
  async fetchSkillsGapData(userId, competencyTargetName) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }
    if (!competencyTargetName || typeof competencyTargetName !== 'string') {
      throw new Error('competencyTargetName must be a non-empty string');
    }

    // Build payload object with null/empty fields
    const payload = {
      user_id: userId,
      competency_target_name: competencyTargetName,
      gap_id: null,
      skills_raw_data: null,
      exam_status: null
    };

    // Send request to Skills Engine
    return await this.sendRequest(payload);
  }
}

