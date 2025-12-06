# Full Stack Interview Preparation Guide

## 📋 Table of Contents
1. [Project Overview & Talking Points](#project-overview--talking-points)
2. [Technical Deep-Dives](#technical-deep-dives)
3. [General Full Stack Questions](#general-full-stack-questions)
4. [LeetCode Practice](#leetcode-practice)
5. [System Design Concepts](#system-design-concepts)
6. [Common Interview Scenarios](#common-interview-scenarios)

---

## 🎯 Project Overview & Talking Points

### Elevator Pitch (30 seconds)
> "LearnerAI is a microservice-based learning platform that uses AI to generate personalized learning paths. It integrates with multiple microservices, handles company approval workflows, and provides analytics. Built with React frontend on Vercel, Express backend on Railway, PostgreSQL on Supabase, and Google Gemini AI."

### Key Features to Highlight

1. **AI-Powered Learning Path Generation**
   - 3-stage prompt pipeline using Google Gemini
   - Converts skills gaps into structured learning paths
   - Handles async processing with job queues

2. **Microservices Architecture**
   - Integrates with 6+ external microservices
   - RESTful API design
   - Service-to-service authentication

3. **Approval Workflow System**
   - Auto vs Manual approval policies per company
   - Decision maker notifications
   - Exception handling for exam failures

4. **Full Stack Implementation**
   - React frontend with modern hooks (useContext, useCallback)
   - Express.js backend with Onion Architecture
   - Real-time job status polling
   - Responsive UI with dark mode

5. **CI/CD & DevOps**
   - GitHub Actions workflows
   - Automated testing (Jest)
   - Deployment to Vercel & Railway
   - Environment variable management

### Numbers & Metrics to Mention
- **8 database tables** with proper relationships
- **15+ API endpoints** with comprehensive documentation
- **10+ use cases** following clean architecture
- **100% test coverage** for critical workflows
- **6 microservice integrations** with error handling

---

## 🔧 Technical Deep-Dives

### Architecture Questions

**Q: "Tell me about your architecture."**
- **Answer:** "I used Onion Architecture (Domain-Driven Design) with 4 layers:
  - **Domain Layer**: Entities (Company, PathApproval, LearningPath) with business logic
  - **Application Layer**: Use cases (GenerateLearningPathUseCase, DistributePathUseCase)
  - **Infrastructure Layer**: Repositories, API clients, external service integrations
  - **API Layer**: Express routes that orchestrate use cases
  
  This separation allows me to test business logic independently and swap implementations easily."

**Q: "Why did you choose this architecture?"**
- **Answer:** "It provides:
  1. **Testability**: I can mock infrastructure layer and test business logic in isolation
  2. **Maintainability**: Clear separation of concerns makes code easier to understand
  3. **Flexibility**: Can swap Supabase for another DB without changing use cases
  4. **Scalability**: Easy to add new features without affecting existing code"

### Database Design

**Q: "How did you design your database schema?"**
- **Answer:** "I have 8 core tables:
  - `companies`: Stores approval policies and decision makers
  - `learners`: User profiles linked to companies
  - `skills_gap`: Raw JSONB data from Skills Engine
  - `skills_expansions`: AI prompt outputs (cached for reuse)
  - `courses`: Generated learning paths (JSONB for flexibility)
  - `path_approvals`: Approval workflow state
  - `recommendations`: AI-generated course suggestions
  - `jobs`: Background job status tracking
  
  I used JSONB for flexible data structures while maintaining relational integrity with foreign keys."

**Q: "Why JSONB instead of normalized tables?"**
- **Answer:** "Learning paths have variable structures - different competencies have different steps, resources, and metadata. JSONB allows:
  - Flexibility to store varying structures
  - PostgreSQL's powerful JSON querying
  - Easy integration with AI-generated content
  - Still maintain referential integrity with foreign keys"

### Async Processing

**Q: "How do you handle long-running AI operations?"**
- **Answer:** "I use a job queue pattern:
  1. API receives request → immediately returns job ID (202 Accepted)
  2. Background job processes asynchronously:
     - Updates job status: 'processing' → 'completed'/'failed'
     - Executes 3 sequential AI prompts
     - Stores intermediate results
  3. Frontend polls `/api/v1/jobs/:jobId/status` endpoint
  4. When complete, frontend fetches the learning path
  
  This prevents timeouts and provides good UX with progress tracking."

### Error Handling

**Q: "How do you handle microservice failures?"**
- **Answer:** "I implement multiple strategies:
  1. **Retry Logic**: 3 attempts with exponential backoff
  2. **Graceful Degradation**: If Course Builder fails, I still update Analytics
  3. **Rollback Data**: Each service provides mock data for fallback
  4. **Error Logging**: All failures logged with context
  5. **User Feedback**: Clear error messages without exposing internals
  
  Example: If Reports service is down, I use `getRollbackMockData()` to continue workflow."

### Testing Strategy

**Q: "How do you test your application?"**
- **Answer:** "I use Jest with comprehensive mocking:
  - **Unit Tests**: Test use cases in isolation with mocked dependencies
  - **Integration Tests**: Test API routes with mocked repositories
  - **Test Helpers**: Reusable mock factories (createMockCompany, createMockPathApproval)
  
  Key principle: Mock external dependencies (Supabase, Gemini, microservices) to test business logic independently."

---

## 💻 General Full Stack Questions

### Frontend

**Q: "Explain React hooks you used."**
- **useState**: Component state management
- **useEffect**: Side effects (API calls, subscriptions)
- **useCallback**: Memoize functions to prevent unnecessary re-renders
- **useContext**: Global state (theme, user data)
- **Custom hooks**: `useTheme` for theme management

**Q: "How do you handle API calls in React?"**
- **Answer:** "I use async/await in useEffect with proper cleanup:
  ```javascript
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const data = await api.getData();
      if (!cancelled) setData(data);
    };
    loadData();
    return () => { cancelled = true; };
  }, [dependencies]);
  ```
  This prevents state updates after component unmounts."

**Q: "Explain your component structure."**
- **Answer:** "I follow a component hierarchy:
  - **Pages**: Top-level route components (CompanyDashboard, UserView)
  - **Components**: Reusable UI (Header, LearningPathTimeline, Toast)
  - **Services**: API client abstraction
  - **Context**: Global state management (AppContext)
  
  Components are small, focused, and reusable."

### Backend

**Q: "How do you structure your Express routes?"**
- **Answer:** "I organize by feature:
  - `/api/v1/learning-paths` - Path generation
  - `/api/v1/approvals` - Approval workflow
  - `/api/v1/courses` - Course management
  - `/api/v1/skills-gaps` - Skills gap processing
  
  Each route file imports use cases and handles HTTP concerns (validation, status codes, error handling). Business logic stays in use cases."

**Q: "How do you handle authentication?"**
- **Answer:** "I use service-to-service authentication:
  - Each microservice has a token
  - Requests include `Authorization: Bearer <token>` header
  - Backend validates token before processing
  - Frontend stores token in environment variables (never in code)"

**Q: "Explain middleware usage."**
- **Answer:** "I use Express middleware for:
  - **CORS**: Allow frontend to call API
  - **Body Parsing**: JSON request bodies
  - **Error Handling**: Centralized error handler
  - **Logging**: Request/response logging
  - **Validation**: Input validation before use cases"

### Database

**Q: "How do you interact with the database?"**
- **Answer:** "I use repository pattern:
  - **Repository Layer**: Abstracts database operations
  - **Supabase Client**: Handles connection and queries
  - **Use Cases**: Call repository methods, not direct DB calls
  
  Benefits: Easy to test (mock repositories), swap databases, and maintain consistency."

**Q: "How do you handle database migrations?"**
- **Answer:** "I use SQL migration files:
  - Versioned migration files in `database/migrations/`
  - Single `init_schema_migration.sql` for initial setup
  - Run migrations manually or via deployment scripts
  - Track schema changes in Git"

### DevOps & Deployment

**Q: "Explain your CI/CD pipeline."**
- **Answer:** "I use GitHub Actions with 3 workflows:
  1. **CI Workflow**: Runs tests and linting on every PR
  2. **Deploy Workflow**: Deploys frontend to Vercel, backend to Railway
  3. **Full CI/CD**: Comprehensive testing + deployment
  
  Steps: Checkout → Install → Test → Build → Deploy"

**Q: "How do you manage environment variables?"**
- **Answer:** "I use:
  - `.env` files for local development (gitignored)
  - `env.template` files as documentation
  - GitHub Secrets for CI/CD (VERCEL_TOKEN, RAILWAY_TOKEN)
  - Railway/Vercel environment variables for production
  - Never commit secrets to Git"

---

## 🧮 LeetCode Practice

### Priority Topics (Based on Your Project)

#### 1. **Arrays & Objects** (High Priority)
- Two Sum, Three Sum
- Merge Intervals
- Group Anagrams
- Product of Array Except Self
- **Why**: You work with arrays of learning paths, skills, approvals

#### 2. **String Manipulation** (Medium Priority)
- Valid Parentheses
- Longest Substring Without Repeating Characters
- String to Integer (atoi)
- **Why**: You parse AI responses, handle JSON strings

#### 3. **Tree/Graph Traversal** (Medium Priority)
- Binary Tree Level Order Traversal
- Maximum Depth of Binary Tree
- **Why**: Learning paths have hierarchical structures (steps → sub-steps)

#### 4. **Dynamic Programming** (Low Priority)
- Climbing Stairs
- House Robber
- **Why**: Less common in full stack interviews, but good to know

#### 5. **Hash Maps/Sets** (High Priority)
- Contains Duplicate
- Two Sum (hash map solution)
- **Why**: You use objects/maps extensively for lookups (companies, users)

### Recommended Practice Schedule

**Week Before Interview:**
- **Day 1-2**: Arrays & Hash Maps (10 problems)
- **Day 3-4**: Strings & Trees (8 problems)
- **Day 5-6**: Review your project code
- **Day 7**: Mock interview, review concepts

**Daily Practice:**
- 2-3 LeetCode Easy problems
- 1 LeetCode Medium problem
- Review 1 project feature in detail

### LeetCode Patterns You Should Know

1. **Sliding Window**: For array/string subarray problems
2. **Two Pointers**: For sorted array problems
3. **Hash Map**: For frequency counting, lookups
4. **DFS/BFS**: For tree/graph traversal
5. **Greedy**: For optimization problems

### Common Full Stack LeetCode Questions

- **Easy**: Two Sum, Valid Parentheses, Reverse String
- **Medium**: Group Anagrams, Longest Substring, Merge Intervals
- **System Design**: Design a URL shortener, Design a chat system

---

## 🏗️ System Design Concepts

### Concepts from Your Project

#### 1. **Microservices Communication**
- **Pattern**: REST API with service tokens
- **Challenge**: Handling failures, retries, timeouts
- **Solution**: Retry logic, graceful degradation, rollback data

#### 2. **Async Job Processing**
- **Pattern**: Job queue with status polling
- **Challenge**: Long-running operations, progress tracking
- **Solution**: Immediate response with job ID, background processing, status endpoint

#### 3. **Caching Strategy**
- **Pattern**: Cache AI prompt outputs (skills_expansions table)
- **Challenge**: When to cache, cache invalidation
- **Solution**: Cache by competency name, reuse for similar requests

#### 4. **Database Design**
- **Pattern**: Hybrid (relational + JSONB)
- **Challenge**: Flexible schema for AI-generated content
- **Solution**: JSONB for variable structures, foreign keys for relationships

### System Design Questions You Can Answer

**Q: "Design a learning management system."**
- Use your project as reference:
  - Microservices architecture
  - Job queue for AI processing
  - Approval workflow
  - Multi-tenant (companies)
  - Analytics and reporting

**Q: "How would you scale this system?"**
- **Answer:** "I would:
  1. **Horizontal Scaling**: Load balancer for API servers
  2. **Database**: Read replicas, connection pooling
  3. **Caching**: Redis for frequently accessed data
  4. **Queue**: RabbitMQ/Kafka for job processing
  5. **CDN**: For static frontend assets
  6. **Monitoring**: APM tools for performance tracking"

---

## 🎤 Common Interview Scenarios

### Scenario 1: "Walk me through your project."

**Structure:**
1. **Overview** (30 sec): What it does, tech stack
2. **Architecture** (1 min): Layers, design patterns
3. **Key Feature** (2 min): Deep dive into one feature (e.g., learning path generation)
4. **Challenges** (1 min): What was hard, how you solved it
5. **Learnings** (30 sec): What you'd do differently

**Example:**
> "LearnerAI generates personalized learning paths using AI. The frontend is React on Vercel, backend is Express on Railway, database is PostgreSQL on Supabase.
> 
> I used Onion Architecture with 4 layers. The key feature is the 3-stage AI pipeline: first expands skills, then identifies competencies, finally creates the learning path. This runs asynchronously with a job queue.
> 
> The biggest challenge was handling microservice failures. I implemented retry logic with exponential backoff and rollback data for graceful degradation.
> 
> If I did it again, I'd add Redis caching and use WebSockets for real-time updates instead of polling."

### Scenario 2: "Explain a complex feature."

**Choose:** Learning Path Generation or Approval Workflow

**Structure:**
1. **Problem**: What does it solve?
2. **Flow**: Step-by-step process
3. **Implementation**: Key code/architecture decisions
4. **Edge Cases**: How you handle them

**Example (Learning Path Generation):**
> "The problem: Convert a skills gap into a structured learning path.
> 
> Flow:
> 1. Skills Engine sends gap → API validates → Returns job ID
> 2. Background job runs 3 AI prompts sequentially
> 3. Each prompt output stored in database
> 4. Final path stored, approval workflow triggered
> 
> Implementation: I use GenerateLearningPathUseCase that orchestrates 3 sub-use cases. Each calls Gemini API, handles errors, stores results.
> 
> Edge cases: AI timeout (retry 3 times), invalid JSON response (parse with fallback), duplicate requests (check existing path first)."

### Scenario 3: "What was your biggest challenge?"

**Good Answers:**
- "Handling async AI operations without blocking the API"
- "Designing flexible database schema for variable AI outputs"
- "Integrating 6 microservices with different failure modes"
- "Implementing approval workflow with multiple edge cases"

**Structure:**
1. **Challenge**: What was hard?
2. **Why**: Why was it challenging?
3. **Solution**: How you solved it
4. **Result**: What you learned

### Scenario 4: "How would you improve this?"

**Good Answers:**
- "Add Redis caching for frequently accessed data"
- "Implement WebSockets for real-time job status updates"
- "Add comprehensive error monitoring (Sentry, DataDog)"
- "Implement rate limiting for API endpoints"
- "Add unit test coverage for edge cases"
- "Optimize database queries with proper indexes"

---

## 📝 Quick Reference Cheat Sheet

### Tech Stack Summary
- **Frontend**: React, Vite, TailwindCSS, Context API
- **Backend**: Node.js, Express, REST API
- **Database**: PostgreSQL (Supabase), JSONB
- **AI**: Google Gemini API
- **Deployment**: Vercel (frontend), Railway (backend)
- **CI/CD**: GitHub Actions
- **Testing**: Jest

### Key Design Patterns
- **Onion Architecture**: Domain, Application, Infrastructure, API layers
- **Repository Pattern**: Abstract database operations
- **Use Case Pattern**: Encapsulate business logic
- **Factory Pattern**: Mock data creation in tests
- **Strategy Pattern**: Different approval policies

### Important Numbers
- 8 database tables
- 15+ API endpoints
- 10+ use cases
- 6 microservice integrations
- 3-stage AI pipeline
- 2 deployment platforms (Vercel, Railway)

### Common Questions & Quick Answers

**Q: "Why microservices?"**
> "Separation of concerns, independent scaling, team autonomy, technology diversity."

**Q: "Why Onion Architecture?"**
> "Testability, maintainability, flexibility to swap implementations."

**Q: "How do you handle errors?"**
> "Try-catch blocks, error middleware, logging, user-friendly messages, graceful degradation."

**Q: "How do you test?"**
> "Jest for unit/integration tests, mock external dependencies, test business logic in isolation."

**Q: "How do you deploy?"**
> "GitHub Actions CI/CD, automated tests, deploy to Vercel (frontend) and Railway (backend) on merge to main."

---

## ✅ Pre-Interview Checklist

### 24 Hours Before
- [ ] Review this guide
- [ ] Re-read your README.md
- [ ] Review 2-3 key use case files
- [ ] Practice explaining architecture (out loud)
- [ ] Solve 3 LeetCode Easy problems
- [ ] Review API endpoints documentation

### 1 Hour Before
- [ ] Review project overview
- [ ] Prepare 3 questions to ask interviewer
- [ ] Test your internet connection
- [ ] Have your project open in IDE (if screen sharing)
- [ ] Have a glass of water nearby

### During Interview
- [ ] Speak clearly and confidently
- [ ] Ask clarifying questions
- [ ] Think out loud when solving problems
- [ ] Reference your project when relevant
- [ ] Show enthusiasm for the role

---

## 🎯 Final Tips

1. **Be Specific**: Use actual examples from your project
2. **Show Growth**: Mention what you learned and would improve
3. **Ask Questions**: Show interest in the company/role
4. **Stay Calm**: It's okay to say "I need a moment to think"
5. **Be Honest**: If you don't know something, say so and explain how you'd find out

**Good luck! You've built an impressive project. Now go show them what you can do! 🚀**


