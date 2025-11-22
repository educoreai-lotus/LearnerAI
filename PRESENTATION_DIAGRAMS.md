# 📊 Presentation Diagrams
## Ready-to-use diagrams for your presentation

---

## Architecture Diagram (Mermaid)

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App<br/>Vercel]
    end
    
    subgraph "Backend Layer"
        B[Express API<br/>Railway]
        C[Onion Architecture]
    end
    
    subgraph "Data Layer"
        D[(Supabase<br/>PostgreSQL)]
    end
    
    subgraph "AI Layer"
        E[Gemini API<br/>4 Prompts]
    end
    
    subgraph "External Services"
        F[Skills Engine]
        G[Course Builder]
        H[Learning Analytics]
    end
    
    A -->|REST API| B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
```

---

## Database Schema Diagram (Mermaid)

```mermaid
erDiagram
    companies ||--o{ learners : "has"
    companies ||--o{ skills_gap : "has"
    learners ||--o{ skills_gap : "has"
    learners ||--o{ courses : "has"
    skills_gap ||--|| skills_expansions : "generates"
    skills_gap ||--|| courses : "creates"
    courses ||--o{ path_approvals : "requires"
    courses ||--o{ recommendations : "suggests"
    learners ||--o{ jobs : "tracks"
    
    companies {
        uuid company_id PK
        text company_name
        text decision_maker_policy
        jsonb decision_maker
    }
    
    learners {
        uuid user_id PK
        uuid company_id FK
        text user_name
    }
    
    skills_gap {
        uuid gap_id PK
        uuid user_id FK
        uuid company_id FK
        jsonb skills_raw_data
        text competency_target_name
    }
    
    skills_expansions {
        uuid expansion_id PK
        uuid gap_id FK
        jsonb prompt_1_output
        jsonb prompt_2_output
    }
    
    courses {
        text competency_target_name PK
        uuid user_id FK
        uuid gap_id FK
        jsonb learning_path
        boolean approved
    }
    
    path_approvals {
        uuid id PK
        text learning_path_id FK
        uuid company_id FK
        text status
    }
    
    recommendations {
        uuid recommendation_id PK
        uuid user_id FK
        text base_course_name FK
        jsonb suggested_courses
    }
    
    jobs {
        uuid id PK
        uuid user_id FK
        text status
        integer progress
    }
```

---

## AI Prompt Pipeline Flow (Mermaid)

```mermaid
flowchart LR
    A[Skills Gap<br/>Input] --> B[Prompt 1<br/>Skill Expansion]
    B --> C[Prompt 2<br/>Competency ID]
    C --> D[Skills Engine<br/>Breakdown]
    D --> E[Prompt 3<br/>Path Creation]
    E --> F[Learning Path<br/>Output]
    F --> G{Approval<br/>Required?}
    G -->|Yes| H[Approval<br/>Workflow]
    G -->|No| I[Distribute]
    H -->|Approved| I
    I --> J[Course Builder]
    F --> K[Completion]
    K --> L[Prompt 4<br/>Suggestions]
    L --> M[Recommendations]
```

---

## Data Flow Diagram (Mermaid)

```mermaid
sequenceDiagram
    participant SE as Skills Engine
    participant API as Backend API
    participant DB as Supabase
    participant AI as Gemini AI
    participant CB as Course Builder
    
    SE->>API: POST /api/v1/skills-gaps
    API->>DB: Save skills_gap
    API-->>SE: 200 OK
    
    API->>API: POST /api/v1/learning-paths/generate
    API->>DB: Create job (pending)
    API-->>API: Return job_id
    
    API->>AI: Prompt 1: Expand
    AI-->>API: Expanded competencies
    API->>DB: Save to skills_expansions
    
    API->>AI: Prompt 2: Identify
    AI-->>API: Core competencies
    API->>DB: Update skills_expansions
    
    API->>SE: Request breakdown
    SE-->>API: Micro/Nano skills
    API->>DB: Cache skills
    
    API->>AI: Prompt 3: Create path
    AI-->>API: Learning path JSON
    API->>DB: Save to courses
    API->>DB: Update job (completed)
    
    API->>API: Check approval policy
    alt Manual Approval
        API->>DB: Create approval
        API->>API: Send email
    else Auto Approval
        API->>CB: Distribute path
    end
```

---

## Frontend-Backend Communication (Mermaid)

```mermaid
graph LR
    subgraph "Frontend"
        A[UserView.jsx]
        B[CompanyDashboard.jsx]
        C[ApprovalReview.jsx]
    end
    
    subgraph "API Service"
        D[api.js]
    end
    
    subgraph "Backend"
        E[Express Routes]
        F[Use Cases]
        G[Repositories]
    end
    
    subgraph "Database"
        H[(Supabase)]
    end
    
    A --> D
    B --> D
    C --> D
    D -->|HTTP| E
    E --> F
    F --> G
    G --> H
    H --> G
    G --> F
    F --> E
    E -->|JSON| D
    D --> A
    D --> B
    D --> C
```

---

## Approval Workflow (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> LearningPathGenerated
    LearningPathGenerated --> CheckPolicy
    CheckPolicy --> AutoApproval: policy = auto
    CheckPolicy --> ManualApproval: policy = manual
    
    AutoApproval --> Distributed
    Distributed --> [*]
    
    ManualApproval --> ApprovalCreated
    ApprovalCreated --> EmailSent
    EmailSent --> PendingReview
    PendingReview --> Approved: Decision = Approve
    PendingReview --> ChangesRequested: Decision = Request Changes
    PendingReview --> Rejected: Decision = Reject
    
    Approved --> Distributed
    ChangesRequested --> FeedbackSent
    FeedbackSent --> LearningPathGenerated
    Rejected --> [*]
    
    Distributed --> [*]
```

---

## Use These Diagrams

1. **Copy the Mermaid code** into:
   - GitHub (renders automatically)
   - Mermaid Live Editor: https://mermaid.live
   - VS Code (with Mermaid extension)
   - Notion, Obsidian (supports Mermaid)

2. **Export as images:**
   - Use Mermaid Live Editor to export PNG/SVG
   - Use in PowerPoint/Keynote
   - Embed in presentation

3. **Customize:**
   - Change colors
   - Add your branding
   - Modify labels
   - Add animations

---

## Quick Stats for Slides

```
📊 Database:
- 8 Tables
- 20+ Indexes
- 5 Foreign Keys
- 3 JSONB Fields

🔌 API:
- 15+ Endpoints
- RESTful Design
- 4 Resource Groups

🤖 AI:
- 4 Prompts
- Sequential Pipeline
- Gemini API

⚛️ Frontend:
- 4 Main Pages
- 8 Components
- Dark Mode Support

🏗️ Architecture:
- Onion Architecture
- 10 Use Cases
- 9 Repositories
- 12 Microservice Clients
```

---

## Color Scheme (Use in Diagrams)

- **Primary**: `#047857` (Teal)
- **Secondary**: `#0d9488` (Cyan)
- **Accent**: `#d97706` (Gold)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Error**: `#ef4444` (Red)

---

## Presentation Tools

1. **Mermaid Live Editor**: https://mermaid.live
   - Edit diagrams
   - Export as PNG/SVG
   - Share links

2. **Excalidraw**: https://excalidraw.com
   - Hand-drawn style diagrams
   - Collaborative
   - Export as PNG

3. **Figma**: https://figma.com
   - Professional diagrams
   - Custom branding
   - Export high-res

4. **Draw.io**: https://app.diagrams.net
   - Flowcharts
   - ERD diagrams
   - Architecture diagrams

---

Good luck with your presentation! 🚀

