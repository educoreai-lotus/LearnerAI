# ✅ Correct API Endpoints - Full Paths

## Answer: The Full Path is Correct!

**Correct Path:** `/api/v1/learners` ✅  
**Incorrect:** `/learners` ❌

---

## Why the Confusion?

1. **In Code (server.js):**
   ```javascript
   app.use('/api/v1/learners', createLearnersRouter(dependencies));
   ```
   This is the full path registered in Express

2. **In Router (learners.js):**
   ```javascript
   router.post('/', ...)  // This is relative to the base
   ```
   The `'/'` is relative to `/api/v1/learners`, so effectively it's `/api/v1/learners`

3. **In Documentation:**
   Sometimes people write just `/learners` as shorthand, but that's incorrect!

---

## All Correct Endpoints (8 Key Endpoints)

| # | Method | Full Endpoint | Description |
|---|--------|---------------|-------------|
| 1 | **POST** | `/api/v1/learners` | Create learner profile |
| 2 | **POST** | `/api/v1/skills-gaps` | Receive skills gaps |
| 3 | **POST** | `/api/v1/learning-paths/generate` | Generate learning path (AI) |
| 4 | **GET** | `/api/v1/jobs/:jobId/status` | Check generation status |
| 5 | **GET** | `/api/v1/approvals/:approvalId` | Review approval details |
| 6 | **POST** | `/api/v1/approvals/:approvalId/approve` | Approve learning path |
| 7 | **PUT** | `/api/v1/courses/:competencyTargetName` | Update learning path |
| 8 | **GET** | `/api/v1/suggestions/:userId` | Get course suggestions |

---

## Base URL

**Base URL:** `http://localhost:5000` (in development)  
**API Prefix:** `/api/v1`

**Example:**
- Base URL: `http://localhost:5000`
- Endpoint: `/api/v1/learners`
- **Full URL:** `http://localhost:5000/api/v1/learners` ✅

---

## Summary

✅ **Always use the full path:** `/api/v1/...`  
❌ **Don't use shorthand:** `/learners` (this won't work!)

**All files have been updated to be consistent with the full path!** ✅

---

## Quick Reference

When documenting or presenting:
- ✅ Write: `POST /api/v1/learners`
- ❌ Don't write: `POST /learners`

The `/api/v1` prefix is **required** and part of the actual endpoint path!
