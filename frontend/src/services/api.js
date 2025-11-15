/**
 * API Service
 * Handles all API calls to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

class ApiService {
  constructor() {
    this.baseUrl = `${API_URL}/api/${API_VERSION}`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Learning Paths
  async generateLearningPath(userId, competencyTargetName, skillGaps, companyId) {
    return this.request('/learning-paths/generate', {
      method: 'POST',
      body: { userId, competencyTargetName, courseId: competencyTargetName, skillGaps, companyId }, // Legacy support
    });
  }

  async getLearningPaths(userId) {
    return this.request(`/learning-paths/${userId}`);
  }

  async getCompanyLearningPaths(companyId) {
    return this.request(`/learning-paths/company/${companyId}`);
  }

  // Jobs
  async getJobStatus(jobId) {
    return this.request(`/jobs/${jobId}/status`);
  }

  // Companies
  async registerCompany(companyData) {
    return this.request('/companies/register', {
      method: 'POST',
      body: companyData,
    });
  }

  async getCompany(companyId) {
    return this.request(`/companies/${companyId}`);
  }

  // Learners
  async getLearnersByCompany(companyId) {
    return this.request(`/learners/company/${companyId}`);
  }

  async getAllLearners() {
    return this.request('/learners');
  }

  // Courses
  async getCoursesByUser(userId) {
    return this.request(`/courses/user/${userId}`);
  }

  // Approvals
  async approvePath(approvalId) {
    return this.request(`/approvals/${approvalId}/approve`, {
      method: 'POST',
    });
  }

  async rejectPath(approvalId) {
    return this.request(`/approvals/${approvalId}/reject`, {
      method: 'POST',
    });
  }

  async getApproval(approvalId) {
    return this.request(`/approvals/${approvalId}`);
  }

  // Completions
  async submitCompletion(completionData) {
    return this.request('/completions', {
      method: 'POST',
      body: completionData,
    });
  }

  // Suggestions
  async getSuggestions(userId) {
    return this.request(`/suggestions/${userId}`);
  }

  async getCourseSuggestions(userId, competencyTargetName) {
    return this.request(`/suggestions/${userId}/${competencyTargetName}`);
  }

  async updateSuggestionStatus(suggestionId, status) {
    return this.request(`/suggestions/${suggestionId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }
}

export default new ApiService();

