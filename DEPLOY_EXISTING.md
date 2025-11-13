# 🚀 Deploy to Existing Project - Quick Guide

## ✅ You Already Have:
- ✅ Railway project with variables configured
- ✅ Database migration ready (`learning_paths` table)

---

## 🚂 Step 1: Deploy Backend to Existing Railway Project

### Quick Deploy (GitHub Connected)

1. **Push Your Latest Code**
   ```bash
   git add .
   git commit -m "Add learning_paths table migration"
   git push origin main
   ```
   - Railway will automatically detect the push and redeploy

2. **Or Manually Redeploy in Railway**
   - Go to Railway Dashboard → Your Project
   - Click **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment

### Verify Environment Variables

Make sure these are set in Railway → Variables:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `PORT=5000` (or your preferred port)

**To check/update:**
- Railway Dashboard → Your Project → **Variables** tab
- Add/update any missing variables

### Test Deployment

```bash
# Replace with your Railway URL
curl https://your-app.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### If You Have Existing Vercel Project

1. **Push Latest Code** (if not already)
   ```bash
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically detect the push and redeploy
   - Check Vercel Dashboard → Your Project → **Deployments**

3. **Or Manually Redeploy**
   - Vercel Dashboard → Your Project → **Deployments**
   - Click **"Redeploy"** on latest deployment

### Update Environment Variables (If Needed)

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**:

Make sure `VITE_API_URL` points to your Railway backend:
```env
VITE_API_URL=https://your-railway-app.railway.app
VITE_API_VERSION=v1
```

**Important:** After updating `VITE_API_URL`, you must **redeploy** for changes to take effect.

---

## 🔄 Step 3: Quick Update Workflow

### When You Make Changes:

1. **Make your code changes**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. **Railway and Vercel will auto-deploy** (if connected to GitHub)

### Manual Redeploy (If Needed)

**Railway:**
- Dashboard → Project → Deployments → **Redeploy**

**Vercel:**
- Dashboard → Project → Deployments → **Redeploy**

---

## ✅ Step 4: Verify Everything Works

### Test Backend
```bash
# Health check
curl https://your-railway-app.railway.app/health

# API info
curl https://your-railway-app.railway.app/api
```

### Test Frontend
1. Visit your Vercel URL
2. Open browser DevTools → Console
3. Check for any errors
4. Test API calls

---

## 🐛 Troubleshooting

### Backend Not Updating?

1. **Check Railway Logs:**
   - Railway Dashboard → Your Project → **Deployments** → Click latest deployment → **View Logs**

2. **Verify Build:**
   - Check if build completed successfully
   - Look for any error messages

3. **Check Environment Variables:**
   - Railway Dashboard → Variables
   - Ensure all required variables are set

### Frontend Not Updating?

1. **Check Vercel Build Logs:**
   - Vercel Dashboard → Your Project → **Deployments** → Click latest → **View Build Logs**

2. **Verify Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure `VITE_API_URL` is correct

3. **Clear Cache:**
   - Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## 📝 Quick Commands

### Check Railway Status
```bash
railway status
```

### View Railway Logs
```bash
railway logs
```

### View Vercel Logs
```bash
vercel logs
```

---

## 🎉 You're Ready!

Since you already have projects set up:
1. ✅ Push your latest code (with the `learning_paths` migration)
2. ✅ Railway will auto-deploy backend
3. ✅ Vercel will auto-deploy frontend
4. ✅ Test your endpoints

**That's it!** Your existing projects will handle the deployment automatically.

