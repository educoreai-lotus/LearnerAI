import { HttpClient } from './HttpClient.js';

/**
 * AnalyticsClient
 * Client for communicating with the Learning Analytics microservice
 */
export class AnalyticsClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.ANALYTICS_URL || 'http://localhost:5003';
    this.serviceToken = serviceToken || process.env.ANALYTICS_TOKEN;
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Update analytics with learning path data
   * @param {Object} pathData - Learning path data to send
   * @returns {Promise<Object>} Response from Analytics service
   */
  async updatePathAnalytics(pathData) {
    const url = `${this.baseUrl}/api/v1/paths/update`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serviceToken}`,
      'X-Service-Token': this.serviceToken
    };

    try {
      const response = await this.httpClient.post(url, pathData, { headers });
      return response;
    } catch (error) {
      console.error('Failed to update analytics:', error.message);
      throw new Error(`Analytics service error: ${error.message}`);
    }
  }
}

