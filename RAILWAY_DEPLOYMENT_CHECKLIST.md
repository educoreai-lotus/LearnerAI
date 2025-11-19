# Railway Deployment Checklist - Step by Step Verification

## Step 1: Verify Railway Service Configuration

### 1.1 Check Root Directory Setting
1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **learnerAI**
3. Click on service: **learner-ai-backend**
4. Go to **Settings** → **Source**
5. **Verify Root Directory:**
   - ✅ Should be: `backend` (without leading slash)
   - ❌ Should NOT be: `/backend` (with leading slash)
   - ❌ Should NOT be: empty

**If incorrect:** Change it to `backend` and sav

---

## Step 2: Verify GitHub Secrets

### 2.1 Check GitHub Repository Secrets
1. Go to your GitHub repository: `WijdanEslim24/learnerAI`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. **Verify these secrets exist:**
   - ✅ `RAILWAY_TOKEN` - Should have a value
   - ✅ `RAILWAY_SERVICE_ID` - Should be a UUID (like `13e54fa8-3a3d-4dd7-aafe-d8e64d1c5f2d`)

**If missing:** Add them following the steps in `RAILWAY_DEPLOYMENT_STEPS.md`

---

## Step 3: Verify railway.json Configuration

### 3.1 Check railway.json File
Open `learnerAI/railway.json` and verify:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Key points:**
- ✅ `buildCommand` should be `npm install` (NOT `cd backend && npm install`)
- ✅ `startCommand` should be `npm start` (NOT `cd backend && npm start`)
- ✅ This assumes Root Directory is set to `backend` in Railway

---

## Step 4: Verify GitHub Actions Workflow

### 4.1 Check deploy.yml Workflow
1. Go to GitHub → **Actions** tab
2. Open the latest workflow run: **Deploy LearnerAI**
3. Check **Deploy Backend to Railway** job:
   - ✅ Should show green checkmark (success)
   - ❌ If red X, click on it to see error logs

### 4.2 Verify Workflow Steps
The workflow should have these steps (all should succeed):
1. ✅ Checkout repository
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Run tests (may show warning, that's OK)
5. ✅ Install Railway CLI
6. ✅ Deploy to Railway

---

## Step 5: Check Railway Deployment Logs

### 5.1 View Build Logs
1. Go to Railway Dashboard → **learner-ai-backend**
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Build Logs** tab
5. **Check for errors:**
   - ✅ Should see: `npm install` running successfully
   - ✅ Should see: Dependencies installed
   - ❌ If you see: `Could not find root directory: /backend` → Root Directory is wrong
   - ❌ If you see: `npm: command not found` → Node.js not detected
   - ❌ If you see: `package.json not found` → Root Directory is wrong

### 5.2 View Deploy Logs
1. Click **Deploy Logs** tab
2. **Check for errors:**
   - ✅ Should see: `npm start` running
   - ✅ Should see: `LearnerAI Backend server running on port...`
   - ❌ If you see: `Error: Cannot find module` → Dependencies not installed
   - ❌ If you see: `Port already in use` → Port conflict
   - ❌ If you see: `ENOENT: no such file or directory` → File path issue

---

## Step 6: Verify Environment Variables

### 6.1 Check Required Variables in Railway
1. Go to Railway Dashboard → **learner-ai-backend**
2. Click **Variables** tab
3. **Verify these variables exist:**
   - ✅ `SUPABASE_URL` - Your Supabase project URL
   - ✅ `SUPABASE_KEY` - Your Supabase anon key
   - ✅ `GEMINI_API_KEY` - Your Google Gemini API key
   - ✅ `PORT` - Railway sets this automatically (don't override)
   - ✅ `NODE_ENV` - Should be `production` (optional but recommended)

**If missing:** Add them from `backend/env.template`

### 6.2 Verify Variable Values
- ✅ All URLs should be production URLs (NOT `localhost`)
- ✅ All tokens/keys should be valid and not expired
- ✅ No typos in variable names

---

## Step 7: Test the Deployed Service

### 7.1 Test Health Endpoint
1. Get your Railway URL: `learner-ai-backend-production.up.railway.app`
2. Open in browser or use curl:
   ```bash
   curl https://learner-ai-backend-production.up.railway.app/health
   ```
3. **Expected response:**
   ```json
   {
     "status": "ok",
     "message": "LearnerAI Backend is running",
     "timestamp": "..."
   }
   ```
   - ✅ 200 status = Service is running
   - ❌ 404/500 = Service has issues

### 7.2 Test API Endpoint
```bash
curl https://learner-ai-backend-production.up.railway.app/api
```
**Expected:** JSON with API information

### 7.3 Test Logo Endpoint
```bash
curl https://learner-ai-backend-production.up.railway.app/api/logo/light
```
**Expected:** Image file (JPG) or 404 if logo not found

---

## Step 8: Common Issues and Fixes

### Issue 1: "Could not find root directory: /backend"
**Cause:** Root Directory in Railway is set to `/backend` (absolute path)
**Fix:**
1. Railway Dashboard → Settings → Source
2. Change Root Directory from `/backend` to `backend`
3. Save and redeploy

### Issue 2: "Build failed" or "Build not started"
**Possible causes:**
- Root Directory not set correctly
- `railway.json` has wrong commands
- Package.json not found

**Fix:**
1. Verify Root Directory = `backend`
2. Verify `railway.json` has `npm install` (not `cd backend && npm install`)
3. Check Build Logs for specific error

### Issue 3: "Deployment successful but service doesn't start"
**Possible causes:**
- Missing environment variables
- Port not set correctly
- Application error on startup

**Fix:**
1. Check Deploy Logs for error messages
2. Verify all required environment variables are set
3. Check that `PORT` variable exists (Railway sets it automatically)

### Issue 4: "401 Unauthorized" in GitHub Actions
**Cause:** Invalid or expired Railway token
**Fix:**
1. Generate new Railway token
2. Update `RAILWAY_TOKEN` in GitHub Secrets

### Issue 5: "Service not found"
**Cause:** Wrong `RAILWAY_SERVICE_ID` in GitHub Secrets
**Fix:**
1. Get correct Service ID from Railway Dashboard
2. Update `RAILWAY_SERVICE_ID` in GitHub Secrets

---

## Step 9: Verify Deployment Status

### 9.1 Check Deployment History
1. Railway Dashboard → **learner-ai-backend** → **Deployments**
2. **Verify:**
   - ✅ Latest deployment shows "ACTIVE" (green)
   - ✅ Status: "Deployment successful"
   - ✅ Deployed via: "GitHub" (for automatic deployments)

### 9.2 Check Service Status
1. Railway Dashboard → **learner-ai-backend**
2. **Verify:**
   - ✅ Service shows as "Active" or "Running"
   - ✅ No error indicators (red badges)
   - ✅ URL is accessible

---

## Step 10: Monitor Logs

### 10.1 View Real-time Logs
1. Railway Dashboard → **learner-ai-backend** → **Logs**
2. **Check for:**
   - ✅ Server startup messages
   - ✅ No error messages
   - ✅ Health check responses

### 10.2 Check HTTP Logs
1. Click **HTTP Logs** tab
2. **Verify:**
   - ✅ Requests are being received
   - ✅ Responses are 200 (not 404/500)
   - ✅ No excessive errors

---

## Quick Verification Checklist

Run through this checklist to verify everything:

- [ ] Root Directory in Railway = `backend` (not `/backend`)
- [ ] `railway.json` has correct commands (no `cd backend`)
- [ ] GitHub Secrets: `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` exist
- [ ] All required environment variables are set in Railway
- [ ] Latest GitHub Actions deployment succeeded
- [ ] Latest Railway deployment shows "ACTIVE"
- [ ] Health endpoint returns 200: `/health`
- [ ] API endpoint returns data: `/api`
- [ ] Service logs show no errors
- [ ] HTTP logs show successful requests

---

## If Everything Fails

1. **Check Railway Status:** Visit [status.railway.app](https://status.railway.app)
2. **Check GitHub Actions:** Verify workflow file syntax
3. **Review Logs:** Check both Build Logs and Deploy Logs
4. **Test Locally:** Run `npm install` and `npm start` in `backend/` folder locally
5. **Contact Support:** If issue persists, check Railway documentation or support

---

## Next Steps After Verification

Once deployment is working:
1. Update frontend `VITE_API_URL` to point to Railway URL
2. Test full application flow
3. Monitor logs for any runtime issues
4. Set up alerts/notifications for deployment failures

