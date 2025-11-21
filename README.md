# LearnerAI

An intelligent learning companion application that generates adaptive learning paths using AI, integrates with microservices, and provides comprehensive learning analytics.

## 🎯 Overview

LearnerAI is a microservice that generates personalized learning paths based on skills gaps, manages company approval workflows, and distributes learning content to various analytics and course building services. It uses Google Gemini AI to create detailed, step-by-step learning paths tailored to individual learners.

## ✨ Key Features

### 1. Adaptive Learning Path Generation
- Receives skills gaps from Skills Engine microservice
- Uses 3-stage AI prompt pipeline to generate detailed learning paths
- Expands competencies, identifies skill breakdowns, and creates structured learning steps
- Stores learning paths with full details (steps, resources, objectives, duration)

### 2. Company Approval Workflow
- Supports both **auto** and **manual** approval policies per company
- For manual approval: Creates approval requests, sends notifications to decision makers
- Decision makers can approve/reject learning paths with feedback
- Only approved paths are sent to Course Builder microservice

### 3. Path Distribution & Analytics
- Distributes learning paths to Course Builder microservice
- Updates Learning Analytics and Management Reports microservices
- Supports on-demand and batch data requests
- Maintains complete traceability of learning path data

### 4. Course Completion & Suggestions
- Detects course completions from Skills Engine
- Generates next course suggestions using AI
- Sends suggestions to RAG microservice for further recommendations

## 🏗️ Project Structure

```
learnerAI/
├── frontend/              # React + Vite frontend (deployed on Vercel)
│   ├── src/
│   │   ├── components/   # UI components (Header, LearningPathTimeline, etc.)
│   │   ├── pages/        # Company Dashboard, User View
│   │   └── services/     # API client services
│   └── public/           # Static assets
│
├── backend/              # Express REST API (deployed on Railway)
│   ├── src/
│   │   ├── api/          # Express routes
│   │   ├── application/  # Use cases (business logic)
│   │   ├── domain/       # Domain entities
│   │   ├── infrastructure/ # Repositories, clients, services
│   │   └── utils/        # Utilities and mock data
│   ├── assets/           # Logo files (light/dark)
│   └── railway.json      # Railway deployment config
│
├── database/             # Database schemas and migrations
│   └── migrations/       # SQL migration files
│
├── docs/                 # Project documentation
│   ├── guides/           # Testing guides, deployment guides, API docs
│   ├── architecture.md   # System architecture details
│   ├── requirements.md   # Feature requirements
│   └── setup-guide.md    # Development setup instructions
│
└── .github/              # GitHub Actions workflows
    └── workflows/        # CI/CD pipelines
```

## 🛠️ Technology Stack

- **Frontend**: React, JavaScript, JSX, Vite, TailwindCSS
- **Backend**: Node.js, Express, REST API
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Deployment**: Vercel (frontend), Railway (backend)
- **CI/CD**: GitHub Actions
- **Architecture**: Onion Architecture (Domain, Application, Infrastructure, API layers)

## 📊 Database Schema

The system uses 8 core tables in Supabase:

1. **companies** - Company information and approval policies
2. **learners** - User/learner profiles
3. **skills_gap** - Skills gaps with raw JSONB data
4. **skills_expansions** - AI prompt outputs (Prompt 1 & 2)
5. **courses** - Generated learning paths (Prompt 3 results)
6. **recommendations** - Course suggestions (Prompt 4 results)
7. **jobs** - Background job processing status
8. **path_approvals** - Approval requests for manual approval workflow

## 🔌 Microservice Integrations

LearnerAI integrates with the following microservices:

- **Skills Engine** - Receives skills gaps, requests skill breakdowns
- **Course Builder** - Sends approved learning paths
- **Learning Analytics** - Updates with learning path data (on-demand & batch)
- **Management Reports** - Updates with learning path data
- **RAG Microservice** - Receives course suggestions
- **Directory** - Receives company registration/updates

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc` for version)
- npm 10+
- Supabase account and project
- Google Gemini API key

### Frontend Development

```bash
cd frontend
npm install
cp env.template .env
# Edit .env with your VITE_API_URL
npm run dev
```

### Backend Development

```bash
cd backend
npm install
cp env.template .env
# Edit .env with your configuration (see backend/SETUP_ENV.md)
npm start
```

### Database Setup

1. Create a Supabase project
2. Run the migration file: `database/migrations/init_schema_migration.sql`
3. Seed the database: `POST /api/seed` (or use `backend/src/utils/seedDatabase.js`)

See `docs/setup-guide.md` for detailed setup instructions.

## 📚 Documentation

- **[Architecture](docs/architecture.md)** - System architecture and design patterns
- **[Requirements](docs/requirements.md)** - Feature requirements and specifications
- **[API Endpoints](backend/API_ENDPOINTS.md)** - Complete API documentation
- **[Setup Guide](docs/setup-guide.md)** - Development environment setup
- **[Deployment Guides](docs/guides/)** - Railway and Vercel deployment instructions
- **[Testing Guides](docs/guides/)** - End-to-end testing procedures

## 🔑 Key API Endpoints

- `GET /api/v1/learning-paths/generate` - Generate learning path (async)
- `GET /api/v1/jobs/:jobId/status` - Check job status
- `GET /api/v1/courses/user/:userId` - Get user's courses
- `GET /api/v1/approvals/pending/:decisionMakerId` - Get pending approvals
- `POST /api/v1/approvals/:approvalId/approve` - Approve learning path
- `POST /api/v1/approvals/:approvalId/reject` - Reject learning path
- `POST /api/fill-learner-ai-fields` - Generic endpoint for microservice data
- `POST /api/v1/ai/query` - Generic AI query endpoint

See [API_ENDPOINTS.md](backend/API_ENDPOINTS.md) for complete documentation.

## 🎨 Frontend Features

### Company Dashboard
- View all users in a company
- Display learning paths for each user
- Search and filter functionality
- Path selector (tabs for ≤5 paths, dropdown for >5)

### User View
- View all registered courses
- Step-by-step learning path timeline
- Detailed step information (objectives, resources, duration)
- Responsive design with light/dark mode

## 🔄 Key Workflows

### Learning Path Generation Flow
1. Skills Engine sends skills gap → `POST /api/fill-learner-ai-fields`
2. System processes gap → Updates `skills_gap` table
3. Background job starts → Generates learning path using 3 AI prompts
4. Job completes → Learning path stored in `courses` table
5. Approval check → If manual, creates approval request (unless update after failure)
6. Distribution → Sends to Course Builder (if approved or update after failure)

### Approval Workflow
1. **Check if update after exam failure:**
   - If course exists AND `exam_status: 'fail'` → Skip approval, auto-distribute
2. **Otherwise, check company policy:**
   - Company has `approval_policy: 'manual'`
   - Learning path generated → Approval request created
   - Decision maker notified → `GET /api/v1/approvals/pending/:id`
   - Decision made → `POST /api/v1/approvals/:id/approve` or `/reject`
   - If approved → Path sent to Course Builder
   - If rejected → Feedback stored, path not distributed

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test suite
npm test -- skillsGaps.test.js
```

See `docs/guides/` for comprehensive testing guides.

## 🚢 Deployment

### Railway (Backend)
- Set Root Directory to `backend`
- Configure environment variables
- Deploy via GitHub Actions or Railway CLI

### Vercel (Frontend)
- Connect GitHub repository
- Set build directory to `frontend`
- Configure `VITE_API_URL` environment variable

See deployment guides in `docs/guides/` for detailed instructions.

## 📝 Project Decisions

All architectural and design decisions are documented in [`Project Refinement Log.md`](Project%20Refinement%20Log.md).

## 📄 License

ISC

---

**Last Updated**: 2025-01-20  
**Version**: 1.0.0
