# GitHub Actions Deployment Issues - Fixed

## Problems Found:

### Issue 1: Duplicate Workflows Running
**Problem:** Two workflows are trying to deploy to Railway:
- `deploy.yml` - Uses Railway CLI ✅
- `ci-cd.yml` - Was using non-existent action ❌

**Impact:** 
- Both workflows trigger on push to `main`
- `ci-cd.yml` fails because `railway-app/railway-deploy@v1` doesn't exist
- This causes deployment failures

### Issue 2: Wrong Railway Action in ci-cd.yml
**Problem:** 
```yaml
- name: Deploy to Railway
  uses: railway-app/railway-deploy@v1  # ❌ This action doesn't exist!
  with:
    railway-token: ${{ secrets.RAILWAY_TOKEN }}
    service: learner-ai-backend
```

**Fix Applied:**
Changed to use Railway CLI (same as `deploy.yml`):
```yaml
- name: Install Railway CLI
  run: npm install -g @railway/cli

- name: Deploy to Railway
  run: railway up --service ${{ secrets.RAILWAY_SERVICE_ID }} --detach
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Current Status:

### ✅ deploy.yml (Working)
- Uses Railway CLI correctly
- Deploys from `./backend` directory
- Should work if Root Directory in Railway = `backend`

### ✅ ci-cd.yml (Fixed)
- Now uses Railway CLI (same as deploy.yml)
- Should work correctly now

## Recommendations:

### Option 1: Keep Both Workflows (Current)
- Both workflows will deploy
- May cause duplicate deployments
- Not recommended for production

### Option 2: Disable One Workflow (Recommended)
**Recommended:** Disable `ci-cd.yml` and keep only `deploy.yml`

To disable `ci-cd.yml`:
1. Rename it to `ci-cd.yml.disabled`
2. Or remove the `build-backend` job from it
3. Or change the `on:` trigger to only run on `workflow_dispatch`

## Next Steps:

1. **Verify Root Directory in Railway:**
   - Go to Railway Dashboard → Settings → Source
   - Ensure Root Directory = `backend` (not `/backend`)

2. **Test Deployment:**
   - Push a commit
   - Check GitHub Actions → Both workflows should succeed
   - Check Railway Dashboard → Should see successful deployment

3. **If Still Failing:**
   - Check Railway Build Logs for specific errors
   - Verify `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` in GitHub Secrets
   - Check that `railway.json` has correct commands

## Summary of Fixes:

✅ Fixed `ci-cd.yml` to use Railway CLI instead of non-existent action
✅ Both workflows now use the same deployment method
⚠️ Consider disabling one workflow to avoid duplicate deployments

