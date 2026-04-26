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
      localStorage.setItem('authToken', token);
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
 * @returns {boolean} True if user exists (token is optional)
 */
export function isAuthenticated() {
  const user = getCurrentUser();
  // Token is optional - only require user to be authenticated
  return !!user;
}

/**
 * Extract URL parameters from query string
 * @returns {Object} Object with user_id, role, token, company_id, etc.
 */
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const legacyToken = params.get('token');
  return {
    user_id: params.get('user_id'),
    company_id: params.get('company_id'),
    role: params.get('role'),
    access_token: accessToken,
    token: accessToken || legacyToken,
  };
}

/**
 * Initialize auth from URL parameters (called when redirected from Directory)
 * Works with just user_id (token is optional)
 * Reads URL params and stores in localStorage
 * @returns {Promise<Object|null>} User object if successful, null otherwise
 */
export async function initializeAuthFromUrl() {
  const urlParams = getUrlParams();
  
  // If no user_id or company_id, return null (not redirected from Directory)
  if (!urlParams.user_id && !urlParams.company_id) {
    return null;
  }

  // Infer role from path if not provided in URL params
  let inferredRole = null;
  if (!urlParams.role) {
    const path = window.location.pathname;
    if (path.startsWith('/company')) {
      inferredRole = 'company';
    } else if (path.startsWith('/approvals')) {
      inferredRole = 'decision_maker';
    } else {
      inferredRole = 'learner';
    }
  }

  // Use URL params directly for user bootstrap.
  // Token validity is enforced by backend middleware on protected API routes.
  const user = {
    id: urlParams.user_id || urlParams.company_id,
    company_id: urlParams.company_id,
    role: urlParams.role || inferredRole || 'learner',
    tenantId: urlParams.company_id,
  };

  // Store user info (token is optional - can be null)
  setAuth(user, urlParams.token || null);
  
  // Keep user_id / company_id visible in the URL (Directory-style deep links).
  // Only strip sensitive params like tokens to avoid leaking them in browser history.
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    if (params.has('token') || params.has('access_token')) {
      params.delete('token');
      params.delete('access_token');
      // Note: keep role/user_id/company_id so the URL remains shareable and debuggable
      const next = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}${url.hash || ''}`;
      window.history.replaceState({}, '', next);
    }
  } catch {
    // If URL parsing fails for any reason, don't mutate the URL.
  }
  
  return user;
}

/**
 * Get user role from localStorage or URL
 * @returns {string|null} User role ('learner', 'company', 'decision_maker') or null
 */
export function getUserRole() {
  const user = getCurrentUser();
  if (user && user.role) {
    return user.role;
  }
  
  // Fallback: check URL params
  const urlParams = getUrlParams();
  return urlParams.role || null;
}

