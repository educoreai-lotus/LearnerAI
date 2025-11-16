import { HttpClient } from './HttpClient.js';

/**
 * LearningAnalyticsFillClient
 * Handles communication with Learning Analytics microservice using fill-fields protocol
 * Uses Stringified JSON Protocol over application/x-www-form-urlencoded
 */
export class LearningAnalyticsFillClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.ANALYTICS_URL;
    this.serviceToken = serviceToken || process.env.ANALYTICS_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Get rollback mock data when external request fails
   */
  getRollbackMockData(payload) {
    if (payload.hasOwnProperty('user_id') && payload.hasOwnProperty('competency_target_name')) {
      // Analytics data rollback
      return {
        user_id: payload.user_id || '',
        competency_target_name: payload.competency_target_name || '',
        learning_path: payload.learning_path || null,
        gap_id: payload.gap_id || null,
        skills_raw_data: payload.skills_raw_data || null,
        exam_status: payload.exam_status || null,
        approved: payload.approved !== undefined ? payload.approved : false
      };
    }
    
    return { ...payload };
  }

  /**
   * Send request to Learning Analytics microservice using fill-fields protocol
   */
  async sendRequest(payload) {
    if (!this.baseUrl) {
      console.warn('[LearningAnalyticsFillClient] Analytics URL not configured, using rollback mock data');
      return this.getRollbackMockData(payload);
    }

    const endpoint = `${this.baseUrl}/api/fill-analytics-fields`;

    try {
      if (typeof payload !== 'object' || payload === null) {
        console.warn('[LearningAnalyticsFillClient] Invalid payload, using rollback mock data');
        return this.getRollbackMockData(payload || {});
      }

      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
      } catch (stringifyError) {
        console.warn('[LearningAnalyticsFillClient] Failed to stringify payload, using rollback mock data');
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
        console.warn('[LearningAnalyticsFillClient] Analytics returned invalid response structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (!response.data.payload || typeof response.data.payload !== 'string') {
        console.warn('[LearningAnalyticsFillClient] Analytics response missing or invalid payload field, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      let responsePayload;
      try {
        responsePayload = JSON.parse(response.data.payload);
      } catch (parseError) {
        console.warn('[LearningAnalyticsFillClient] Failed to parse payload from Analytics response, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (typeof responsePayload !== 'object' || responsePayload === null) {
        console.warn('[LearningAnalyticsFillClient] Analytics returned invalid payload structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      return responsePayload;
    } catch (error) {
      console.warn('[LearningAnalyticsFillClient] External request failed, using rollback mock data instead', {
        error: error.message,
        endpoint
      });
      return this.getRollbackMockData(payload);
    }
  }

  /**
   * Fetch analytics data from Learning Analytics
   * @param {string} userId - User ID
   * @param {string} competencyTargetName - Competency target name
   * @returns {Promise<Object>} Analytics data with filled fields
   */
  async fetchAnalyticsData(userId, competencyTargetName) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }
    if (!competencyTargetName || typeof competencyTargetName !== 'string') {
      throw new Error('competencyTargetName must be a non-empty string');
    }

    const payload = {
      user_id: userId,
      competency_target_name: competencyTargetName,
      learning_path: null,
      gap_id: null,
      skills_raw_data: null,
      exam_status: null,
      approved: null
    };

    return await this.sendRequest(payload);
  }
}

