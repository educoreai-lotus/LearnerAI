# Requirements Documentation

This document contains all requirements for the Learner AI Microservice, organized by features.

## Feature 1: Adaptive Learning Path Generation

### Functional Requirements

1. **Skills Gap Reception**
   - Receive skills gap data from Skills Engine microservice
   - Handle both initial gaps (at course enrollment) and updated gaps (after test attempts)
   - Process gaps categorized by Micro and Nano Skills

2. **Three-Prompt Path Generation Flow**
   - **Prompt 1 (Skill Expansion)**: Execute pre-defined prompt to expand current Skills Gap, suggesting additional "out-of-the-box" Competencies the learner should acquire
   - **Prompt 2 (Competency Identification)**: Execute pre-defined prompt on Prompt 1 output to identify and extract newly suggested expanded Competencies
   - **Skills Engine Integration**: Send identified expanded Competencies to Skills Engine requesting structured breakdown (Micro and Nano Skill division)
   - **Prompt 3 (Path Creation)**: Execute pre-defined prompt using combined data (initial GAP + Micro/Nano Skill breakdown of expansion) to generate detailed and precise learning path

3. **AI Model Integration**
   - Use Gemini API for all AI prompts (free tier for developers)
   - Implement async handling for prompt execution
   - Optimize for speed with timeout and retry logic
   - Handle rate limits gracefully
   - Implement error handling for API failures or slow responses

### Non-Functional Requirements

- Response time: Optimize for fastest possible response from Gemini API
- Reliability: Implement retry logic with exponential backoff
- Error resilience: Fallback to mock data if Gemini API fails after retries

---

## Feature 2: Path Distribution & Analytics Updates

### Functional Requirements

1. **Path Distribution to Course Builder**
   - Transfer final, detailed learning path to Course Builder Microservice
   - Include all necessary path metadata and structure
   - Handle Course Builder service failures with mock data rollback

2. **Analytics & Reporting Updates**
   - Update Learning Analytics microservice with generated path data
   - Update Management Reports microservice with path information
   - Ensure data consistency across all services

3. **Microservice Communication**
   - Each microservice identified by tokens
   - Include Learner AI service token in all outgoing API calls
   - Validate tokens from incoming requests from other microservices
   - Implement logging for all inter-service communications

### Non-Functional Requirements

- Resilience: Mock data rollback system for failed microservice calls
- Security: Token-based authentication for all inter-service communication
- Observability: Log all service-to-service communications and authentication events

---

## Feature 3: Course Completion & Next Course Suggestions

### Functional Requirements

1. **Completion Detection**
   - Receive explicit success status from Skills Engine (e.g., Passed: True field)
   - Handle completion events for learners who successfully complete courses

2. **Next Course Generation**
   - Execute dedicated prompt to propose follow-up courses or advanced training
   - Base suggestions on successful course completion
   - Use Gemini API for prompt execution

3. **RAG Microservice Integration**
   - Send suggested follow-up courses to RAG Microservice
   - Handle RAG service failures with mock data rollback
   - Support Retrieval-Augmented Generation for content sourcing or detailed recommendation processing

### Non-Functional Requirements

- Reliability: Retry logic for RAG microservice calls
- Resilience: Mock data fallback if RAG service unavailable

---

## Frontend Interfaces

### Functional Requirements

1. **Company Dashboard**
   - Display all users within a company
   - Show learning path for each user
   - Learning paths update automatically when generated from gaps (gaps include user_id and company_id)
   - Filter and search capabilities for users
   - Real-time updates when new learning paths are generated

2. **User View**
   - Display all registered courses for the user
   - Dropdown/search interface for course selection
   - Show learning path for each selected course
   - Course management interface (search, filter)

3. **API Integration**
   - Frontend consumes REST API endpoints from backend
   - Endpoints needed:
     - GET /api/companies/:companyId/users
     - GET /api/users/:userId/learning-paths
     - GET /api/users/:userId/courses
   - Real-time or polling mechanism for learning path updates

### Non-Functional Requirements

- Responsive design for different screen sizes
- Fast loading times for learning path data
- Smooth user experience with search and filtering

---

## Cross-Feature Requirements

### Data Persistence & Caching

1. **Cache Table Management**
   - Maintain dedicated Cache Table in Supabase (PostgreSQL)
   - Store all Micro and Nano Skill divisions: both initial GAP and divisions for expanded Competencies
   - Update cache after every test attempt when new gap is received
   - Replace old data with fresh data (not keeping historical versions)
   - Design for scale with many learners

2. **Database Requirements**
   - Use proper database indexing for fast lookups
   - Implement efficient upsert operations (update if exists, insert if new)
   - Optimize queries for performance
   - Cache maintains current state per learner

### Error Handling & Resilience

1. **Mock Data Rollback System**
   - Predefined mock data matching expected response formats for all microservices
   - Retry real services first with exponential backoff
   - Fall back to mock data if all retries fail
   - Log when mock data is used for monitoring service health

2. **Service Failure Handling**
   - Handle failures for: Skills Engine, Course Builder, RAG Microservice, Gemini API
   - Implement retry logic with configurable retry counts
   - Graceful degradation to maintain system functionality

### Security & Authentication

1. **Token Management**
   - Store Learner AI service token securely via RBAC secrets management
   - Include token in all outgoing API calls to other microservices
   - Validate tokens from incoming requests
   - Centralized, role-based access control (RBAC) system for secrets

2. **Logging & Monitoring**
   - Log all inter-service communications
   - Log authentication events (success and failures)
   - Log when mock data is used
   - Monitor service health and API response times

### Technical Stack Constraints

- **Frontend**: React, JavaScript (NOT TypeScript), JSX, Vite
- **Backend**: Node.js, Express, REST API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Frontend), Railway (Backend/API)
- **CI/CD**: GitHub Actions
- **AI Service**: Gemini API

### Scalability Requirements

- Design for many learners (high scale)
- Efficient database operations with proper indexing
- Optimized API calls and caching strategies
- Support for concurrent path generation requests

### Environment Configuration

- Local environment for development
- Production environment for live deployment
- No staging environment for MVP (can be added later)

---

## MVP Scope

**Priority Order:**
1. Adaptive Learning Path Generation (Feature 1)
2. Path Distribution & Analytics Updates (Feature 2)
3. Course Completion & Next Course Suggestions (Feature 3)

**Implementation Approach:**
- Implement features sequentially
- Ensure each feature works before moving to the next
- Focus on core functionality only
- No additional features beyond the three core features for MVP

---

## Dependencies

### External Microservices
- Skills Engine (Skills Gap data, Micro/Nano breakdown)
- Course Builder (Path distribution)
- Learning Analytics (Analytics updates)
- Management Reports (Reporting updates)
- RAG Microservice (Course suggestions)

### External APIs
- Gemini API (All AI prompt execution)

### Infrastructure
- Supabase (Database and caching)
- Vercel (Frontend hosting)
- Railway (Backend hosting)
- GitHub Actions (CI/CD)

---

## Non-Functional Requirements Summary

- **Performance**: Optimize for speed, async handling, efficient caching
- **Reliability**: Retry logic, mock data fallback, error handling
- **Security**: Token-based authentication, RBAC secrets management
- **Scalability**: Design for many learners, efficient database operations
- **Observability**: Comprehensive logging and monitoring
- **Resilience**: Graceful degradation, service failure handling

