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

  getStoredToken() {
    try {
      return localStorage.getItem('token') || localStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  storeRotatedToken(token) {
    if (!token || typeof token !== 'string') {
      return;
    }
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
    } catch (error) {
      // Keep request flow resilient if localStorage is unavailable.
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getStoredToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const rotatedToken = response.headers.get('X-New-Access-Token');
      if (rotatedToken) {
        this.storeRotatedToken(rotatedToken);
      }

      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      } else {
        data = {};
      }

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      if (error && typeof error.status === 'number') {
        throw error;
      }
      console.error('API Request failed:', error?.message || error);
      throw error;
    }
  }

  // Learning Paths
  async generateLearningPath(userId, competencyTargetName, skillGaps, companyId) {
    return this.request('/learning-paths/generate', {
      method: 'POST',
      body: { userId, competencyTargetName, skillGaps, companyId },
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
  async getApprovalDetails(approvalId, userId = null) {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`/approvals/${approvalId}${params}`);
  }

  async approvePath(approvalId, userId = null) {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`/approvals/${approvalId}/approve${params}`, {
      method: 'POST',
    });
  }

  async requestChanges(approvalId, feedback, userId = null) {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`/approvals/${approvalId}/request-changes${params}`, {
      method: 'POST',
      body: { feedback },
    });
  }

  async rejectPath(approvalId, feedback = null) {
    return this.request(`/approvals/${approvalId}/reject`, {
      method: 'POST',
      body: { feedback },
    });
  }

  async getApproval(approvalId) {
    return this.request(`/approvals/${approvalId}`);
  }

  async getPendingApprovals(decisionMakerId) {
    return this.request(`/approvals/pending/${decisionMakerId}`);
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

  // Authentication
  async validateToken(token) {
    // Legacy no-op kept for compatibility while auth is enforced server-side per request.
    return { valid: !!token };
  }
}

export default new ApiService();


