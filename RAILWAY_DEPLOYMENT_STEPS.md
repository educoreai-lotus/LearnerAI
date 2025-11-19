# Railway Deployment Steps

## Prerequisites

Before deploying, you need:

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **Railway Project** - Create a new project or use existing one
3. **Railway Service** - Create a service for the backend

## Step 1: Get Railway Credentials

### Get Railway Token:
1. Go to [Railway Dashboard](https://railway.app)
2. Click on your profile (top right)
3. Go to **Settings** → **Tokens**
4. Click **New Token**
5. Give it a name (e.g., "GitHub Actions Deploy")
6. Copy the token (you won't see it again!)

### Get Service ID:
1. Go to your Railway project
2. Click on your backend service
3. Go to **Settings** → **General**
4. Copy the **Service ID** (it's a UUID)

### Configure Root Directory (IMPORTANT):
1. Go to your Railway project
2. Click on your backend service
3. Go to **Settings** → **General**
4. Find **Root Directory** setting
5. Set it to: `backend`
6. Save the changes

**This tells Railway to use the `backend` folder as the root directory for this service.**

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

   - **Name:** `RAILWAY_TOKEN`
     **Value:** Your Railway token from Step 1

   - **Name:** `RAILWAY_SERVICE_ID`
     **Value:** Your Service ID from Step 1

## Step 3: Trigger Deployment

### Option A: Manual Trigger (Recommended for first deployment)
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy LearnerAI** workflow
4. Click **Run workflow** button (top right)
5. Select branch: **main**
6. Click **Run workflow**

### Option B: Automatic Trigger
- Push any commit to the `main` branch
- The workflow will automatically deploy

## Step 4: Verify Deployment

1. Go to Railway Dashboard
2. Check your service logs
3. Look for: "LearnerAI Backend server running on port..."
4. Your service URL will be: `https://your-service-name.railway.app`

## Step 5: Set Environment Variables in Railway

After deployment, add these environment variables in Railway:

1. Go to Railway Dashboard → Your Service → **Variables**
2. Add all variables from `backend/env.template`:

**Required:**
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GEMINI_API_KEY`
- `PORT` (Railway sets this automatically)

**Optional (for microservices):**
- `SKILLS_ENGINE_URL`
- `SKILLS_ENGINE_TOKEN`
- `ANALYTICS_URL`
- `ANALYTICS_TOKEN`
- `COURSE_BUILDER_URL`
- `COURSE_BUILDER_TOKEN`
- `LEARNER_AI_SERVICE_TOKEN`

**Important:** Use production URLs (not localhost) for all `*_URL` variables!

## Troubleshooting

### Issue: "Could not find root directory: /backend"
- **Solution**: Configure the root directory in Railway dashboard:
  1. Go to Railway Dashboard → Your Service → **Settings** → **General**
  2. Find **Root Directory** field
  3. Set it to: `backend` (not `/backend`)
  4. Save and redeploy

### Issue: "Unable to resolve action"
- ✅ Fixed! We now use Railway CLI directly

### Issue: "401 Unauthorized"
- Check that `RAILWAY_TOKEN` is correct in GitHub secrets
- Verify the token hasn't expired

### Issue: "Service not found"
- Check that `RAILWAY_SERVICE_ID` matches your service ID
- Verify the service exists in your Railway project

### Issue: Deployment succeeds but service doesn't start
- Check Railway logs for errors
- Verify all required environment variables are set
- Check that `PORT` is set (Railway usually sets this automatically)

## Next Steps

After successful deployment:
1. Test the health endpoint: `https://your-service.railway.app/health`
2. Update frontend `VITE_API_URL` to point to Railway URL
3. Seed the database if needed: `POST https://your-service.railway.app/api/seed`

