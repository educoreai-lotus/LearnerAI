import { HttpClient } from './HttpClient.js';

/**
 * ManagementReportingFillClient
 * Handles communication with Management Reporting microservice using fill-fields protocol
 * Uses Stringified JSON Protocol over application/x-www-form-urlencoded
 */
export class ManagementReportingFillClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.REPORTS_URL;
    this.serviceToken = serviceToken || process.env.REPORTS_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Get rollback mock data when external request fails
   */
  getRollbackMockData(payload) {
    if (payload.hasOwnProperty('company_id')) {
      return {
        company_id: payload.company_id || '',
        company_name: payload.company_name || 'Unknown Company',
        decision_maker_policy: payload.decision_maker_policy || 'auto',
        courses_count: payload.courses_count !== undefined ? payload.courses_count : 0,
        approved_courses_count: payload.approved_courses_count !== undefined ? payload.approved_courses_count : 0
      };
    } else if (payload.hasOwnProperty('user_id')) {
      return {
        user_id: payload.user_id || '',
        courses_count: payload.courses_count !== undefined ? payload.courses_count : 0,
        approved_courses_count: payload.approved_courses_count !== undefined ? payload.approved_courses_count : 0
      };
    }
    
    return { ...payload };
  }

  /**
   * Send request to Management Reporting microservice using fill-fields protocol
   */
  async sendRequest(payload) {
    if (!this.baseUrl) {
      console.warn('[ManagementReportingFillClient] Reports URL not configured, using rollback mock data');
      return this.getRollbackMockData(payload);
    }

    const endpoint = `${this.baseUrl}/api/fill-reports-fields`;

    try {
      if (typeof payload !== 'object' || payload === null) {
        console.warn('[ManagementReportingFillClient] Invalid payload, using rollback mock data');
        return this.getRollbackMockData(payload || {});
      }

      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
      } catch (stringifyError) {
        console.warn('[ManagementReportingFillClient] Failed to stringify payload, using rollback mock data');
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
        console.warn('[ManagementReportingFillClient] Reports returned invalid response structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (!response.data.payload || typeof response.data.payload !== 'string') {
        console.warn('[ManagementReportingFillClient] Reports response missing or invalid payload field, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      let responsePayload;
      try {
        responsePayload = JSON.parse(response.data.payload);
      } catch (parseError) {
        console.warn('[ManagementReportingFillClient] Failed to parse payload from Reports response, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (typeof responsePayload !== 'object' || responsePayload === null) {
        console.warn('[ManagementReportingFillClient] Reports returned invalid payload structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      return responsePayload;
    } catch (error) {
      console.warn('[ManagementReportingFillClient] External request failed, using rollback mock data instead', {
        error: error.message,
        endpoint
      });
      return this.getRollbackMockData(payload);
    }
  }

  /**
   * Fetch company reporting data from Management Reporting
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company reporting data with filled fields
   */
  async fetchCompanyReportingData(companyId) {
    if (!companyId || typeof companyId !== 'string') {
      throw new Error('companyId must be a non-empty string');
    }

    const payload = {
      company_id: companyId,
      company_name: '',
      decision_maker_policy: null,
      courses_count: null,
      approved_courses_count: null
    };

    return await this.sendRequest(payload);
  }

  /**
   * Fetch user reporting data from Management Reporting
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User reporting data with filled fields
   */
  async fetchUserReportingData(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    const payload = {
      user_id: userId,
      courses_count: null,
      approved_courses_count: null
    };

    return await this.sendRequest(payload);
  }
}

