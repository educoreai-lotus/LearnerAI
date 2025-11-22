# 📊 Important API Endpoints by Phase

## Complete Learning Path Lifecycle

| Phase | Endpoint | Why It Matters |
|-------|----------|---------------|
| **① Company Registration** | `POST /api/v1/companies/register` | Receives company data from Directory microservice. Sets approval policy (auto/manual) and decision maker info. |
| **② New Learner** | `POST /api/v1/learners` | Creates learner profile linked to company. Required before any learning paths can be generated. |
| **③ Identify Skill Gap** | `POST /api/v1/skills-gaps` | Receives skills gap data from Skills Engine. Triggers learning path generation workflow. Stores exam status (pass/fail). |
| **④ Generate Learning Path** | `POST /api/v1/learning-paths/generate` | Triggers AI pipeline (Prompts 1, 2, 3 via Gemini API). Returns job ID for async processing. Creates learning path with modules. |
| **⑤ Check Job Status** | `GET /api/v1/jobs/:jobId/status` | Frontend polls this to show progress. Returns status (pending/processing/completed/failed) and progress percentage. |
| **⑥ Get Learning Path** | `GET /api/v1/courses/user/:userId` | Retrieves all learning paths for a user. Used by frontend to display paths in User View and Company Dashboard. |
| **⑦ Approval Workflow** | `GET /api/v1/approvals/:approvalId` | Gets approval details with full learning path. Used by decision maker to review path before approval. |
| **⑧ Approve/Reject Path** | `POST /api/v1/approvals/:approvalId/approve`<br/>`POST /api/v1/approvals/:approvalId/request-changes` | Decision maker approves or requests changes. If approved, path is automatically sent to Course Builder. |
| **⑨ Update Learning Path** | `PUT /api/v1/courses/:competencyTargetName` | Updates learning path when new gap detected after exam failure. Triggers regeneration with updated skills data. |
| **⑩ Record Completion** | `POST /api/v1/completions` | Records course completion. Triggers Prompt 4 to generate next course suggestions. |
| **⑪ Get Suggestions** | `GET /api/v1/suggestions/:userId` | Returns personalized course recommendations after completion. Helps learners find next learning path. |
| **⑫ Get Pending Approvals** | `GET /api/v1/approvals/pending/:decisionMakerId` | Lists all pending approvals for a decision maker. Used in Approvals List page. |

---

## Alternative: Simplified Version (6 Key Phases)

| Phase | Endpoint | Why It Matters |
|-------|----------|---------------|
| **① New Learner** | `POST /api/v1/learners` | Create learner profile in the system |
| **② Identify Skill Gap** | `POST /api/v1/skills-gaps` | Receives skills to develop from Skills Engine |
| **③ Generate Path** | `POST /api/v1/learning-paths/generate` | Triggers AI pipeline (Prompts 1-3 via Gemini API) - async job |
| **④ Check Progress** | `GET /api/v1/jobs/:jobId/status` | Frontend can show real-time generation progress |
| **⑤ Approve Course** | `POST /api/v1/approvals/:approvalId/approve`<br/>`GET /api/v1/approvals/:approvalId` | Manual QA step before releasing to learners. Auto-approval also supported. |
| **⑥ Get Suggestions** | `GET /api/v1/suggestions/:userId` | Personalized follow-up course options after completion |

---

## Extended Version: Complete Workflow

| Phase | Endpoint | Why It Matters |
|-------|----------|---------------|
| **① Company Setup** | `POST /api/v1/companies/register` | Receives company from Directory. Sets approval policy (auto/manual) and decision maker. |
| **② Create Learner** | `POST /api/v1/learners` | Creates learner profile linked to company. Required for all learning operations. |
| **③ Skills Gap Detection** | `POST /api/v1/skills-gaps` | Receives gap from Skills Engine. Stores exam status. Triggers path generation if needed. |
| **④ Generate Learning Path** | `POST /api/v1/learning-paths/generate` | Starts AI pipeline: Prompt 1 (Expand) → Prompt 2 (Identify) → Skills Engine → Prompt 3 (Create Path). Returns job ID. |
| **⑤ Track Generation** | `GET /api/v1/jobs/:jobId/status` | Polling endpoint for frontend. Shows progress: pending → processing → completed. |
| **⑥ View Learning Paths** | `GET /api/v1/courses/user/:userId` | Gets all courses/paths for user. Used in User View and Company Dashboard. |
| **⑦ Approval Review** | `GET /api/v1/approvals/:approvalId` | Decision maker reviews full path details. Returns approval + learning path data. |
| **⑧ Approve/Request Changes** | `POST /api/v1/approvals/:approvalId/approve`<br/>`POST /api/v1/approvals/:approvalId/request-changes` | Decision maker action. If approved, automatically distributes to Course Builder. |
| **⑨ Update After Failure** | `PUT /api/v1/courses/:competencyTargetName`<br/>`POST /api/v1/skills-gaps` | When learner fails exam, new gap created. Path updated with remaining skills. Regenerates path. |
| **⑩ Course Completion** | `POST /api/v1/completions` | Records completion. Triggers Prompt 4 for next course suggestions. |
| **⑪ Get Recommendations** | `GET /api/v1/suggestions/:userId` | Returns personalized next course options. Helps learner continue learning journey. |
| **⑫ List Approvals** | `GET /api/v1/approvals/pending/:decisionMakerId` | Shows all pending approvals for decision maker dashboard. |

---

## Microservice Integration Endpoints

| Phase | Endpoint | Why It Matters |
|-------|----------|---------------|
| **Incoming: Company Data** | `POST /api/v1/companies/register` | Directory microservice sends company updates. Updates approval policies. |
| **Incoming: Skills Gap** | `POST /api/v1/skills-gaps` | Skills Engine sends exam results and skill gaps. Triggers learning path generation. |
| **Incoming: Data Request** | `POST /api/fill-content-metrics` | Learning Analytics requests user data on-demand. Returns courses without learning_path (unless requested). |
| **Outgoing: Skill Breakdown** | `POST {SKILLS_ENGINE_URL}/api/skills/breakdown` | Requests micro/nano skill breakdown for competencies. Used in Prompt 3 pipeline. |
| **Outgoing: Distribute Path** | `POST {COURSE_BUILDER_URL}/api/v1/learning-paths` | Sends approved learning path to Course Builder for content creation. |
| **Outgoing: Send Analytics** | `POST {ANALYTICS_URL}/api/v1/paths/batch` | Sends batch learning path data to Learning Analytics. Daily scheduled job. |

---

## Frontend-Specific Endpoints

| Page/Feature | Endpoint | Why It Matters |
|--------------|----------|---------------|
| **User View** | `GET /api/v1/courses/user/:userId` | Loads all learning paths for the logged-in user. Displays in timeline format. |
| **Company Dashboard** | `GET /api/v1/learners/company/:companyId`<br/>`GET /api/v1/courses/user/:userId` | Gets all learners in company, then their courses. Shows company-wide learning progress. |
| **Approvals List** | `GET /api/v1/approvals/pending/:decisionMakerId` | Lists all pending approvals for decision maker. Shows in Approvals List page. |
| **Approval Review** | `GET /api/v1/approvals/:approvalId` | Gets full approval details with learning path. Used in Approval Review page. |
| **Approve Action** | `POST /api/v1/approvals/:approvalId/approve` | Decision maker approves learning path. Updates status and distributes to Course Builder. |
| **Request Changes** | `POST /api/v1/approvals/:approvalId/request-changes` | Decision maker requests modifications. Includes feedback for path improvement. |

---

## Quick Reference: Most Important Endpoints

| # | Endpoint | Method | Purpose |
|---|----------|--------|---------|
| 1 | `/api/v1/learners` | POST | Create learner |
| 2 | `/api/v1/skills-gaps` | POST | Receive skill gap |
| 3 | `/api/v1/learning-paths/generate` | POST | Generate path (AI) |
| 4 | `/api/v1/jobs/:jobId/status` | GET | Check generation progress |
| 5 | `/api/v1/courses/user/:userId` | GET | Get user's learning paths |
| 6 | `/api/v1/approvals/:approvalId` | GET | Review approval details |
| 7 | `/api/v1/approvals/:approvalId/approve` | POST | Approve learning path |
| 8 | `/api/v1/approvals/:approvalId/request-changes` | POST | Request path changes |
| 9 | `/api/v1/courses/:competencyTargetName` | PUT | Update learning path |
| 10 | `/api/v1/completions` | POST | Record completion |
| 11 | `/api/v1/suggestions/:userId` | GET | Get next course suggestions |

---

## For Your Presentation Slide

**Recommended Table Format:**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase │ Endpoint │ Why It Matters                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ①     │ POST     │ Create learner profile                   │
│       │ /learners│                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ②     │ POST     │ Receives skills to develop               │
│       │ /skills- │                                           │
│       │ gaps     │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ③     │ POST     │ Triggers AI pipeline (Prompts 1-3)       │
│       │ /learning│ Returns job ID for async tracking         │
│       │ -paths/  │                                           │
│       │ generate │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ④     │ GET      │ Frontend shows real-time progress        │
│       │ /jobs/   │                                           │
│       │ :id/     │                                           │
│       │ status   │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ⑤     │ GET      │ Decision maker reviews path details      │
│       │ /approvals│                                          │
│       │ /:id     │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ⑥     │ POST     │ Approve path → Auto-send to Course       │
│       │ /approvals│ Builder                                  │
│       │ /:id/    │ Request changes → Update path             │
│       │ approve  │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ⑦     │ PUT      │ Update path when new gap detected        │
│       │ /courses/│ (after exam failure)                     │
│       │ :name    │                                           │
├───────┼──────────┼───────────────────────────────────────────┤
│ ⑧     │ GET      │ Personalized next course options         │
│       │ /suggestions│                                        │
│       │ /:userId  │                                           │
└───────┴──────────┴───────────────────────────────────────────┘
```

---

## Tips for Presentation

1. **Use the "Simplified Version"** for a clean slide
2. **Use the "Extended Version"** for detailed explanation
3. **Highlight the AI endpoints** - Show the intelligence
4. **Show the loop** - Update path after failure
5. **Emphasize approval workflow** - Enterprise feature

---

**Copy any table above and use in your presentation!** 🚀

