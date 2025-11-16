import { HttpClient } from './HttpClient.js';

/**
 * AnalyticsClient
 * Client for communicating with the Learning Analytics microservice
 * 
 * Note: Learning Analytics receives data in two ways:
 * 1. On-demand: Learning Analytics requests data via /api/fill-content-metrics (handled by endpoints.js)
 * 2. Batch: LearnerAI sends all users data daily via sendBatchAnalytics()
 */
export class AnalyticsClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.ANALYTICS_URL || 'http://localhost:5003';
    this.serviceToken = serviceToken || process.env.ANALYTICS_TOKEN;
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Send batch analytics data (all users) to Learning Analytics
   * This is called daily in a scheduled batch job
   * @param {Array<Object>} batchData - Array of user analytics data objects
   * @returns {Promise<Object>} Response from Analytics service
   */
  async sendBatchAnalytics(batchData) {
    const url = `${this.baseUrl}/api/v1/paths/batch`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serviceToken}`,
      'X-Service-Token': this.serviceToken
    };

    try {
      const response = await this.httpClient.post(url, batchData, { headers });
      console.log(`✅ Batch analytics sent: ${batchData.length} users`);
      return response;
    } catch (error) {
      console.error('Failed to send batch analytics:', error.message);
      throw new Error(`Analytics service error: ${error.message}`);
    }
  }

  /**
   * @deprecated This method is no longer used. 
   * Learning Analytics now receives data via:
   * 1. On-demand requests through /api/fill-content-metrics
   * 2. Batch mode via sendBatchAnalytics()
   * 
   * Kept for backward compatibility only.
   */
  async updatePathAnalytics(pathData) {
    console.warn('updatePathAnalytics() is deprecated. Use sendBatchAnalytics() for batch mode or handle on-demand requests via /api/fill-content-metrics');
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

