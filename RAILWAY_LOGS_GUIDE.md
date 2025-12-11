# Railway Logs Guide - How to View Coordinator Request Logs

## 📋 Where to Find Logs in Railway

### Option 1: Real-time Logs (Recommended)
1. Go to **Railway Dashboard** → Your project → **learner-ai-backend** service
2. Click on the **Logs** tab (or **View Logs** button)
3. You'll see real-time logs streaming
4. Look for logs starting with `[Coordinator Request]`

### Option 2: Deployment Logs
1. Go to **Railway Dashboard** → Your project → **learner-ai-backend**
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Deploy Logs** tab
5. This shows logs from when the service started

### Option 3: HTTP Logs
1. Go to **Railway Dashboard** → Your project → **learner-ai-backend**
2. Click **Logs** tab
3. Look for **HTTP Logs** section (if available)
4. Shows HTTP request/response logs

---

## 🔍 What to Look For

### When Server Starts:
You should see:
```
🚀 LearnerAI Backend server running on 0.0.0.0:5000
📍 Health check: http://0.0.0.0:5000/health
📍 API endpoint: http://0.0.0.0:5000/api
📍 Coordinator endpoint: http://0.0.0.0:5000/api/fill-content-metrics
✅ Server is ready and listening for connections
📊 Coordinator request logging is ENABLED - all requests will be logged
```

### When Coordinator Makes a Request:
You should see:
```
================================================================================
[Coordinator Request] req-1234567890-abc123 - 2025-12-11T10:30:45.123Z
[Coordinator Request] req-1234567890-abc123 - IP: xxx.xxx.xxx.xxx
[Coordinator Request] req-1234567890-abc123 - Method: POST /api/fill-content-metrics
[Coordinator Request] req-1234567890-abc123 - Headers: {...}
[Coordinator Request] req-1234567890-abc123 - Request Body: {...}
[Coordinator Request] req-1234567890-abc123 - Routing to handler: LearningAnalytics
[Coordinator Request] req-1234567890-abc123 - Action: Batch ingestion...
[Coordinator Request] req-1234567890-abc123 - Handler completed successfully in 9483ms
[Coordinator Request] req-1234567890-abc123 - Result Summary: {...}
[Coordinator Request] req-1234567890-abc123 - Response: 200 | Size: 1234 bytes | Total time: 9500ms
================================================================================
```

---

## ❓ Troubleshooting: Why Don't I See Logs?

### 1. Code Not Deployed Yet
**Check:**
- Railway Dashboard → Deployments → Latest deployment
- Is it showing the latest commit hash?
- Did Railway auto-deploy after your push?

**Fix:**
- Wait a few minutes for auto-deploy
- Or manually trigger redeploy: Railway Dashboard → Service → Settings → Redeploy

### 2. No Requests Received Yet
**Check:**
- Has Coordinator actually sent a request?
- Check Coordinator logs to see if it's calling your service

**Fix:**
- Make a test request from Coordinator
- Or test manually with Postman/curl

### 3. Looking in Wrong Place
**Check:**
- Are you looking at **Deploy Logs** (startup only) instead of **Runtime Logs**?
- Deploy Logs only show startup, not ongoing requests

**Fix:**
- Use **Logs** tab (real-time) not **Deploy Logs** tab
- Keep the logs tab open and wait for requests

### 4. Logs Are Buffered
**Check:**
- Railway sometimes buffers logs
- Refresh the logs view

**Fix:**
- Wait a few seconds
- Refresh the page
- Check if logs appear after a request

### 5. Service Not Running
**Check:**
- Railway Dashboard → Service status
- Is it "Active" or "Running"?

**Fix:**
- Restart the service if needed
- Check for errors in Deploy Logs

---

## 🧪 Test Logging Manually

### Test 1: Check Server Startup Logs
1. Go to Railway → Deployments → Latest → Deploy Logs
2. Look for: `📊 Coordinator request logging is ENABLED`
3. If you see this, logging is working ✅

### Test 2: Make a Test Request
Use Postman or curl to test:
```bash
curl -X POST https://your-railway-url.up.railway.app/api/fill-content-metrics \
  -H "Content-Type: application/json" \
  -H "X-Service-Name: learnerAI-service" \
  -H "X-Signature: your-signature" \
  -d '{
    "requester_service": "LearningAnalytics",
    "payload": {
      "action": "test",
      "type": "batch"
    },
    "response": {}
  }'
```

Then check Railway Logs tab - you should see the request logged.

### Test 3: Check Health Endpoint
```bash
curl https://your-railway-url.up.railway.app/health
```

Check logs - you might see HTTP logs (but not Coordinator logs since it's not the Coordinator endpoint).

---

## 📊 Log Format Explained

Each Coordinator request log includes:

1. **Request ID**: Unique ID for tracking (`req-1234567890-abc123`)
2. **Timestamp**: ISO format timestamp
3. **IP Address**: Where the request came from
4. **Method & Path**: HTTP method and endpoint
5. **Headers**: Important headers (sanitized)
6. **Request Body**: Sanitized request structure
7. **Routing Info**: Which handler is processing
8. **Processing Time**: How long it took
9. **Result Summary**: What was returned (summary, not full data)
10. **Response Info**: Status code, size, total time

---

## 🔧 Force Logs to Appear

If logs still don't appear:

1. **Redeploy the service:**
   - Railway Dashboard → Service → Settings → Redeploy

2. **Check Railway CLI logs:**
   ```bash
   railway logs --service learner-ai-backend
   ```

3. **Add a test log at startup:**
   - Already added: `📊 Coordinator request logging is ENABLED`
   - If you see this, logging infrastructure is working

4. **Verify the endpoint is being called:**
   - Check Coordinator logs to confirm it's sending requests
   - Check Railway HTTP logs (if available) to see incoming requests

---

## 💡 Pro Tips

1. **Keep Logs Tab Open**: Railway logs stream in real-time - keep the tab open
2. **Filter Logs**: Use browser search (Ctrl+F) to find `[Coordinator Request]`
3. **Check Multiple Tabs**: Sometimes logs appear in different sections
4. **Wait for Requests**: Logs only appear when requests are made
5. **Check Both Tabs**: 
   - **Deploy Logs**: Shows startup and build logs
   - **Logs**: Shows runtime logs (where Coordinator requests appear)

---

## 🚨 Still Not Working?

If you still don't see logs:

1. **Verify deployment:**
   - Railway Dashboard → Deployments → Check latest commit hash matches your push

2. **Check for errors:**
   - Railway Dashboard → Deployments → Latest → Deploy Logs
   - Look for any errors during startup

3. **Test locally:**
   - Run `npm start` locally
   - Make a test request
   - Check if logs appear in your terminal

4. **Contact Railway Support:**
   - If logs work locally but not in Railway, it might be a Railway issue

