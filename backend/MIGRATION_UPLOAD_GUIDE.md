# Coordinator Migration File Upload Guide

This guide explains how to upload your migration file to Coordinator after service registration.

## Prerequisites

1. ✅ Service registered with Coordinator (you should have received a `serviceId`)
2. ✅ Migration file created: `coordinator_migration.json`
3. ✅ Environment variables set (same as registration)

## Method 1: Using the Upload Script (Recommended)

### Step 1: Get Your Service ID

From your registration response, you should have received a `serviceId`. It looks like:
```
550e8400-e29b-41d4-a716-446655440000
```

If you don't have it, check:
- Railway logs from when registration succeeded
- Coordinator dashboard/service registry

### Step 2: Run the Upload Script

```bash
cd backend
node src/registration/uploadMigration.js <serviceId>
```

**Example:**
```bash
node src/registration/uploadMigration.js 550e8400-e29b-41d4-a716-446655440000
```

**With custom file path:**
```bash
node src/registration/uploadMigration.js <serviceId> ./coordinator_migration.json
```

### Step 3: Verify Upload

The script will output:
- ✅ Success message with response data
- ❌ Error message if something went wrong

---

## Method 2: Using cURL

### Step 1: Prepare the Request

```bash
# Set your variables
COORDINATOR_URL="https://coordinator-production-e0a0.up.railway.app"
SERVICE_NAME="learnerAI-service"
SERVICE_ID="your-service-id-here"
MIGRATION_FILE="./coordinator_migration.json"
```

### Step 2: Generate Signature (Node.js)

You'll need to generate an ECDSA signature. Use this Node.js snippet:

```javascript
const crypto = require('crypto');
const fs = require('fs');

const SERVICE_NAME = 'learnerAI-service';
const PRIVATE_KEY = 'your-private-key-here'; // From Railway env vars
const migrationData = JSON.parse(fs.readFileSync('coordinator_migration.json', 'utf8'));

// Build message
const payloadString = JSON.stringify(migrationData);
const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
const message = `educoreai-${SERVICE_NAME}-${payloadHash}`;

// Sign
const privateKeyObj = crypto.createPrivateKey({
  key: PRIVATE_KEY.includes('BEGIN') ? PRIVATE_KEY : `-----BEGIN PRIVATE KEY-----\n${PRIVATE_KEY}\n-----END PRIVATE KEY-----`,
  format: 'pem'
});

const signature = crypto.sign('sha256', Buffer.from(message, 'utf8'), {
  key: privateKeyObj,
  dsaEncoding: 'ieee-p1363'
}).toString('base64');

console.log('Signature:', signature);
```

### Step 3: Make the Request

```bash
curl -X POST "${COORDINATOR_URL}/register/${SERVICE_ID}/migration" \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: ${SERVICE_NAME}" \
  -H "X-Signature: ${SIGNATURE}" \
  -d @${MIGRATION_FILE}
```

---

## Method 3: Using Postman

### Setup

1. **URL:** `POST {COORDINATOR_URL}/register/{serviceId}/migration`
   - Replace `{COORDINATOR_URL}` with your Coordinator URL
   - Replace `{serviceId}` with your service ID

2. **Headers:**
   ```
   Content-Type: application/json
   X-Service-Name: learnerAI-service
   X-Signature: <generated-signature>
   ```

3. **Body:** 
   - Select "raw" and "JSON"
   - Paste the contents of `coordinator_migration.json`

4. **Generate Signature:**
   - Use the Node.js snippet above to generate the signature
   - Or use the upload script to get the signature

---

## Expected Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Migration file uploaded successfully",
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active"
}
```

### Error Responses

**401 Unauthorized:**
- Check your `LEARNERAI_PRIVATE_KEY` is correct
- Verify signature generation

**404 Not Found:**
- Service ID doesn't exist
- Check you're using the correct service ID from registration

**400 Bad Request:**
- Migration file format is invalid
- Check JSON syntax
- Verify required fields are present

**500 Internal Server Error:**
- Coordinator service issue
- Try again later

---

## Troubleshooting

### "Service ID not found"
- Verify you're using the correct service ID from registration
- Check Coordinator dashboard to see registered services

### "Signature verification failed"
- Ensure `LEARNERAI_PRIVATE_KEY` matches the one used for registration
- Verify the key is in correct format (PEM or base64)

### "Invalid migration file format"
- Validate JSON syntax: `node -e "JSON.parse(require('fs').readFileSync('coordinator_migration.json', 'utf8'))"`
- Check all required fields are present

### "Timeout"
- Coordinator might be slow
- Try again with longer timeout
- Check Coordinator health endpoint

---

## After Upload

Once migration is uploaded successfully:

1. ✅ Service status changes from `pending_migration` to `active`
2. ✅ Coordinator can now route requests to your service
3. ✅ Service discovery is enabled
4. ✅ Other services can find and call your endpoints

---

## Quick Reference

**Upload Script:**
```bash
node src/registration/uploadMigration.js <serviceId>
```

**Endpoint:**
```
POST {COORDINATOR_URL}/register/{serviceId}/migration
```

**Required Headers:**
- `Content-Type: application/json`
- `X-Service-Name: learnerAI-service`
- `X-Signature: <base64-ecdsa-signature>`

**Required Body:**
- JSON content from `coordinator_migration.json`

