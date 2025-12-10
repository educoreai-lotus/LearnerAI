# Coordinator Registration Guide

This guide will help you register LearnerAI service with the Coordinator at `https://coordinator-production-6004.up.railway.app`.

## Prerequisites

Before registering, ensure you have:

1. **LearnerAI Production URL** - Your deployed LearnerAI backend URL (e.g., `https://learner-ai-backend-production.up.railway.app`)
2. **ECDSA Private Key** - Your `LEARNERAI_PRIVATE_KEY` (used for signature generation)
3. **Coordinator URL** - `https://coordinator-production-6004.up.railway.app`

## Step 1: Set Environment Variables

Add these to your `backend/.env` file:

```env
# Coordinator Configuration
COORDINATOR_URL=https://coordinator-production-6004.up.railway.app

# Your LearnerAI Production Endpoint
LEARNERAI_DOMAIN=https://your-learnerai-backend.railway.app

# ECDSA Private Key (for signature generation)
LEARNERAI_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...your private key here...
-----END PRIVATE KEY-----

# Optional: Service name (defaults to learnerAI-service)
SERVICE_NAME=learnerAI-service
```

## Step 2: Run Registration Script

From the `backend` directory:

```bash
node scripts/register-to-coordinator.js
```

## What the Script Does

The script performs a **two-stage registration**:

### Stage 1: Basic Service Registration
- Registers service name, version, endpoint, and health check
- Returns a `serviceId` from Coordinator

### Stage 2: Migration File Upload
- Uploads `coordinator_migration.json` with:
  - Database schema (8 tables)
  - API endpoints (all routes)
  - Dependencies (other services)
  - Events (publishes/subscribes)

## Expected Output

```
🚀 LearnerAI Coordinator Registration
=====================================

🔍 Checking environment variables...

✅ Environment variables validated

Configuration:
   Coordinator URL: https://coordinator-production-6004.up.railway.app
   Service Name: learnerAI-service
   Service Endpoint: https://your-backend.railway.app
   Service Version: 1.0.0
   Migration File: backend/coordinator_migration.json

📋 Stage 1: Basic Service Registration
==========================================

📤 Sending registration request...
   URL: https://coordinator-production-6004.up.railway.app/register
   Service Name: learnerAI-service
   Version: 1.0.0
   Endpoint: https://your-backend.railway.app

✅ Stage 1 Complete: Service registered successfully!

📋 Registration Response:
{
  "success": true,
  "message": "Service registered successfully. Please upload migration file.",
  "serviceId": "uuid-here",
  "status": "pending_migration",
  "nextStep": {
    "action": "POST",
    "endpoint": "/register/{serviceId}/migration",
    "description": "Upload your migration file to complete registration"
  }
}

📋 Stage 2: Migration File Upload
==================================

📤 Uploading migration file...
   Service ID: uuid-here
   Migration File: backend/coordinator_migration.json

✅ Stage 2 Complete: Migration file uploaded successfully!

📋 Upload Response:
{
  "success": true,
  "message": "Migration file uploaded successfully. Service is now active.",
  "serviceId": "uuid-here",
  "status": "active",
  "registeredAt": "2024-01-01T00:00:00.000Z"
}

🎉 Registration Complete!
========================

✅ Service 'learnerAI-service' is now registered and active in Coordinator
📋 Service ID: uuid-here
🌐 Coordinator URL: https://coordinator-production-6004.up.railway.app
🔗 Service Endpoint: https://your-backend.railway.app
```

## Troubleshooting

### Error: Missing Environment Variables

```
❌ Missing required environment variables:
   - COORDINATOR_URL
   - LEARNERAI_DOMAIN or SERVICE_ENDPOINT
   - LEARNERAI_PRIVATE_KEY
```

**Solution:** Add missing variables to `backend/.env` file.

### Error: 401 Unauthorized

```
❌ Registration Failed:
   Unauthorized: Authentication failed. Please verify LEARNERAI_PRIVATE_KEY is correct.
```

**Solution:** 
- Verify your `LEARNERAI_PRIVATE_KEY` is correct
- Ensure it's in PEM format (with `-----BEGIN PRIVATE KEY-----` headers)
- Check for any whitespace or formatting issues

### Error: 409 Conflict

```
❌ Registration Failed:
   Conflict: Service 'learnerAI-service' already exists.
```

**Solution:** 
- Service is already registered
- You may need to update instead of register
- Check Coordinator dashboard for existing registration

### Error: Migration File Not Found

```
❌ Registration Failed:
   Migration file not found: backend/coordinator_migration.json
```

**Solution:** 
- Ensure you're running the script from the `backend` directory
- Verify `coordinator_migration.json` exists in `backend/` folder

## Manual Registration (Alternative)

If the script doesn't work, you can register manually:

### Stage 1: Basic Registration

```bash
curl -X POST https://coordinator-production-6004.up.railway.app/register \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: learnerAI-service" \
  -H "X-Signature: <your-signature>" \
  -d '{
    "serviceName": "learnerAI-service",
    "version": "1.0.0",
    "endpoint": "https://your-backend.railway.app",
    "healthCheck": "/health",
    "description": "LearnerAI microservice - AI-powered personalized learning path generation",
    "metadata": {
      "team": "Team LearnerAI",
      "owner": "LearnerAI Team",
      "capabilities": [
        "learning path generation",
        "skills gap analysis",
        "course recommendations",
        "path approvals",
        "AI queries",
        "inter-service communication"
      ]
    }
  }'
```

**Note:** You'll need to generate the signature first using `node generate-signature.js` with the registration payload.

### Stage 2: Upload Migration

```bash
curl -X POST https://coordinator-production-6004.up.railway.app/register/{serviceId}/migration \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: learnerAI-service" \
  -H "X-Signature: <your-signature>" \
  -d @coordinator_migration.json
```

## Verify Registration

After successful registration, verify your service is active:

```bash
curl https://coordinator-production-6004.up.railway.app/services
```

Or check the Coordinator dashboard/UI.

## Next Steps

After registration:

1. ✅ Your service will appear in Coordinator's service registry
2. ✅ Other services can discover and communicate with LearnerAI via Coordinator
3. ✅ AI-powered routing will route requests to LearnerAI based on capabilities
4. ✅ You can use `/api/fill-content-metrics/` endpoint for inter-service communication

## Support

If you encounter issues:

1. Check Coordinator logs: `https://coordinator-production-6004.up.railway.app/health`
2. Verify your LearnerAI backend is accessible: `https://your-backend.railway.app/health`
3. Check signature generation: `node backend/generate-signature.js`
4. Review Coordinator API docs: See the provided Coordinator documentation

