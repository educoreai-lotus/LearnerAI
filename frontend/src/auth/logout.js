/**
 * nAuth logout + local auth cleanup (Vite).
 * Continues cleanup and redirect even if the remote logout request fails.
 */

const AUTH_STORAGE_KEYS = [
  'token',
  'authToken',
  'auth_token',
  'userId',
  'tenant_id',
  'user',
  'auth_user',
  'access_token',
];

export function getNAuthBaseUrl() {
  const raw = import.meta.env.VITE_NAUTH_BASE_URL;
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  return raw.replace(/\/+$/, '');
}

export function getNAuthFrontendUrl() {
  const raw = import.meta.env.VITE_NAUTH_FRONTEND_URL;
  if (!raw || typeof raw !== 'string') {
    return '';
  }
  return raw.replace(/\/+$/, '');
}

export async function callNAuthLogout() {
  const baseUrl = getNAuthBaseUrl();
  if (!baseUrl) {
    return;
  }
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch {
    // Server unreachable or network error — still clear local session.
  }
}

export function clearLocalAuthState() {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/**
 * @param {object} [_options]
 */
export async function logout(_options = {}) {
  await callNAuthLogout();
  clearLocalAuthState();

  const frontendUrl = getNAuthFrontendUrl();
  if (frontendUrl) {
    window.location.href = `${frontendUrl}/login`;
  } else {
    window.location.href = '/';
  }
}
