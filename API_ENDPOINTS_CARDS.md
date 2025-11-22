# 🎴 API Endpoints - Card Format for Presentation

## Card-Based Layout (8 Key Endpoints)

Perfect for visual presentations - matches your slide design!

---

### Card 1
```
┌─────────────────────────────────────┐
│  POST /api/v1/learners              │
│                                     │
│  Create learner profile             │
└─────────────────────────────────────┘
```

### Card 2
```
┌─────────────────────────────────────┐
│  POST /api/v1/skills-gaps           │
│                                     │
│  Receives skills to develop         │
└─────────────────────────────────────┘
```

### Card 3
```
┌─────────────────────────────────────┐
│  POST /api/v1/learning-paths/generate│
│                                     │
│  Triggers AI pipeline (Prompts 1-3) │
│  Returns job ID for async tracking  │
└─────────────────────────────────────┘
```

### Card 4
```
┌─────────────────────────────────────┐
│  GET /api/v1/jobs/:jobId/status     │
│                                     │
│  Frontend shows real-time progress  │
└─────────────────────────────────────┘
```

### Card 5
```
┌─────────────────────────────────────┐
│  GET /api/v1/approvals/:approvalId  │
│                                     │
│  Decision maker reviews path details│
└─────────────────────────────────────┘
```

### Card 6
```
┌─────────────────────────────────────┐
│  POST /api/v1/approvals/:approvalId/│
│  approve                             │
│                                     │
│  Approve path → Auto-send to        │
│  Course Builder                     │
│  Request changes → Update path      │
└─────────────────────────────────────┘
```

### Card 7
```
┌─────────────────────────────────────┐
│  PUT /api/v1/courses/:competency    │
│  TargetName                          │
│                                     │
│  Update path when new gap detected  │
│  (after exam failure)                │
└─────────────────────────────────────┘
```

### Card 8
```
┌─────────────────────────────────────┐
│  GET /api/v1/suggestions/:userId     │
│                                     │
│  Personalized next course options   │
└─────────────────────────────────────┘
```

---

## HTML/CSS Version (For Web Presentations)

```html
<div class="api-endpoints-grid">
  <div class="endpoint-card">
    <div class="method-post">POST</div>
    <div class="endpoint-path">/api/v1/learners</div>
    <div class="description">Create learner profile</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-post">POST</div>
    <div class="endpoint-path">/api/v1/skills-gaps</div>
    <div class="description">Receives skills to develop</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-post">POST</div>
    <div class="endpoint-path">/api/v1/learning-paths/generate</div>
    <div class="description">Triggers AI pipeline (Prompts 1-3)<br/>Returns job ID for async tracking</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-get">GET</div>
    <div class="endpoint-path">/api/v1/jobs/:jobId/status</div>
    <div class="description">Frontend shows real-time progress</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-get">GET</div>
    <div class="endpoint-path">/api/v1/approvals/:approvalId</div>
    <div class="description">Decision maker reviews path details</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-post">POST</div>
    <div class="endpoint-path">/api/v1/approvals/:id/approve</div>
    <div class="description">Approve path → Auto-send to Course Builder<br/>Request changes → Update path</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-put">PUT</div>
    <div class="endpoint-path">/api/v1/courses/:competencyTargetName</div>
    <div class="description">Update path when new gap detected<br/>(after exam failure)</div>
  </div>
  
  <div class="endpoint-card">
    <div class="method-get">GET</div>
    <div class="endpoint-path">/api/v1/suggestions/:userId</div>
    <div class="description">Personalized next course options</div>
  </div>
</div>

<style>
.api-endpoints-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.endpoint-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.endpoint-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.method-post {
  display: inline-block;
  background: #4ecdc4;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.method-get {
  display: inline-block;
  background: #6bcf7f;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.method-put {
  display: inline-block;
  background: #ffd93d;
  color: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.endpoint-path {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>
```

---

## Markdown Table Version (Simpler)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/v1/learners` | Create learner profile |
| **POST** | `/api/v1/skills-gaps` | Receives skills to develop |
| **POST** | `/api/v1/learning-paths/generate` | Triggers AI pipeline (Prompts 1-3)<br/>Returns job ID for async tracking |
| **GET** | `/api/v1/jobs/:jobId/status` | Frontend shows real-time progress |
| **GET** | `/api/v1/approvals/:approvalId` | Decision maker reviews path details |
| **POST** | `/api/v1/approvals/:approvalId/approve` | Approve path → Auto-send to Course Builder<br/>Request changes → Update path |
| **PUT** | `/api/v1/courses/:competencyTargetName` | Update path when new gap detected<br/>(after exam failure) |
| **GET** | `/api/v1/suggestions/:userId` | Personalized next course options |

---

## For PowerPoint/Keynote

**Layout:** 3 columns × 3 rows (8 cards, last row has 2)

**Card Design:**
- White background
- Light gray border
- Bold endpoint path (larger font)
- Description below (smaller font)
- Color-coded method badges:
  - POST = Teal (#4ecdc4)
  - GET = Green (#6bcf7f)
  - PUT = Yellow (#ffd93d)

**Title:** "API Endpoints Overview"

---

## Quick Copy-Paste for Your Slide

```
API Endpoints Overview

POST /api/v1/learners
Create learner profile

POST /api/v1/skills-gaps
Receives skills to develop

POST /api/v1/learning-paths/generate
Triggers AI pipeline (Prompts 1-3)
Returns job ID for async tracking

GET /api/v1/jobs/:jobId/status
Frontend shows real-time progress

GET /api/v1/approvals/:approvalId
Decision maker reviews path details

POST /api/v1/approvals/:approvalId/approve
Approve path → Auto-send to Course Builder
Request changes → Update path

PUT /api/v1/courses/:competencyTargetName
Update path when new gap detected
(after exam failure)

GET /api/v1/suggestions/:userId
Personalized next course options
```

---

**Yes, it's good!** ✅ The table covers all important endpoints and matches your workflow. Use the card format above if you want it to match your visual style exactly!

