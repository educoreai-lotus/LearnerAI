# Quick Deployment Start

## 🚀 Fast Track Deployment

### Backend to Railway (5 minutes)

1. **Connect Repository**
   ```bash
   # If using Railway CLI
   railway login
   railway init
   railway link
   ```

2. **Set Environment Variables in Railway Dashboard:**
   - Go to your Railway project → Variables
   - Add these 3 required variables:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     GEMINI_API_KEY=your_gemini_key
     PORT=5000
     ```

3. **Deploy:**
   ```bash
   railway up
   ```
   
   Or use Railway Dashboard → Deploy from GitHub

4. **Test:**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Visit: `https://your-app.railway.app/health`
   - Should see: `{"status":"ok",...}`

### Frontend to Vercel (3 minutes)

1. **Connect Repository**
   - Go to vercel.com → Add New Project
   - Import your GitHub repo

2. **Configure:**
   - Framework: Vite
   - Root Directory: `learnerAI/frontend` (or `frontend` if deploying from root)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variable:**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Test:**
   - Visit your Vercel URL
   - Check browser console for API connection

## ⚠️ Before Deploying: Run Database Migration!

**CRITICAL:** Run this in Supabase SQL Editor first:

1. Open Supabase Dashboard → SQL Editor
2. Copy entire file: `database/migrations/init_schema_migration.sql`
3. Paste and click "Run"
4. Verify 5 tables are created

## ✅ Quick Test After Deployment

```bash
# Test backend health
curl https://your-backend.railway.app/health

# Test API endpoints
curl https://your-backend.railway.app/api

# Test creating a learner
curl -X POST https://your-backend.railway.app/api/v1/learners \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "test-company-id",
    "company_name": "Test Corp",
    "user_name": "Test User",
    "decision_maker_policy": "auto"
  }'
```

## 🆘 Common Issues

**Backend won't start?**
- Check Railway logs
- Verify all 3 required env vars are set
- Check `SUPABASE_URL` format is correct

**Frontend can't connect?**
- Check `VITE_API_URL` matches your Railway URL
- Verify CORS is enabled (it is by default)
- Check browser console for errors

**Database errors?**
- Run migration in Supabase first!
- Verify tables exist in Supabase dashboard

---

**That's it!** Your app should be live in ~10 minutes! 🎉

