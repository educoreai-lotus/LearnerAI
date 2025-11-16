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
   * Get rollback mock data when Reports service request fails
   * @param {Object} pathData - Original path data
   * @returns {Object} Mock response matching expected structure
   */
  getRollbackMockData(pathData) {
    return {
      success: false,
      message: 'Reports service unavailable - using rollback mock data',
      pathId: pathData.id || pathData.competencyTargetName,
      timestamp: new Date().toISOString(),
      rollback: true
    };
  }

  /**
   * Update reports with learning path data
   * @param {Object} pathData - Learning path data to send
   * @param {Object} options - Request options (maxRetries, retryDelay, useRollback)
   * @returns {Promise<Object>} Response from Reports service or rollback mock data
   */
  async updatePathReports(pathData, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useRollback = true
    } = options;

    // If baseUrl is not configured, return rollback immediately
    if (!this.baseUrl) {
      console.warn('[ReportsClient] Reports URL not configured, using rollback mock data');
      return this.getRollbackMockData(pathData);
    }

    const url = `${this.baseUrl}/api/v1/paths/update`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serviceToken}`,
      'X-Service-Token': this.serviceToken
    };

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post(url, pathData, { headers });
        console.log(`✅ Reports updated successfully (attempt ${attempt})`);
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`[ReportsClient] Request attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }

    // All retries failed - use rollback if enabled
    if (useRollback) {
      console.warn('[ReportsClient] All retries failed, using rollback mock data');
      return this.getRollbackMockData(pathData);
    }

    // If rollback disabled, throw error
    throw new Error(`Reports service failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

