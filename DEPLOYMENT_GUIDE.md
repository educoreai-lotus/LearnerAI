# Deployment Guide

This guide covers deploying the LearnerAI backend to Railway and frontend to Vercel.

## Prerequisites

- ✅ Database migration completed in Supabase
- ✅ Environment variables ready
- ✅ Railway account (for backend)
- ✅ Vercel account (for frontend)
- ✅ Git repository (GitHub/GitLab/Bitbucket)

---

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Prepare Railway Configuration

Your `railway.json` is already configured:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/health"
  }
}
```

### Step 2: Deploy to Railway

#### Option A: Via Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (or GitLab/Bitbucket)
4. Select your repository
5. Railway will auto-detect the `railway.json` configuration
6. Click **"Deploy"**

#### Option B: Via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 3: Configure Environment Variables

In Railway Dashboard → Your Project → Variables, add:

**Required:**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

**Optional (for full functionality):**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SKILLS_ENGINE_URL=https://your-skills-engine-url.com
SKILLS_ENGINE_TOKEN=your_token
COURSE_BUILDER_URL=https://your-course-builder-url.com
COURSE_BUILDER_TOKEN=your_token
RAG_MICROSERVICE_URL=https://your-rag-url.com
RAG_MICROSERVICE_TOKEN=your_token
ANALYTICS_URL=https://your-analytics-url.com
ANALYTICS_TOKEN=your_token
REPORTS_URL=https://your-reports-url.com
REPORTS_TOKEN=your_token
```

### Step 4: Verify Deployment

1. Railway will provide a URL like: `https://your-app.railway.app`
2. Test health endpoint: `https://your-app.railway.app/health`
3. Test API endpoint: `https://your-app.railway.app/api`

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Vercel Configuration

Your `vercel.json` is already configured:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `learnerAI/frontend` (or just `frontend` if deploying from root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **"Deploy"**

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```env
VITE_API_URL=https://your-backend.railway.app
VITE_RAILWAY_ASSET_KEY=your_railway_asset_key (if needed)
```

**Important:** Vite requires `VITE_` prefix for environment variables!

### Step 4: Update Frontend API URL

Update `frontend/src/services/api.js` if needed to use the Railway backend URL.

---

## 🗄️ Part 3: Database Setup

### Before Deployment: Run Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/migrations/init_schema_migration.sql`
3. Paste and run in SQL Editor
4. Verify tables are created:
   - `learners`
   - `courses`
   - `skills_gap`
   - `skills_expansions`
   - `recommendations`

### (Optional) Load Sample Data

1. Copy contents of `database/20251112_sample_backup.sql`
2. Run in Supabase SQL Editor

---

## ✅ Post-Deployment Checklist

### Backend (Railway)
- [ ] Health endpoint responds: `https://your-app.railway.app/health`
- [ ] API endpoint lists all routes: `https://your-app.railway.app/api`
- [ ] Test creating a learner: `POST /api/v1/learners`
- [ ] Check Railway logs for errors
- [ ] Verify environment variables are set

### Frontend (Vercel)
- [ ] Frontend loads at Vercel URL
- [ ] API calls work (check browser console)
- [ ] Environment variables are set
- [ ] Logo displays correctly
- [ ] Theme toggle works

### Database (Supabase)
- [ ] All 5 tables exist
- [ ] Foreign keys are working
- [ ] Triggers are active (test `last_modified_at` updates)

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** Server won't start
- Check Railway logs
- Verify all required environment variables are set
- Check `SUPABASE_URL` and `SUPABASE_KEY` are correct

**Problem:** Database connection errors
- Verify Supabase credentials
- Check Supabase project is active
- Ensure database migration ran successfully

**Problem:** Routes return 404
- Check Railway is using correct start command
- Verify `server.js` is in the correct location
- Check Railway build logs

### Frontend Issues

**Problem:** API calls fail
- Check `VITE_API_URL` is set correctly
- Verify CORS is enabled on backend
- Check browser console for errors
- Verify backend URL is accessible

**Problem:** Build fails
- Check Vercel build logs
- Verify `package.json` has correct scripts
- Ensure all dependencies are in `package.json`

### Database Issues

**Problem:** Tables don't exist
- Run migration in Supabase SQL Editor
- Check for SQL errors in migration file
- Verify you're connected to correct Supabase project

**Problem:** Foreign key errors
- Verify migration ran in correct order
- Check table names match exactly (case-sensitive)
- Ensure all referenced tables exist

---

## 🔗 Quick Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Backend Health Check:** `https://your-app.railway.app/health`
- **API Documentation:** `https://your-app.railway.app/api`

---

## 📝 Environment Variables Summary

### Backend (Railway) - Required
```env
SUPABASE_URL
SUPABASE_KEY
GEMINI_API_KEY
PORT=5000
```

### Backend (Railway) - Optional
```env
SUPABASE_SERVICE_ROLE_KEY
SKILLS_ENGINE_URL
SKILLS_ENGINE_TOKEN
COURSE_BUILDER_URL
COURSE_BUILDER_TOKEN
RAG_MICROSERVICE_URL
RAG_MICROSERVICE_TOKEN
ANALYTICS_URL
ANALYTICS_TOKEN
REPORTS_URL
REPORTS_TOKEN
```

### Frontend (Vercel) - Required
```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 🚀 Deployment Commands

### Railway (Backend)
```bash
railway login
railway init
railway up
```

### Vercel (Frontend)
```bash
cd frontend
vercel login
vercel --prod
```

---

**Ready to deploy!** 🎉

After deployment, your endpoints will be available at:
- **Backend:** `https://your-app.railway.app/api/v1/learners`
- **Frontend:** `https://your-app.vercel.app`

