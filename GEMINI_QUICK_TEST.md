# 🚀 Quick Gemini API Test

## ⚡ Fastest Test (30 seconds)

```bash
# 1. Health check
curl http://localhost:5000/api/v1/ai/health

# 2. Run test script
cd backend
node test-gemini.js
```

---

## ✅ Expected Results

### Health Check Response:
```json
{
  "status": "healthy",
  "service": "Gemini AI",
  "model": "gemini-2.5-flash"
}
```

### Test Script Output:
```
✅ GEMINI_API_KEY found
✅ Gemini client initialized
✅ Prompt loader initialized
✅ Gemini API responded
✅ Prompt 1 loaded
✅ Prompt 2 loaded
✅ Prompt 3 loaded
✅ Prompt 1 executed successfully!
```

---

## 🔍 What Gets Tested

1. **API Key** - Checks if `GEMINI_API_KEY` exists
2. **Client Init** - Verifies Gemini client can initialize
3. **Prompt Loading** - Tests loading all 4 prompts
4. **API Call** - Sends test request to Gemini
5. **Prompt Execution** - Runs Prompt 1 with sample data
6. **Placeholders** - Verifies prompt templates have correct placeholders

---

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY not found` | Add to `backend/.env` |
| `Prompt file not found` | Check `backend/src/infrastructure/prompts/prompts/` |
| `API key not valid` | Get new key from Google AI Studio |
| `Request timeout` | Check network or increase timeout |

---

## 📊 Full Workflow Test

```bash
# 1. Health check
curl http://localhost:5000/api/v1/ai/health

# 2. Generate learning path
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "competencyTargetName": "..."}'

# 3. Check job status
curl http://localhost:5000/api/v1/jobs/{jobId}/status
```

---

## 📝 Check Logs

Watch backend console for:
- `✅ Using Gemini model: gemini-2.5-flash`
- `✅ Loaded prompt: prompt1-skill-expansion`
- `✅ Prompt 1 executed successfully`
- `✅ Prompt 2 executed successfully`
- `✅ Prompt 3 executed successfully`

---

**All green?** ✅ Gemini API is working perfectly!

