# Coordinator Service Registration

This document describes the Coordinator microservice registration implementation for LearnerAI.

## Overview

The LearnerAI service automatically registers with the Coordinator microservice on startup. This enables:
- Service discovery
- Inter-service communication routing
- Centralized service management

## Implementation Files

### 1. `src/utils/signature.js`
ECDSA P-256 signature generation and verification utility.
- Generates signatures for authentication
- Verifies Coordinator response signatures (optional)
- Uses IEEE P1363 encoding for ECDSA

### 2. `src/registration/register.js`
Service registration logic that runs on startup.
- Registers service with Coordinator
- Implements exponential backoff retry (5 attempts)
- Non-blocking - service continues even if registration fails
- Handles both `LEARNERAI_PRIVATE_KEY` and `LEARNERAI_PRIVATE-KEY` env var formats

### 3. `src/infrastructure/coordinatorClient/coordinatorClient.js`
Centralized client for all Coordinator communication.
- Signs all requests with ECDSA signatures
- Optional response signature verification
- Configurable timeout and endpoints
- Proper error handling and logging

### 4. `src/infrastructure/logging/Logger.js`
Simple logging utility wrapper for consistent logging format.

## Environment Variables

### Required Variables (Railway)

```bash
COORDINATOR_URL=https://coordinator-production-e0a0.up.railway.app
COORDINATOR_PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmXwxIH5Yj1GVqGpwXHpvxiZFnj3Yx9mIn0EF51AnSM1JNeA8IUGzGoJcD0GQaz7zM3VV34VtpAWvx8ALkIx34Q==
LEARNERAI_DOMAIN=https://learner-ai-backend-production.up.railway.app
LEARNERAI_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgom3JSiay0zOY5dG8/8DaXU1uW0ZmX5tIBM2Zifme5WehRANCAATOr417jnJSEJNchGqFebs8BdMMflUdjBBRfZg1DT0mQR14sqE4pY0TurbeTIWHNMcLONYl1OneiGhC2ggDXYsz
SERVICE_NAME=learnerAI-service
```

### Optional Variables

```bash
SERVICE_VERSION=1.0.0
SERVICE_DESCRIPTION=AI-powered learning path generation service
SERVICE_TEAM=Learning Platform Team
SERVICE_OWNER=system
SERVICE_CAPABILITIES=learning-path-generation,ai-integration,approval-workflow
```

## Important Notes

### Private Key Format

**Current Railway Variable:** `LEARNERAI_PRIVATE-KEY` (with hyphen)

**Code Support:** The code handles both formats:
- `LEARNERAI_PRIVATE_KEY` (underscore - recommended)
- `LEARNERAI_PRIVATE-KEY` (hyphen - current Railway format)
- `COORDINATOR_PRIVATE_KEY` (alternative name)

**Recommendation:** Update Railway variable to use underscore (`LEARNERAI_PRIVATE_KEY`) for consistency, but the current hyphen format will work.

### Private Key PEM Format

The code automatically handles keys in two formats:
1. **Full PEM format** (preferred):
   ```
   -----BEGIN PRIVATE KEY-----
   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgom3JSiay0zOY5dG8
   /8DaXU1uW0ZmX5tIBM2Zifme5WehRANCAATOr417jnJSEJNchGqFebs8BdMMflUd
   jBBRfZg1DT0mQR14sqE4pY0TurbeTIWHNMcLONYl1OneiGhC2ggDXYsz
   -----END PRIVATE KEY-----
   ```

2. **Base64 only** (code will wrap it):
   ```
   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgom3JSiay0zOY5dG8/8DaXU1uW0ZmX5tIBM2Zifme5WehRANCAATOr417jnJSEJNchGqFebs8BdMMflUdjBBRfZg1DT0mQR14sqE4pY0TurbeTIWHNMcLONYl1OneiGhC2ggDXYsz
   ```

### Public Key Format

The Coordinator public key can be provided as:
1. **Full PEM format** (preferred)
2. **Base64 only** (code will wrap it)

## Registration Flow

1. **On Startup:**
   - Service reads environment variables
   - Formats private key to PEM if needed
   - Builds registration payload
   - Generates ECDSA signature
   - Sends POST request to `{COORDINATOR_URL}/register`

2. **Retry Logic:**
   - Up to 5 attempts
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Non-blocking - service starts even if registration fails

3. **Response:**
   - Success: Service ID and status returned
   - Failure: Logged but doesn't crash service

## Using Coordinator Client

To call other microservices via Coordinator:

```javascript
import { postToCoordinator } from './src/infrastructure/coordinatorClient/coordinatorClient.js';

// Example: Call another service
const envelope = {
  requester_service: 'learnerAI-service',
  payload: {
    action: 'some-action',
    data: {
      param1: 'value1',
      param2: 'value2'
    }
  },
  response: {}
};

try {
  const result = await postToCoordinator(envelope);
  // Coordinator fills the 'response' field
  console.log(result.response);
} catch (error) {
  console.error('Coordinator request failed:', error.message);
}
```

## Health Endpoint

The registration references `/health` endpoint, which is already implemented in `server.js`:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'LearnerAI Backend',
    timestamp: new Date().toISOString()
  });
});
```

## Troubleshooting

### Registration Fails

1. **Check Environment Variables:**
   - Verify all required variables are set in Railway
   - Check that private key is correct (full PEM or base64)

2. **Check Logs:**
   - Look for registration attempt messages
   - Check for signature generation errors
   - Verify Coordinator URL is accessible

3. **Common Issues:**
   - **401 Unauthorized:** Private key is incorrect or malformed
   - **404 Not Found:** Coordinator URL is wrong
   - **Timeout:** Coordinator service is down or unreachable

### Signature Verification Fails

- This is optional and non-blocking
- Check that `COORDINATOR_PUBLIC_KEY` is correct
- Verify Coordinator is sending `X-Service-Signature` header

## Testing Locally

1. Set environment variables in `.env` file
2. Start the server: `npm start`
3. Check logs for registration messages:
   - `ℹ️  Starting service registration with Coordinator...`
   - `ℹ️  Registered with Coordinator` (success)
   - `⚠️  Service registration failed` (failure)

## References

- Coordinator API: https://coordinator-production-e0a0.up.railway.app
- Coordinator Health: https://coordinator-production-e0a0.up.railway.app/health
- Service Registration Endpoint: `POST /register`

