# 🚀 Register LearnerAI to Coordinator - Quick Start

## Your Configuration

- **Coordinator URL:** `https://coordinator-production-6004.up.railway.app`
- **LearnerAI Backend:** `https://learnerai-production-7e11.up.railway.app`
- **Service Name:** `learnerAI-service`

## Quick Registration Steps

### Option 1: Using the Registration Script (Recommended)

1. **Ensure your `.env` file has these variables:**

```env
COORDINATOR_URL=https://coordinator-production-6004.up.railway.app
LEARNERAI_DOMAIN=https://learnerai-production-7e11.up.railway.app
LEARNERAI_PRIVATE_KEY=your-private-key-here
```

2. **Run the registration script:**

```bash
cd backend
node scripts/register-to-coordinator.js
```

### Option 2: Manual Registration via cURL

#### Stage 1: Basic Registration

First, generate a signature for the registration payload:

```bash
# Update generate-signature.js with this payload:
{
  "serviceName": "learnerAI-service",
  "version": "1.0.0",
  "endpoint": "https://learnerai-production-7e11.up.railway.app",
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
}

# Run: node generate-signature.js
# Copy the X-Signature header value
```

Then register:

```bash
curl -X POST https://coordinator-production-6004.up.railway.app/register \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: learnerAI-service" \
  -H "X-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "serviceName": "learnerAI-service",
    "version": "1.0.0",
    "endpoint": "https://learnerai-production-7e11.up.railway.app",
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

**Save the `serviceId` from the response!**

#### Stage 2: Upload Migration File

Generate signature for the migration file:

```bash
# Read coordinator_migration.json and generate signature
node generate-signature.js
# (Update REQUEST_BODY in generate-signature.js to be the migration file content)
```

Then upload:

```bash
curl -X POST https://coordinator-production-6004.up.railway.app/register/YOUR_SERVICE_ID/migration \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: learnerAI-service" \
  -H "X-Signature: YOUR_SIGNATURE_HERE" \
  -d @coordinator_migration.json
```

## Verify Registration

Check if your service is registered:

```bash
curl https://coordinator-production-6004.up.railway.app/services
```

Or visit: https://coordinator-production-6004.up.railway.app/services

## Expected Response

After successful registration, you should see:

```json
{
  "success": true,
  "message": "Migration file uploaded successfully. Service is now active.",
  "serviceId": "uuid-here",
  "status": "active",
  "registeredAt": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Missing Private Key
- Ensure `LEARNERAI_PRIVATE_KEY` is set in your `.env` file
- Key should be in PEM format with `-----BEGIN PRIVATE KEY-----` headers

### 401 Unauthorized
- Verify your private key is correct
- Check signature generation is working: `node generate-signature.js`

### Service Already Exists
- If you get a 409 Conflict, the service may already be registered
- Check Coordinator dashboard or use `GET /services` endpoint

## Next Steps

After successful registration:

1. ✅ Your service will be discoverable by other microservices
2. ✅ Coordinator can route requests to LearnerAI via AI-powered routing
3. ✅ Other services can communicate with LearnerAI through `/api/fill-content-metrics/`
4. ✅ Your service capabilities will be indexed for intelligent routing

