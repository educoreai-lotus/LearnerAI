import { HttpClient } from './HttpClient.js';

/**
 * CourseBuilderClient
 * Client for communicating with the Course Builder microservice
 */
export class CourseBuilderClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    this.baseUrl = baseUrl || process.env.COURSE_BUILDER_URL || 'http://localhost:5002';
    this.serviceToken = serviceToken || process.env.COURSE_BUILDER_TOKEN;
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Get rollback mock data when Course Builder request fails
   * @param {Object} learningPath - Original learning path data
   * @returns {Object} Mock response matching expected structure
   */
  getRollbackMockData(learningPath) {
    return {
      success: false,
      message: 'Course Builder unavailable - using rollback mock data',
      learningPathId: learningPath.competency_target_name || learningPath.id,
      timestamp: new Date().toISOString(),
      rollback: true
    };
  }

  /**
   * Send learning path to Course Builder
   * @param {Object} learningPath - Complete learning path object
   * @param {Object} options - Request options (maxRetries, retryDelay, useRollback)
   * @returns {Promise<Object>} Response from Course Builder or rollback mock data
   */
  async sendLearningPath(learningPath, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useRollback = true
    } = options;

    // If baseUrl is not configured, return rollback immediately
    if (!this.baseUrl) {
      console.warn('[CourseBuilderClient] Course Builder URL not configured, using rollback mock data');
      return this.getRollbackMockData(learningPath);
    }

    const url = `${this.baseUrl}/api/v1/learning-paths`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serviceToken}`,
      'X-Service-Token': this.serviceToken
    };

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post(url, learningPath, { headers });
        console.log(`✅ Learning path sent to Course Builder successfully (attempt ${attempt})`);
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`[CourseBuilderClient] Request attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }

    // All retries failed - use rollback if enabled
    if (useRollback) {
      console.warn('[CourseBuilderClient] All retries failed, using rollback mock data');
      return this.getRollbackMockData(learningPath);
    }

    // If rollback disabled, throw error
    throw new Error(`Course Builder failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

