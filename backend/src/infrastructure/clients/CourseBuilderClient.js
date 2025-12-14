import { HttpClient } from './HttpClient.js';
import { mapFieldsOutgoing, mapFieldsOutgoingWithAI } from '../../utils/fieldMapper.js';

/**
 * CourseBuilderClient
 * Client for communicating with the Course Builder microservice
 */
export class CourseBuilderClient {
  constructor({ baseUrl, serviceToken, httpClient, geminiClient = null }) {
    this.baseUrl = baseUrl || process.env.COURSE_BUILDER_URL || 'http://localhost:5002';
    this.serviceToken = serviceToken || process.env.COURSE_BUILDER_TOKEN;
    this.httpClient = httpClient || new HttpClient();
    this.geminiClient = geminiClient; // For AI-powered field mapping
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
   * @param {Object} learningPath - Complete learning path object (in LearnerAI format)
   * @param {Object} options - Request options (maxRetries, retryDelay, useRollback, useFieldMapping, targetSchema)
   * @returns {Promise<Object>} Response from Course Builder or rollback mock data
   */
  async sendLearningPath(learningPath, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      useRollback = true,
      useFieldMapping = true, // Enable field mapping by default
      targetSchema = null // Course Builder's expected schema (optional, for AI mapping)
    } = options;

    // If baseUrl is not configured, return rollback immediately
    if (!this.baseUrl) {
      console.warn('[CourseBuilderClient] Course Builder URL not configured, using rollback mock data');
      return this.getRollbackMockData(learningPath);
    }

    // Map fields from LearnerAI format to Course Builder format
    let mappedLearningPath = learningPath;
    if (useFieldMapping) {
      try {
        // Use AI-powered mapping if geminiClient and targetSchema are available
        if (this.geminiClient && targetSchema) {
          const mappingResult = await mapFieldsOutgoingWithAI(
            learningPath,
            this.geminiClient,
            'course-builder-out',
            targetSchema
          );
          mappedLearningPath = mappingResult.mapped_data;
          
          if (mappingResult.ai_mappings && Object.keys(mappingResult.ai_mappings).length > 0) {
            console.log('🤖 AI mapped outgoing fields to Course Builder:', mappingResult.ai_mappings);
          }
        } else {
          // Use predefined mappings
          mappedLearningPath = mapFieldsOutgoing(learningPath, 'course-builder-out');
          console.log('📋 Using predefined field mappings for Course Builder');
        }
      } catch (mappingError) {
        console.warn('[CourseBuilderClient] Field mapping failed, using original data:', mappingError.message);
        mappedLearningPath = learningPath; // Fallback to original
      }
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
        const response = await this.httpClient.post(url, mappedLearningPath, { headers });
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

