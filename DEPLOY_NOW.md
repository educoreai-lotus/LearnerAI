# 🚀 Deploy Now - Quick Guide

## ✅ Pre-Deployment Checklist

- [x] Database migration completed (`learning_paths` table created)
- [ ] Backend code ready
- [ ] Frontend code ready
- [ ] Environment variables prepared
- [ ] Railway account ready
- [ ] Vercel account ready

---

## 🚂 Step 1: Deploy Backend to Railway

### Option A: Via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Sign in with GitHub

2. **Open Your Existing Project**
   - Select your existing LearnerAI project
   - If you need to link a new service, click **"New Service"** → **"GitHub Repo"**

3. **Verify/Update Environment Variables**
   - In Railway Dashboard → Your Project → **Variables** tab
   - Verify these **required** variables are set:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. **Deploy/Update**
   - If connected to GitHub: Push your latest code, Railway will auto-deploy
   - Or click **"Deploy"** / **"Redeploy"** button in Railway dashboard
   - Wait for deployment to complete (2-5 minutes)
   - Your Railway URL should already be available (e.g., `https://your-app.railway.app`)

5. **Test Deployment**
   ```bash
   # Health check
   curl https://your-app.railway.app/health
   
   # API endpoint
   curl https://your-app.railway.app/api
   ```

### Option B: Via Railway CLI

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your existing project
railway link

# Verify/Update environment variables (if needed)
railway variables
railway variables set SUPABASE_URL=your_url  # Only if missing/needs update
railway variables set SUPABASE_KEY=your_key  # Only if missing/needs update
railway variables set GEMINI_API_KEY=your_key  # Only if missing/needs update
railway variables set PORT=5000  # Only if missing/needs update

# Deploy latest code
railway up
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your `learnerAI` repository
   - Vercel will auto-detect `vercel.json`

3. **Configure Project Settings**
   - **Root Directory**: Leave as root (or set to `frontend` if needed)
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`

4. **Add Environment Variables**
   - In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add:

```env
VITE_API_URL=https://your-railway-app.railway.app
VITE_API_VERSION=v1
VITE_RAILWAY_ASSET_KEY=your_railway_asset_key (if needed)
```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete (1-3 minutes)
   - Vercel will provide a URL (e.g., `https://your-app.vercel.app`)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_API_VERSION
```

---

## 🔄 Step 3: Update Frontend Environment

After getting your Railway backend URL, update the frontend environment:

1. **In Vercel Dashboard**:
   - Go to your project → **Settings** → **Environment Variables**
   - Update `VITE_API_URL` to your Railway backend URL

2. **Redeploy Frontend**:
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment

---

## ✅ Step 4: Verify Everything Works

### Test Backend
```bash
# Health check
curl https://your-railway-app.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}

# API info
curl https://your-railway-app.railway.app/api

# Should return API endpoint information
```

### Test Frontend
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check browser console for errors
3. Test API calls from frontend

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Health check fails
- **Solution**: Check Railway logs, verify PORT is set correctly

**Problem**: Database connection errors
- **Solution**: Verify SUPABASE_URL and SUPABASE_KEY are correct

**Problem**: API returns 404
- **Solution**: Check that routes are registered in `server.js`

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Verify `VITE_API_URL` points to your Railway backend URL

**Problem**: Build fails
- **Solution**: Check Vercel build logs, ensure all dependencies are in `package.json`

---

## 📝 Quick Reference

### Railway Backend URL
```
https://your-app.railway.app
```

### Vercel Frontend URL
```
https://your-app.vercel.app
```

### Environment Variables Checklist

**Railway (Backend):**
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY
- ✅ GEMINI_API_KEY
- ✅ PORT=5000

**Vercel (Frontend):**
- ✅ VITE_API_URL (your Railway URL)
- ✅ VITE_API_VERSION=v1

---

## 🎉 You're Deployed!

Once both are deployed:
- ✅ Backend running on Railway
- ✅ Frontend running on Vercel
- ✅ Database connected via Supabase
- ✅ API calls working between frontend and backend

**Next Steps:**
- Test all endpoints
- Monitor logs for errors
- Set up custom domains (optional)
- Configure CI/CD for automatic deployments

