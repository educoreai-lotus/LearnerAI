# 🧪 How to Test the Chatbot

## ✅ Quick Test (3 Steps)

### Step 1: Start your frontend
```bash
cd frontend
npm run dev
```

### Step 2: Open browser console (F12)
Open your browser's developer console (Press F12)

### Step 3: Set test user and token
Copy and paste this into the console:

```javascript
localStorage.setItem('user', JSON.stringify({ 
  id: 'test-user-123', 
  tenantId: 'default' 
}));
localStorage.setItem('token', 'test-token-123');
location.reload();
```

## 🎯 What to Look For

### ✅ Success Indicators:
1. **In Console:** You should see:
   - `✅ Chatbot script loaded`
   - `✅ Chatbot initialized successfully`

2. **On Page:** 
   - Look for a chatbot widget (usually bottom-right corner)
   - It might be a chat bubble or button

3. **In Network Tab (F12 → Network):**
   - You should see a request to: `https://rag-production-3a4c.up.railway.app/embed/bot.js`

### ❌ If it's not working:

1. **Check Console for errors:**
   - Red errors = something went wrong
   - Look for messages about script loading

2. **Verify localStorage:**
   ```javascript
   console.log('User:', localStorage.getItem('user'));
   console.log('Token:', localStorage.getItem('token'));
   ```
   Both should NOT be null

3. **Check if container exists:**
   ```javascript
   document.querySelector('#edu-bot-container')
   ```
   Should return a `<div>` element

4. **Check if script loaded:**
   ```javascript
   document.querySelector('script[src*="bot.js"]')
   ```
   Should return a `<script>` element

5. **Check if function exists:**
   ```javascript
   typeof window.initializeEducoreBot
   ```
   Should return `"function"`

## 🔍 Debug Checklist

- [ ] Frontend is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] User and token are set in localStorage
- [ ] Page was reloaded after setting localStorage
- [ ] No CORS errors in console
- [ ] Script loaded successfully (check Network tab)
- [ ] Container element exists on page

## 🐛 Common Issues

### "Chatbot container not found"
- The container div should be created by `ChatbotContainer` component
- Check that `App.jsx` includes `<ChatbotContainer />`

### "Failed to load chatbot script"
- Check internet connection
- Verify URL: `https://rag-production-3a4c.up.railway.app/embed/bot.js`
- Check if RAG backend is accessible

### "Chatbot not appearing"
- Make sure both `userId` and `token` are set
- Check console for initialization messages
- The chatbot might be hidden/minimized - look for a chat icon

### Script loads but chatbot doesn't initialize
- Check that `window.initializeEducoreBot` is a function
- Verify the function is called with correct parameters
- Check console for initialization errors

## 📝 Test Script

Run this in browser console to test everything:

```javascript
// Test script
console.log('🧪 Testing Chatbot Integration...');

// 1. Check localStorage
const user = localStorage.getItem('user');
const token = localStorage.getItem('token');
console.log('1. localStorage:', { user: !!user, token: !!token });

// 2. Check container
const container = document.querySelector('#edu-bot-container');
console.log('2. Container exists:', !!container);

// 3. Check script
const script = document.querySelector('script[src*="bot.js"]');
console.log('3. Script loaded:', !!script);

// 4. Check function
const hasFunction = typeof window.initializeEducoreBot === 'function';
console.log('4. Function available:', hasFunction);

// 5. Summary
if (user && token && container && script && hasFunction) {
  console.log('✅ All checks passed! Chatbot should be working.');
} else {
  console.log('❌ Some checks failed. See details above.');
}
```

## 🚀 Next Steps

Once the chatbot is working:
1. Replace test user/token with real authentication
2. Update `src/utils/auth.js` to use your auth service
3. The chatbot will automatically work with real users!

---

**Need help?** Check `CHATBOT_USAGE.md` or `docs/guides/CHATBOT_INTEGRATION_GUIDE.md`

