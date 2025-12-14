# Chatbot Integration - Usage Guide

This guide explains how the Educore Chatbot is integrated into the LearnerAI frontend.

## ✅ Integration Status

**The chatbot is already integrated in `App.jsx`!** It will automatically initialize when a user is authenticated.

## Quick Start

### Option 1: Using the ChatbotContainer Component (Recommended)

```jsx
import ChatbotContainer from './components/ChatbotContainer';

function App() {
  const user = getCurrentUser(); // Your authentication logic
  const token = getAuthToken(); // Your token retrieval logic

  return (
    <div className="App">
      {/* Your app content */}
      
      {/* Add chatbot container */}
      <ChatbotContainer 
        userId={user?.id}
        token={token}
        tenantId={user?.tenantId}
      />
    </div>
  );
}
```

### Option 2: Using the useChatbot Hook Directly

```jsx
import { useChatbot } from './hooks/useChatbot';

function MyComponent() {
  const user = getCurrentUser();
  const token = getAuthToken();

  useChatbot({
    userId: user?.id,
    token: token,
    tenantId: user?.tenantId,
    enabled: !!user && !!token
  });

  return (
    <div>
      {/* Your component content */}
      <div id="edu-bot-container"></div>
    </div>
  );
}
```

## Integration Steps

1. **Add the container to your layout:**
   - Import `ChatbotContainer` component
   - Add it to your main App component or any page where you want the chatbot

2. **Pass authentication data:**
   - `userId` - The authenticated user's ID
   - `token` - The authentication token (JWT or session token)
   - `tenantId` - Optional tenant ID (defaults to "default")

3. **The chatbot will automatically:**
   - Load the script from the RAG backend
   - Initialize when user is authenticated
   - Handle errors gracefully

## Current Implementation

The chatbot is already integrated in `App.jsx`:

```jsx
import ChatbotContainer from './components/ChatbotContainer';
import { getCurrentUser, getAuthToken } from './utils/auth';

function App() {
  const user = getCurrentUser();
  const token = getAuthToken();

  return (
    <AppProvider>
      <div className="App">
        {/* ... routes ... */}
        <ChatbotContainer 
          userId={user?.id}
          token={token}
          tenantId={user?.tenantId}
        />
      </div>
    </AppProvider>
  );
}
```

## Authentication Setup

The app uses `src/utils/auth.js` for authentication. Currently, it reads from `localStorage`:

- `localStorage.getItem('user')` - User object with `id` and `tenantId`
- `localStorage.getItem('token')` - Authentication token

**To enable the chatbot:**
1. Set user in localStorage: `localStorage.setItem('user', JSON.stringify({ id: 'user-id', tenantId: 'tenant-id' }))`
2. Set token in localStorage: `localStorage.setItem('token', 'your-token')`

**Or use the utility functions:**
```js
import { setAuth } from './utils/auth';
setAuth({ id: 'user-id', tenantId: 'tenant-id' }, 'your-token');
```

When real authentication is implemented, update `src/utils/auth.js` to use your auth service.

## Configuration

The chatbot is configured for the **LEARNER_AI** microservice, which uses **CHAT MODE**:
- Messages are sent to the RAG API
- Responses come from RAG (OpenAI + Knowledge Base)
- Endpoint: `/api/v1/query`

## Troubleshooting

- **Chatbot not appearing:** 
  - Check that user and token are set in localStorage
  - Open browser console (F12) and check for errors
  - Verify the script is loading: `https://rag-production-3a4c.up.railway.app/embed/bot.js`
  
- **Script loading errors:** 
  - Check browser console and network tab
  - Verify the RAG backend is accessible
  
- **CORS errors:** 
  - Not applicable for CHAT MODE (only for SUPPORT MODE)
  - If you see CORS errors, contact the RAG team

- **Testing without real auth:**
  ```js
  // In browser console:
  localStorage.setItem('user', JSON.stringify({ id: 'test-user', tenantId: 'default' }));
  localStorage.setItem('token', 'test-token');
  // Then refresh the page
  ```

## Files Created

- `src/components/ChatbotContainer.jsx` - React component for chatbot
- `src/hooks/useChatbot.js` - React hook for chatbot initialization
- `src/utils/auth.js` - Authentication utility (placeholder for real auth)

For more details, see: `docs/guides/CHATBOT_INTEGRATION_GUIDE.md`

