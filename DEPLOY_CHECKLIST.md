# 🚀 Deployment Checklist

## ✅ Step 1: Run Database Migration (IMPORTANT!)

**Before the backend can work, you MUST create the `learning_paths` table in Supabase:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open: `database/migrations/002_create_learning_paths_table.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)

**Verify it worked:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'learning_paths';
```

---

## ✅ Step 2: Check Railway Deployment

Since we just pushed to GitHub, Railway should auto-deploy:

1. Go to **Railway Dashboard**: https://railway.app
2. Select your **LearnerAI project**
3. Go to **Deployments** tab
4. You should see a new deployment in progress or completed

**If not auto-deploying:**
- Click **"Redeploy"** button
- Or check if GitHub integration is connected

---

## ✅ Step 3: Verify Environment Variables

In Railway Dashboard → Your Project → **Variables**, ensure these are set:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `PORT=5000`

---

## ✅ Step 4: Test Deployment

Once deployment completes, test your backend:

```bash
# Replace with your Railway URL
curl https://your-railway-app.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## ✅ Step 5: Deploy Frontend (Vercel)

If you have a Vercel project:

1. Go to **Vercel Dashboard**: https://vercel.com
2. Your project should auto-deploy from the GitHub push
3. Or manually **Redeploy** if needed

**Update Environment Variables:**
- `VITE_API_URL` = your Railway backend URL
- `VITE_API_VERSION=v1`

---

## 🐛 Troubleshooting

### Backend Health Check Fails

**Check Railway Logs:**
- Railway Dashboard → Deployments → Latest → **View Logs**
- Look for errors about missing `learning_paths` table
- **Solution**: Run the database migration (Step 1)

### Database Connection Errors

- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project is active

### API Returns 404

- Check Railway logs for route registration errors
- Verify server.js is starting correctly

---

## 🎉 Success Indicators

✅ Railway deployment shows "Active" status
✅ Health check returns `{"status":"ok"}`
✅ No errors in Railway logs
✅ Database migration completed
✅ Frontend can connect to backend API

