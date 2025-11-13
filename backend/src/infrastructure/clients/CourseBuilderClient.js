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
   * Send learning path to Course Builder
   * @param {Object} learningPath - Complete learning path object
   * @returns {Promise<Object>} Response from Course Builder
   */
  async sendLearningPath(learningPath) {
    const url = `${this.baseUrl}/api/v1/learning-paths`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serviceToken}`,
      'X-Service-Token': this.serviceToken
    };

    try {
      const response = await this.httpClient.post(url, learningPath, { headers });
      return response;
    } catch (error) {
      console.error('Failed to send learning path to Course Builder:', error.message);
      throw new Error(`Course Builder error: ${error.message}`);
    }
  }
}

