# Chatbot Integration Guide

This document describes how the EDUCORE chatbot widget is integrated into LearnerAI.

## Overview

The chatbot widget is integrated using the RAG microservice's embed script. The widget appears on all pages and provides AI-powered support for users.

## Files Added/Modified

### New Files

1. **`src/hooks/useChatbot.js`**
   - React hook for initializing the chatbot
   - Handles script loading and initialization
   - Manages chatbot lifecycle

2. **`src/components/ChatbotContainer.jsx`**
   - React component that renders the chatbot container
   - Handles user context based on current route
   - Initializes chatbot with appropriate user ID

### Modified Files

1. **`src/App.jsx`**
   - Added `<ChatbotContainer />` component
   - Chatbot is now available on all pages

2. **`index.html`**
   - Added comment about chatbot script (loaded dynamically)

3. **`env.template`**
   - Added `VITE_RAG_BACKEND_URL` environment variable

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# RAG Chatbot Backend URL
# Production (Railway): https://rag-production-3a4c.up.railway.app
# Production (Vercel): https://rag-git-main-educoreai-lotus.vercel.app
VITE_RAG_BACKEND_URL=https://rag-production-3a4c.up.railway.app
```

### Microservice Support

**⚠️ Important:** The chatbot currently uses `"LEARNERAI"` as the microservice name. However, the RAG backend may only support `"ASSESSMENT"` and `"DEVLAB"` by default.

**Options:**

1. **Add LEARNERAI support to RAG backend** (Recommended)
   - Add `"LEARNERAI"` to supported microservices in RAG backend
   - Add `/api/learnerai/support` endpoint in RAG backend
   - Update `SUPPORT_ALLOWED_ORIGINS` to include LearnerAI domain

2. **Use ASSESSMENT as temporary solution**
   - Change `microservice: 'LEARNERAI'` to `microservice: 'ASSESSMENT'` in `ChatbotContainer.jsx`
   - This will route messages to `/api/assessment/support` (may not work correctly)

3. **Create LearnerAI backend handler** (Alternative)
   - Add support endpoint in LearnerAI backend
   - Configure RAG to forward LEARNERAI messages to LearnerAI

## Current Implementation

### User Authentication

Currently, LearnerAI doesn't have a full authentication system. The chatbot uses:
- **userId**: Hardcoded user ID (Sara Neer: `b2c3d4e5-f6a7-8901-2345-678901234567`)
- **token**: Same as userId (temporary solution)

**Future Enhancement:** When proper authentication is implemented:
1. Get userId from auth context
2. Get token from auth context
3. Pass both to `useChatbot` hook

### User Context by Route

- **`/` (UserView)**: Uses Sara Neer's user ID
- **`/company` (CompanyDashboard)**: Uses default user ID (can be enhanced to use selected user)
- **Other routes**: Uses default user ID

## Usage

The chatbot is automatically initialized when:
1. A page loads with a valid userId
2. The RAG backend script loads successfully
3. The chatbot container exists in the DOM

### Manual Initialization

If you need to manually initialize the chatbot:

```jsx
import { useChatbot } from './hooks/useChatbot';

function MyComponent() {
  const { botInitialized, scriptLoaded } = useChatbot({
    userId: 'user-123',
    token: 'auth-token',
    tenantId: 'default',
    microservice: 'LEARNERAI',
    ragBackendUrl: 'https://rag-production-3a4c.up.railway.app'
  });

  return <div>Chatbot status: {botInitialized ? 'Ready' : 'Loading...'}</div>;
}
```

## Troubleshooting

### Chatbot Not Appearing

1. **Check browser console** for errors
2. **Verify RAG backend is accessible:**
   ```bash
   curl https://rag-production-3a4c.up.railway.app/health
   ```
3. **Check script loads:**
   ```bash
   curl https://rag-production-3a4c.up.railway.app/embed/bot.js
   ```
4. **Verify container exists:** Check that `#edu-bot-container` exists in DOM

### CORS Errors

If you see CORS errors:
1. **Add LearnerAI domain to RAG backend:**
   ```env
   SUPPORT_ALLOWED_ORIGINS=https://learnerai.educore.com,https://learnerai-production.up.railway.app
   ```
2. **Restart RAG backend**

### "Support mode is disabled" Error

1. **Enable support mode in RAG backend:**
   ```env
   SUPPORT_MODE_ENABLED=true
   ```
2. **Add LEARNERAI to supported microservices** (if not already supported)

### "Invalid microservice" Error

The RAG backend may not support `"LEARNERAI"` yet. Options:
1. Add LEARNERAI support to RAG backend (recommended)
2. Temporarily use `"ASSESSMENT"` or `"DEVLAB"` (may not work correctly)
3. Contact RAG team to add LEARNERAI support

## Testing

1. **Start LearnerAI frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser console** and look for:
   - `✅ EDUCORE Bot initialized` (success)
   - Any error messages

3. **Check Network tab** for:
   - `bot.js` request (should be 200)
   - `bot-bundle.js` request (should be 200)

4. **Test chatbot:**
   - Click chatbot button (bottom right)
   - Send a test message
   - Verify response appears

## Future Enhancements

1. **Proper Authentication Integration**
   - Get userId and token from auth context
   - Support multiple users

2. **Dynamic User Context**
   - Get userId from selected user in CompanyDashboard
   - Support user switching

3. **Backend Support Handler** (if needed)
   - Add `/api/learnerai/support` endpoint in LearnerAI backend
   - Handle chatbot messages locally

4. **Custom Styling**
   - Match LearnerAI theme
   - Customize chatbot appearance

## References

- [RAG Chatbot Integration Guide](../../CHATBOT_INTEGRATION_GUIDE.md) (if exists)
- RAG Backend: https://rag-production-3a4c.up.railway.app
- RAG Documentation: See RAG microservice docs

