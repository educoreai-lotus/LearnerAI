import { HttpClient } from './HttpClient.js';

/**
 * ReportsClient
 * Client for communicating with the Management Reports microservice
 */
export class ReportsClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.REPORTS_URL || 'http://localhost:5004';
    this.serviceToken = serviceToken || process.env.REPORTS_TOKEN;
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Update reports with learning path data
   * @param {Object} pathData - Learning path data to send
   * @returns {Promise<Object>} Response from Reports service
   */
  async updatePathReports(pathData) {
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
      console.error('Failed to update reports:', error.message);
      throw new Error(`Reports service error: ${error.message}`);
    }
  }
}

