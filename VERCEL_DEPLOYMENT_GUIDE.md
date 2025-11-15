# Vercel Deployment Guide - Mock Data Visibility

## Architecture Overview

Your application has **3 separate parts**:

1. **Vercel** → Frontend (React app) - **This is what users see**
2. **Railway** → Backend API (Node.js server) - **Handles requests**
3. **Supabase** → Database (PostgreSQL) - **Stores mock data**

```
User Browser
    ↓
Vercel (Frontend) 
    ↓ (API calls)
Railway (Backend API)
    ↓ (queries)
Supabase (Database with mock data)
```

## Important: Mock Data is NOT in Vercel

**The mock data is stored in Supabase (database), NOT in Vercel.**

- ✅ **Vercel** = Frontend code only (React components, UI)
- ✅ **Supabase** = Database with all your data (learners, courses, etc.)
- ✅ **Railway** = Backend API that connects frontend to database

## How It Works

1. **Frontend on Vercel** makes API calls to **Backend on Railway**
2. **Backend on Railway** queries **Database on Supabase**
3. **Database returns data** → Backend → Frontend → User sees it

## Steps to See Mock Data in Vercel Deployment

### Step 1: Seed the Database (One-time setup)

Call the seeding endpoint on your **Railway backend**:

```bash
# Replace YOUR_RAILWAY_URL with your actual Railway URL
curl -X POST https://YOUR_RAILWAY_URL/api/seed
```

This populates the **Supabase database** with mock data.

### Step 2: Configure Vercel Environment Variables

In your **Vercel dashboard**, set these environment variables:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:

```
VITE_API_URL = https://YOUR_RAILWAY_URL
VITE_API_VERSION = v1
```

**Important:** Replace `YOUR_RAILWAY_URL` with your actual Railway backend URL (e.g., `https://learnerai-production.up.railway.app`)

### Step 3: Redeploy Vercel (if needed)

After setting environment variables:
- Vercel will automatically redeploy, OR
- Go to **Deployments** → Click **Redeploy** on the latest deployment

### Step 4: Verify It Works

1. Open your Vercel-deployed frontend URL
2. The frontend will call: `https://YOUR_RAILWAY_URL/api/v1/courses/user/USER_ID`
3. The backend will query Supabase and return the mock data
4. You should see Sara Neer's learning paths!

## Quick Checklist

- [ ] Database seeded via Railway backend (`POST /api/seed`)
- [ ] Vercel environment variable `VITE_API_URL` set to Railway URL
- [ ] Vercel environment variable `VITE_API_VERSION` set to `v1`
- [ ] Vercel redeployed (automatic or manual)
- [ ] Frontend can reach backend (check browser console for errors)

## Troubleshooting

### "Failed to fetch" or Network Error
- **Problem:** Frontend can't reach backend
- **Solution:** Check `VITE_API_URL` in Vercel matches your Railway URL

### "No data" or Empty lists
- **Problem:** Database not seeded
- **Solution:** Run `POST https://YOUR_RAILWAY_URL/api/seed`

### CORS Errors
- **Problem:** Backend not allowing Vercel domain
- **Solution:** Check Railway backend has CORS enabled for your Vercel domain

### Data appears in Supabase but not in frontend
- **Problem:** Frontend pointing to wrong backend URL
- **Solution:** Verify `VITE_API_URL` in Vercel environment variables

## Environment Variables Summary

### Vercel (Frontend)
```
VITE_API_URL=https://your-railway-backend.up.railway.app
VITE_API_VERSION=v1
```

### Railway (Backend)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
PORT=5000
GEMINI_API_KEY=your-gemini-key
# ... other backend env vars
```

## Testing Locally vs Production

### Local Development
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:5000`
- Database: Supabase (same as production)

### Production
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-railway-backend.up.railway.app`
- Database: Supabase (same as local)

**The database is shared** between local and production, so seeding once works for both!

## Summary

**To see mock data in your Vercel deployment:**

1. ✅ Seed database once (via Railway backend API)
2. ✅ Set `VITE_API_URL` in Vercel to point to Railway backend
3. ✅ Vercel frontend will automatically fetch data from Railway → Supabase

**No need to redeploy Vercel after seeding** - the data is in the database, and the frontend fetches it dynamically!

