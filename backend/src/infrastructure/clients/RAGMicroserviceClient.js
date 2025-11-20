import { HttpClient } from './HttpClient.js';

/**
 * RAGMicroserviceClient
 * Handles communication with the RAG (Retrieval-Augmented Generation) Microservice
 */
export class RAGMicroserviceClient {
  constructor({ baseUrl, serviceToken, httpClient }) {
    if (!baseUrl) {
      throw new Error('RAG Microservice base URL is required');
    }
    // Make serviceToken optional - will use mock responses if not provided
    if (!serviceToken) {
      console.warn('⚠️  RAG Microservice token not provided - will use mock responses');
    }
    
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.serviceToken = serviceToken;
    this.httpClient = httpClient || new HttpClient();
    this.enabled = !!serviceToken; // Track if RAG service is actually available
  }

  /**
   * Send course suggestions to RAG microservice for processing
   * @param {Object} suggestions - Course suggestions from Prompt 4
   * @param {Object} completionData - Original completion data
   * @returns {Promise<Object>} Enhanced suggestions from RAG
   */
  async processCourseSuggestions(suggestions, completionData) {
    // If token not provided, return mock response immediately
    if (!this.enabled) {
      console.warn('⚠️  RAG Microservice not configured - using mock response');
      return this._getMockRAGResponse(suggestions);
    }

    const url = `${this.baseUrl}/api/v1/suggestions/process`;
    
    const payload = {
      suggestions,
      completionData: {
        userId: completionData.userId,
        competencyTargetName: completionData.competencyTargetName,
        completedCourseId: completionData.competencyTargetName, // Legacy support
        completionDate: completionData.completionDate
      }
    };

    try {
      const response = await this.httpClient.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.serviceToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 30 second timeout
        retries: 3
      });

      return response;
    } catch (error) {
      console.error('RAG Microservice error:', error.message);
      
      // Return mock data if RAG service fails
      return this._getMockRAGResponse(suggestions);
    }
  }

  /**
   * Get enhanced course suggestions with RAG content
   * @param {string} userId - User ID
   * @param {string} competencyTargetName - Completed competency name
   * @returns {Promise<Object>} Enhanced suggestions
   */
  async getEnhancedSuggestions(userId, competencyTargetName) {
    // If token not provided, return null (caller should handle)
    if (!this.enabled) {
      console.warn('⚠️  RAG Microservice not configured - cannot get enhanced suggestions');
      return null;
    }

    const url = `${this.baseUrl}/api/v1/suggestions/${userId}/${competencyTargetName}`;
    
    try {
      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Bearer ${this.serviceToken}`
        },
        timeout: 30000,
        retries: 3
      });

      return response;
    } catch (error) {
      console.error('RAG Microservice error:', error.message);
      throw error;
    }
  }

  /**
   * Mock RAG response for fallback
   * @private
   */
  _getMockRAGResponse(suggestions) {
    console.warn('⚠️  Using mock RAG response due to service unavailability');
    
    return {
      enhanced: true,
      ragProcessed: false,
      originalSuggestions: suggestions,
      enhancedSuggestions: suggestions.suggested_courses.map(course => ({
        ...course,
        ragContent: {
          similarCourses: [],
          contentMatches: [],
          learnerProfileMatch: "High",
          note: "RAG service unavailable - using original suggestions"
        }
      })),
      metadata: {
        processedAt: new Date().toISOString(),
        ragServiceAvailable: false,
        fallbackUsed: true
      }
    };
  }
}

