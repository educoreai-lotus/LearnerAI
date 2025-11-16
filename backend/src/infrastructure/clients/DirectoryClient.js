import { HttpClient } from './HttpClient.js';

/**
 * DirectoryClient
 * Handles communication with Directory microservice using fill-fields protocol
 * Uses Stringified JSON Protocol over application/x-www-form-urlencoded
 * 
 * Protocol:
 * - Request: POST with serviceName="LearnerAI" and payload=JSON.stringify(object)
 * - Response: { serviceName: "LearnerAI", payload: "<stringified JSON>" }
 */
export class DirectoryClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.DIRECTORY_URL;
    this.serviceToken = serviceToken || process.env.DIRECTORY_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    
    if (this.baseUrl) {
      // Remove trailing slash if present
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Get rollback mock data when external request fails
   * @param {Object} payload - Original payload sent to Directory
   * @returns {Object} Mock data matching expected structure
   */
  getRollbackMockData(payload) {
    // Determine request type based on payload structure
    if (payload.hasOwnProperty('company_id')) {
      // Company data rollback
      return {
        company_id: payload.company_id || 'unknown',
        company_name: payload.company_name || 'Unknown Company',
        decision_maker_policy: payload.decision_maker_policy || 'auto',
        decision_maker: payload.decision_maker || null
      };
    } else if (payload.hasOwnProperty('user_id')) {
      // Learner data rollback
      return {
        user_id: payload.user_id || 'unknown',
        user_name: payload.user_name || 'Unknown User',
        company_id: payload.company_id || '',
        company_name: payload.company_name || ''
      };
    }
    
    // Generic fallback - return payload with default values
    return {
      ...payload,
      company_name: payload.company_name || 'Unknown Company',
      user_name: payload.user_name || 'Unknown User'
    };
  }

  /**
   * Send request to Directory microservice using fill-fields protocol
   * @param {Object} payload - Payload object to send
   * @returns {Promise<Object>} Parsed response from Directory or rollback mock data
   */
  async sendRequest(payload) {
    // If baseUrl is not configured, return rollback immediately
    if (!this.baseUrl) {
      console.warn('[DirectoryClient] Directory URL not configured, using rollback mock data');
      return this.getRollbackMockData(payload);
    }

    const endpoint = `${this.baseUrl}/api/fill-directory-fields`;

    try {
      // Validate payload
      if (typeof payload !== 'object' || payload === null) {
        console.warn('[DirectoryClient] Invalid payload, using rollback mock data');
        return this.getRollbackMockData(payload || {});
      }

      // Convert payload to JSON string
      let payloadString;
      try {
        payloadString = JSON.stringify(payload);
      } catch (stringifyError) {
        console.warn('[DirectoryClient] Failed to stringify payload, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Build request body using URLSearchParams (for application/x-www-form-urlencoded)
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
        console.warn('[DirectoryClient] Directory returned invalid response structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      if (!response.data.payload || typeof response.data.payload !== 'string') {
        console.warn('[DirectoryClient] Directory response missing or invalid payload field, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Parse payload string
      let responsePayload;
      try {
        responsePayload = JSON.parse(response.data.payload);
      } catch (parseError) {
        console.warn('[DirectoryClient] Failed to parse payload from Directory response, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      // Validate that parsed payload is an object
      if (typeof responsePayload !== 'object' || responsePayload === null) {
        console.warn('[DirectoryClient] Directory returned invalid payload structure, using rollback mock data');
        return this.getRollbackMockData(payload);
      }

      return responsePayload;
    } catch (error) {
      // All errors result in rollback - log warning and return mock data
      console.warn('[DirectoryClient] External request failed, using rollback mock data instead', {
        error: error.message,
        endpoint
      });
      return this.getRollbackMockData(payload);
    }
  }

  /**
   * Fetch company data from Directory
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company data with filled fields
   */
  async fetchCompanyData(companyId) {
    if (!companyId || typeof companyId !== 'string') {
      throw new Error('companyId must be a non-empty string');
    }

    // Build payload object with empty/null fields
    const payload = {
      company_id: companyId,
      company_name: '',
      decision_maker_policy: null,
      decision_maker: null
    };

    // Send request to Directory (will return rollback mock data if it fails)
    const filledData = await this.sendRequest(payload);

    // Build validated response
    return {
      company_id: typeof filledData.company_id === 'string' ? filledData.company_id : companyId,
      company_name: typeof filledData.company_name === 'string' ? filledData.company_name : 'Unknown Company',
      decision_maker_policy: filledData.decision_maker_policy || 'auto',
      decision_maker: filledData.decision_maker || null
    };
  }

  /**
   * Fetch learner data from Directory
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Learner data with filled fields
   */
  async fetchLearnerData(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    // Build payload object with empty/null fields
    const payload = {
      user_id: userId,
      user_name: '',
      company_id: '',
      company_name: ''
    };

    // Send request to Directory (will return rollback mock data if it fails)
    const filledData = await this.sendRequest(payload);

    // Build validated response
    return {
      user_id: typeof filledData.user_id === 'string' ? filledData.user_id : userId,
      user_name: typeof filledData.user_name === 'string' ? filledData.user_name : 'Unknown User',
      company_id: typeof filledData.company_id === 'string' ? filledData.company_id : '',
      company_name: typeof filledData.company_name === 'string' ? filledData.company_name : ''
    };
  }
}

