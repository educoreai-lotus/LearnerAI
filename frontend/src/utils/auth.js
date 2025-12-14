/**
 * Simple authentication utility
 * 
 * This is a placeholder for authentication. When real authentication is implemented,
 * replace this with your actual auth service.
 * 
 * For now, it supports:
 * - localStorage-based auth (if implemented)
 * - Mock/demo mode (returns null, chatbot won't initialize)
 */

/**
 * Get current user from localStorage or mock data
 * @returns {Object|null} User object with id, tenantId, or null
 */
export function getCurrentUser() {
  // Try to get from localStorage first
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        return user;
      }
    }
  } catch (error) {
    console.warn('Failed to parse user from localStorage:', error);
  }

  // If no user in localStorage, return null
  // The chatbot will not initialize without user and token
  return null;
}

/**
 * Get authentication token from localStorage
 * @returns {string|null} Auth token or null
 */
export function getAuthToken() {
  try {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Failed to get token from localStorage:', error);
    return null;
  }
}

/**
 * Set user and token in localStorage
 * @param {Object} user - User object with id, tenantId, etc.
 * @param {string} token - Authentication token
 */
export function setAuth(user, token) {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (token) {
      localStorage.setItem('token', token);
    }
  } catch (error) {
    console.error('Failed to save auth to localStorage:', error);
  }
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('Failed to clear auth from localStorage:', error);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user and token exist
 */
export function isAuthenticated() {
  const user = getCurrentUser();
  const token = getAuthToken();
  return !!(user && token);
}

