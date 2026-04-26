function getBearerToken(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return null;
  }

  const token = match[1].trim();
  return token || null;
}

async function validateAccessTokenViaCoordinator(req, accessToken, coordinatorClient) {
  if (!coordinatorClient || typeof coordinatorClient.postRequest !== 'function') {
    throw new Error('CoordinatorClient.postRequest is not available');
  }

  const envelope = {
    requester_service: 'learnerAI-service',
    payload: {
      action: 'Route this request to nAuth service only for access token validation and session continuity decision.',
      access_token: accessToken,
      route: req.originalUrl || req.path || '',
      method: req.method || 'GET'
    },
    response: {
      valid: false,
      reason: '',
      auth_state: '',
      directory_user_id: '',
      organization_id: '',
      primary_role: '',
      is_system_admin: false,
      new_access_token: ''
    }
  };

  return coordinatorClient.postRequest(envelope);
}

function extractValidationResult(coordinatorResponse) {
  if (!coordinatorResponse) {
    return null;
  }

  // Coordinator may return nested structures or stringified response body.
  if (typeof coordinatorResponse === 'string') {
    try {
      return extractValidationResult(JSON.parse(coordinatorResponse));
    } catch {
      return null;
    }
  }

  // 1) coordinatorResponse.response.valid
  // 2) coordinatorResponse.response (full validation object from nAuth)
  if (
    coordinatorResponse.response &&
    typeof coordinatorResponse.response === 'object' &&
    Object.prototype.hasOwnProperty.call(coordinatorResponse.response, 'valid')
  ) {
    return coordinatorResponse.response;
  }

  if (coordinatorResponse.response && coordinatorResponse.response.answer) {
    return extractValidationResult(coordinatorResponse.response.answer);
  }

  // 4) coordinatorResponse.data.response
  if (
    coordinatorResponse.data &&
    typeof coordinatorResponse.data === 'object' &&
    coordinatorResponse.data.response &&
    typeof coordinatorResponse.data.response === 'object'
  ) {
    if (Object.prototype.hasOwnProperty.call(coordinatorResponse.data.response, 'valid')) {
      return coordinatorResponse.data.response;
    }
    return extractValidationResult(coordinatorResponse.data.response);
  }

  if (coordinatorResponse.data && typeof coordinatorResponse.data === 'object') {
    if (Object.prototype.hasOwnProperty.call(coordinatorResponse.data, 'valid')) {
      return coordinatorResponse.data;
    }
    return extractValidationResult(coordinatorResponse.data);
  }

  // 5) direct { valid: true }
  if (Object.prototype.hasOwnProperty.call(coordinatorResponse, 'valid')) {
    return coordinatorResponse;
  }

  return null;
}

function normalizeValidationResult(rawValidation) {
  const valid = rawValidation?.valid === true || rawValidation?.auth_state === 'valid';
  return {
    valid,
    reason: rawValidation?.reason || '',
    auth_state: rawValidation?.auth_state || '',
    directory_user_id: rawValidation?.directory_user_id || rawValidation?.user_id || '',
    organization_id: rawValidation?.organization_id || rawValidation?.tenant_id || '',
    primary_role: rawValidation?.primary_role || rawValidation?.role || '',
    is_system_admin: rawValidation?.is_system_admin === true,
    new_access_token: rawValidation?.new_access_token || '',
    raw: rawValidation || null
  };
}

function createAuthenticate({ coordinatorClient }) {
  return async function authenticate(req, res, next) {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing or malformed Authorization header'
      });
    }

    try {
      const coordinatorResponse = await validateAccessTokenViaCoordinator(req, accessToken, coordinatorClient);
      const rawValidation = extractValidationResult(coordinatorResponse);
      const validation = normalizeValidationResult(rawValidation);

      if (!validation.valid || !validation.directory_user_id) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired access token',
          reason: validation.reason || 'Token validation failed'
        });
      }

      if (validation.new_access_token) {
        res.setHeader('X-New-Access-Token', validation.new_access_token);
      }

      req.user = {
        directory_user_id: validation.directory_user_id,
        organization_id: validation.organization_id,
        primary_role: validation.primary_role,
        is_system_admin: validation.is_system_admin,
        access_token: accessToken,
        auth_source: 'coordinator-nauth',
        raw: validation.raw
      };

      return next();
    } catch (error) {
      console.error('Authentication failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Authentication validation failed'
      });
    }
  };
}

export {
  getBearerToken,
  validateAccessTokenViaCoordinator,
  extractValidationResult,
  normalizeValidationResult,
  createAuthenticate
};
