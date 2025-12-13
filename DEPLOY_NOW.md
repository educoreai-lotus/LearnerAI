# 🚀 Deploy Latest Changes to Railway NOW

## Option 1: Manual GitHub Actions Trigger (Easiest)

1. Go to: https://github.com/WijdanEslim24/learnerAI/actions
2. Click on **"Deploy LearnerAI"** workflow
3. Click **"Run workflow"** button (top right)
4. Select branch: **main**
5. Click **"Run workflow"** (green button)
6. Wait for deployment to complete (check the logs)

## Option 2: Check Railway Auto-Deploy

Railway might be connected to GitHub for auto-deploy. Check:

1. Go to: https://railway.app
2. Select your project
3. Click on your backend service
4. Go to **Settings** → **Source**
5. Check if **"GitHub Repository"** is connected
6. If connected, it should auto-deploy on push
7. If NOT connected, use Option 1 or Option 3

## Option 3: Manual Railway CLI Deploy

If you have Railway CLI installed locally:

```bash
cd backend
railway login
railway link  # Link to your service
railway up    # Deploy
```

## Option 4: Force Redeploy in Railway Dashboard

1. Go to: https://railway.app
2. Select your project
3. Click on your backend service
4. Go to **Deployments** tab
5. Click **"Redeploy"** on the latest deployment
6. Or click **"Deploy"** → **"Deploy Latest"**

## Verify Deployment

After deployment, test the endpoint:

```bash
curl http://learnerai-production-7e11.up.railway.app/api/v1/skills-gaps
```

Or check the health endpoint:

```bash
curl http://learnerai-production-7e11.up.railway.app/health
```

## Check Deployment Logs

1. Go to Railway Dashboard
2. Select your service
3. Click **"Deployments"** tab
4. Click on the latest deployment
5. Check the logs for errors

## Common Issues

### Issue: "Deployment succeeded but code not updated"
- **Solution**: Railway might be caching. Try Option 4 (Force Redeploy)

### Issue: "GitHub Actions workflow not running"
- **Solution**: Check GitHub Actions tab for errors. Verify secrets are set.

### Issue: "Railway deployment failed"
- **Solution**: Check Railway logs. Common issues:
  - Missing environment variables
  - Build errors
  - Port conflicts

