import { HttpClient } from './HttpClient.js';

/**
 * CourseBuilderFillClient
 * Handles communication with Course Builder microservice using fill-fields protocol
 * Uses Stringified JSON Protocol over application/x-www-form-urlencoded
 */
export class CourseBuilderFillClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.COURSE_BUILDER_URL;
    this.serviceToken = serviceToken || process.env.COURSE_BUILDER_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Get rollback mock data when external request fails
   */
  getRollbackMockData(payload) {
    if (payload.hasOwnProperty('competency_target_name')) {
      return {
        competency_target_name: payload.competency_target_name || '',
        learning_path: payload.learning_path || null,
        user_id: payload.user_id || '',
        user_name: payload.user_name || '',
        company_id: payload.company_id || '',
        company_name: payload.company_name || '',
        approved: payload.approved !== undefined ? payload.approved : false
      };
    }
    
    return { ...payload };
  }

  /**
   * Send request to Course Builder microservice using fill-fields protocol
   */
  async sendRequest(payload) {
    if (!this.baseUrl) {
      console.warn('[CourseBuilderFillClient] Course Builder URL not configured, using rollback mock data');
      return this.getRollbackMockData(payload);
    }

    const endpoint = `${this.baseUrl}/api/fill-course-builder-fields`;

    try {
      if (typeof payload !== 'object' || payload === null) {
        console.warn('[CourseBuilderFillClient] Invalid payload, using rollback mock data');
        return this.getRollbackMockData(payload || {});
      }

      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
      } catch (stringifyError) {
        console.warn('[CourseBuilderFillClient] Failed to stringify payload, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      const body = new URLSearchParams({
        serviceName: 'LearnerAI',
        payload: payloadString
      }).toString();

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      if (this.serviceToken) {
        headers['Authorization'] = `Bearer ${this.serviceToken}`;
      }
      
      const response = await this.httpClient.post(endpoint, body, { headers });

      if (!response.data || typeof response.data !== 'object' || response.data === null) {
        console.warn('[CourseBuilderFillClient] Course Builder returned invalid response structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (!response.data.payload || typeof response.data.payload !== 'string') {
        console.warn('[CourseBuilderFillClient] Course Builder response missing or invalid payload field, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      let responsePayload;
      try {
        responsePayload = JSON.parse(response.data.payload);
      } catch (parseError) {
        console.warn('[CourseBuilderFillClient] Failed to parse payload from Course Builder response, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (typeof responsePayload !== 'object' || responsePayload === null) {
        console.warn('[CourseBuilderFillClient] Course Builder returned invalid payload structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      return responsePayload;
    } catch (error) {
      console.warn('[CourseBuilderFillClient] External request failed, using rollback mock data instead', {
        error: error.message,
        endpoint
      });
      return this.getRollbackMockData(payload);
    }
  }

  /**
   * Fetch course data from Course Builder
   * @param {string} competencyTargetName - Competency target name
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Course data with filled fields
   */
  async fetchCourseData(competencyTargetName, userId = null) {
    if (!competencyTargetName || typeof competencyTargetName !== 'string') {
      throw new Error('competencyTargetName must be a non-empty string');
    }

    const payload = {
      competency_target_name: competencyTargetName,
      learning_path: null,
      user_id: userId || '',
      user_name: '',
      company_id: '',
      company_name: '',
      approved: null
    };

    return await this.sendRequest(payload);
  }
}

