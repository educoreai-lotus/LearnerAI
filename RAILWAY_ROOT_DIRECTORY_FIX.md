# Railway Root Directory Fix - Critical Issue

## The Problem

The deployment fails at the **Initialization** stage with error:
```
Could not find root directory: /backend
```

## Root Cause

When Railway CLI runs `railway up`, it needs to:
1. Be executed from the **root of the repository** (not from `./backend`)
2. Railway then looks for the directory specified in the **Root Directory** setting
3. If Root Directory = `backend`, Railway looks for `./backend/` folder
4. Railway expects `railway.json` to be in that directory

## The Fix

### Step 1: Verify Root Directory in Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **learnerAI**
3. Click on service: **learner-ai-backend**
4. Go to **Settings** → **Source**
5. **Check Root Directory:**
   - ✅ Should be: `backend` (without leading slash, no quotes)
   - ❌ Should NOT be: `/backend` (with leading slash)
   - ❌ Should NOT be: `"backend"` (with quotes)
   - ❌ Should NOT be: empty

**If it's wrong:**
1. Click the edit icon (pencil) next to Root Directory
2. Type: `backend` (exactly like this, no quotes, no slash)
3. Click **Save** or press Enter
4. Wait for the change to save

### Step 2: Verify railway.json Location

The `railway.json` file MUST be in:
```
learnerAI/backend/railway.json
```

**NOT in:**
- ❌ `learnerAI/railway.json` (root)
- ❌ `learnerAI/backend/backend/railway.json` (nested)

### Step 3: Verify railway.json Content

Open `learnerAI/backend/railway.json` and ensure it has:

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

**Important:**
- ✅ `buildCommand` = `npm install` (NOT `cd backend && npm install`)
- ✅ `startCommand` = `npm start` (NOT `cd backend && npm start`)
- This is because Railway already sets Root Directory = `backend`, so it's already in that directory

### Step 4: Verify GitHub Actions Workflow

The workflow should run `railway up` from the **root** of the repository:

```yaml
- name: Deploy to Railway
  run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }} --detach
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**NOT from `./backend` directory!**

## How Railway Works

1. GitHub Actions runs `railway up` from repository root
2. Railway CLI connects to Railway service
3. Railway checks the **Root Directory** setting (e.g., `backend`)
4. Railway looks for `backend/` folder in the repository
5. Railway looks for `backend/railway.json` file
6. Railway uses `railway.json` to configure build/start commands
7. Railway runs commands **inside** the `backend/` directory

## Verification Checklist

- [ ] Root Directory in Railway Dashboard = `backend` (no slash, no quotes)
- [ ] `railway.json` exists at `learnerAI/backend/railway.json`
- [ ] `railway.json` has correct `buildCommand` and `startCommand`
- [ ] GitHub Actions workflow runs `railway up` from repository root
- [ ] `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` are set in GitHub Secrets

## Still Not Working?

If you've verified all the above and it still fails:

1. **Check Railway Build Logs:**
   - Go to Railway Dashboard → Your Service → **Deployments**
   - Click on the failed deployment
   - Check **Build Logs** tab
   - Look for specific error messages

2. **Check GitHub Actions Logs:**
   - Go to GitHub → **Actions** tab
   - Click on the failed workflow run
   - Check the **Deploy to Railway** step logs
   - Look for error messages

3. **Try Manual Deployment:**
   ```bash
   # From repository root
   railway login
   railway link
   railway up
   ```

4. **Common Issues:**
   - Root Directory has trailing space: `backend ` (should be `backend`)
   - Root Directory has quotes: `"backend"` (should be `backend`)
   - Root Directory has wrong case: `Backend` (should be `backend`)
   - `railway.json` is in wrong location
   - GitHub Secrets are missing or incorrect

## Summary

**The key issue:** Railway's Root Directory setting must match the actual folder structure, and `railway.json` must be in that folder.

**The fix:** Set Root Directory = `backend` (exactly) and ensure `railway.json` is at `backend/railway.json`.

