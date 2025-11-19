# Railway Microservices Configuration Guide

This guide explains what you need to configure in Railway for microservice communication endpoints.

---

## ✅ What You Need to Add to Railway

### 1. **Environment Variables** (Required)

Add these environment variables in your Railway project dashboard:

#### **Incoming Endpoints** (Other Services → LearnerAI)

These allow other microservices to call your LearnerAI service:

```env
# Token that other services use to authenticate when calling LearnerAI
LEARNER_AI_SERVICE_TOKEN=your-secure-token-here
```

**Where to set:** Railway Dashboard → Your Service → Variables → Add Variable

---

#### **Outgoing Endpoints** (LearnerAI → Other Services)

These allow LearnerAI to call other microservices:

```env
# Skills Engine (Type 2 - Skill Breakdown)
SKILLS_ENGINE_URL=https://your-skills-engine-service.railway.app
SKILLS_ENGINE_TOKEN=your-skills-engine-token

# Learning Analytics
ANALYTICS_URL=https://your-analytics-service.railway.app
ANALYTICS_TOKEN=your-analytics-token

# Course Builder
COURSE_BUILDER_URL=https://your-course-builder-service.railway.app
COURSE_BUILDER_TOKEN=your-course-builder-token
```

**Important:** Replace `localhost` URLs with actual production URLs!

---

### 2. **Public URL Configuration** (Required)

Your LearnerAI service needs to be **publicly accessible** so other microservices can call it:

1. **In Railway Dashboard:**
   - Go to your LearnerAI service
   - Check **"Generate Domain"** or use a custom domain
   - Your service URL will be: `https://your-service-name.railway.app`

2. **Share this URL with other microservices:**
   - Directory service needs: `https://your-service-name.railway.app/api/v1/companies/register`
   - Skills Engine needs: `https://your-service-name.railway.app/api/v1/skills-gaps`

---

### 3. **CORS Configuration** (Already Set)

Your code already has CORS enabled:
```javascript
app.use(cors());
```

This allows other services to call your endpoints. **No additional Railway configuration needed.**

---

### 4. **Health Check Endpoint** (Already Implemented)

Railway can use your health endpoint for monitoring:
- URL: `https://your-service-name.railway.app/health`
- **No configuration needed** - it's already implemented

---

## 📋 Complete Environment Variables Checklist

Add these to Railway Dashboard → Variables:

### Required for Basic Functionality:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `PORT` (Railway sets this automatically, but you can override)

### Required for Microservices Communication:

#### Incoming (Other Services → LearnerAI):
- ✅ `LEARNER_AI_SERVICE_TOKEN` - **REQUIRED** for Directory and Skills Engine to call your service

#### Outgoing (LearnerAI → Other Services):
- ✅ `SKILLS_ENGINE_URL` - **REQUIRED** (use production URL, not localhost!)
- ✅ `SKILLS_ENGINE_TOKEN` - **REQUIRED**
- ✅ `ANALYTICS_URL` - **REQUIRED** (use production URL, not localhost!)
- ✅ `ANALYTICS_TOKEN` - **REQUIRED**
- ✅ `COURSE_BUILDER_URL` - **REQUIRED** (use production URL, not localhost!)
- ✅ `COURSE_BUILDER_TOKEN` - **REQUIRED**

---

## 🔧 How to Configure in Railway

### Step 1: Open Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your LearnerAI project
3. Click on your backend service

### Step 2: Add Environment Variables
1. Click on **"Variables"** tab
2. Click **"New Variable"**
3. Add each variable from the checklist above
4. Click **"Add"**

### Step 3: Update URLs
**Important:** Make sure all `*_URL` variables use **production URLs**, not `localhost`:

❌ **Wrong:**
```env
SKILLS_ENGINE_URL=http://localhost:5001
```

✅ **Correct:**
```env
SKILLS_ENGINE_URL=https://skills-engine-service.railway.app
```

---

## 🔐 Security Best Practices

### 1. **Use Railway Secrets**
- Railway has a **"Secrets"** feature for sensitive tokens
- Use it for all `*_TOKEN` variables
- These are encrypted and not visible in logs

### 2. **Token Management**
- Generate strong, random tokens for `LEARNER_AI_SERVICE_TOKEN`
- Use different tokens for each service
- Rotate tokens periodically

### 3. **URL Validation**
- Always use HTTPS URLs in production
- Never commit tokens to Git (they're in `.gitignore`)

---

## 🧪 Testing After Deployment

### Test Incoming Endpoints

Once deployed, other services can call:

1. **Directory → LearnerAI:**
   ```bash
   POST https://your-service-name.railway.app/api/v1/companies/register
   ```

2. **Skills Engine → LearnerAI:**
   ```bash
   POST https://your-service-name.railway.app/api/v1/skills-gaps
   ```

### Test Outgoing Endpoints

These are called automatically by your code, but you can verify they work by:
1. Generating a learning path
2. Checking Railway logs for:
   - ✅ Success messages: `✅ Learning path sent to Course Builder`
   - ❌ Error messages: `❌ Failed to send to...` (if services aren't running)

---

## 📝 Example Railway Variables

Here's what your Railway Variables tab should look like:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
LEARNER_AI_SERVICE_TOKEN=sk_live_xxxxx
SKILLS_ENGINE_URL=https://skills-engine.railway.app
SKILLS_ENGINE_TOKEN=sk_xxxxx
ANALYTICS_URL=https://analytics.railway.app
ANALYTICS_TOKEN=sk_xxxxx
COURSE_BUILDER_URL=https://course-builder.railway.app
COURSE_BUILDER_TOKEN=sk_xxxxx
```

---

## ⚠️ Common Issues

### Issue 1: "Connection Refused" or "ECONNREFUSED"
**Cause:** Using `localhost` URLs in production
**Fix:** Update all `*_URL` variables to use production URLs

### Issue 2: "401 Unauthorized"
**Cause:** Missing or incorrect tokens
**Fix:** Verify all `*_TOKEN` variables are set correctly

### Issue 3: "CORS Error"
**Cause:** CORS not configured (but it should be already)
**Fix:** Check that `app.use(cors())` is in `server.js` (it is!)

### Issue 4: "Service Not Found"
**Cause:** Other microservices can't reach your Railway URL
**Fix:** 
1. Verify your Railway service has a public domain
2. Share the correct URL with other services
3. Test the health endpoint: `https://your-service.railway.app/health`

---

## ✅ Summary

**What you need to do in Railway:**

1. ✅ **Add environment variables** (tokens and URLs)
2. ✅ **Use production URLs** (not localhost)
3. ✅ **Ensure public domain** is enabled
4. ✅ **Share your service URL** with other microservices

**What's already done:**
- ✅ Endpoints are implemented
- ✅ CORS is configured
- ✅ Health check exis
- ✅ Error handling is in place

---

**Your endpoints are ready - just configure the environment variables in Railway!** 🚀

