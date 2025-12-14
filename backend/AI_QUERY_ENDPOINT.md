# AI Query Endpoint for Microservices

## Overview

LearnerAI now exposes AI query capabilities through the Coordinator microservice pattern, allowing other microservices to request AI queries via the `/api/fill-content-metrics` endpoint.

## Endpoint

**URL:** `POST /api/fill-content-metrics`

**Via Coordinator:** Other microservices should call Coordinator, which will route to this endpoint.

## Supported Service Names.

You can use either of these `requester_service` values for AI queries:
- `"ai"` - Recommended for general AI queries
- `"ai-service"` - Alternative name (also works)
- `"course-builder"` - Course Builder service can use this for AI queries (actions: `query`, `chat`)

**Note:** When using `requester_service: "course-builder"`, you can use:
- `action: "query"` or `action: "chat"` → Routes to AI handler
- `action: "request_learning_path"` → Routes to learning path handler

## Supported Actions

### 1. Field Mapping (`map_fields`)

Automatically map field names from microservices to LearnerAI's expected format.

**Request:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "map_fields",
    "data": {
      "learner_id": "123e4567-e89b-12d3-a456-426614174000",
      "learner_name": "John Doe",
      "organization_id": "550e8400-e29b-41d4-a716-446655440000",
      "organization_name": "TechCorp Inc.",
      "competency_name": "React Development",
      "missing_skills_map": {
        "Competency_React": ["MGS_React_Hooks", "MGS_React_State"]
      }
    },
    "service_name": "skills-engine",
    "custom_mappings": {
      "custom_field": "target_field"
    }
  },
  "response": {
    "answer": ""
  }
}
```

**Parameters:**
- `action` (required): Must be `"map_fields"`
- `data` (required): Source data object with field names to map
- `service_name` (optional): Name of the microservice (`"skills-engine"`, `"directory"`, `"course-builder"`, `"learning-analytics"`). If not provided, service will be auto-detected.
- `custom_mappings` (optional): Custom field mappings to override defaults

**Response:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "map_fields",
    "original_data": { ... },
    "mapped_data": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_name": "John Doe",
      "company_id": "550e8400-e29b-41d4-a716-446655440000",
      "company_name": "TechCorp Inc.",
      "competency_target_name": "React Development",
      "gap": {
        "Competency_React": ["MGS_React_Hooks", "MGS_React_State"]
      }
    },
    "service_name": "skills-engine",
    "detected_service": "skills-engine",
    "confidence": true
  },
  "response": {
    "answer": "..."
  }
}
```

### 2. AI-Powered Field Mapping (`map_fields_ai`)

Use AI to intelligently map unknown field names based on semantic similarity and context.

**Request:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "map_fields_ai",
    "data": {
      "employee_uuid": "123e4567-e89b-12d3-a456-426614174000",
      "employee_full_name": "John Doe",
      "org_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "org_display_name": "TechCorp Inc."
    },
    "target_schema": {
      "user_id": "string",
      "user_name": "string",
      "company_id": "string",
      "company_name": "string"
    },
    "service_name": "directory"
  },
  "response": {
    "answer": ""
  }
}
```

**Parameters:**
- `action` (required): Must be `"map_fields_ai"`
- `data` (required): Source data object
- `target_schema` (optional): Target schema object (helps AI understand expected fields)
- `service_name` (optional): Name of the microservice
- `custom_mappings` (optional): Custom field mappings

**Response:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "map_fields_ai",
    "original_data": { ... },
    "mapped_data": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_name": "John Doe",
      "company_id": "550e8400-e29b-41d4-a716-446655440000",
      "company_name": "TechCorp Inc."
    },
    "ai_mappings": {
      "employee_uuid": "user_id",
      "employee_full_name": "user_name",
      "org_uuid": "company_id",
      "org_display_name": "company_name"
    },
    "ai_confidence": {
      "employee_uuid": 0.95,
      "employee_full_name": 0.92,
      "org_uuid": 0.90,
      "org_display_name": 0.88
    },
    "ai_reasoning": "Mapped employee fields to user fields and organization fields to company fields based on semantic similarity."
  },
  "response": {
    "answer": "..."
  }
}
```

### 3. Single Query (`query`)

Execute a single AI prompt and get a response.

**Request:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "query",
    "prompt": "Explain the difference between REST and GraphQL APIs",
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "maxTokens": 2048,
    "format": "text"
  },
  "response": {
    "answer": ""
  }
}
```

**Parameters:**
- `action` (required): Must be `"query"`
- `prompt` (required): The prompt/question to send to AI (string, non-empty)
- `model` (optional): Model name (default: `gemini-2.5-flash`)
- `temperature` (optional): 0.0 to 1.0 (default: 0.7)
- `maxTokens` (optional): Max response tokens, 1-8192 (default: 2048)
- `format` (optional): `"json"` or `"text"` (default: `"text"`)

**Response:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "query",
    "prompt": "Explain the difference between REST and GraphQL APIs",
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "maxTokens": 2048,
    "format": "text"
  },
  "response": {
    "answer": "{\"success\":true,\"action\":\"query\",\"response\":\"REST (Representational State Transfer) and GraphQL are both API design paradigms...\",\"model\":\"gemini-2.5-flash\",\"duration\":\"1234ms\",\"timestamp\":\"2024-01-15T10:30:00.000Z\"}"
  }
}
```

**Response Structure (inside `response.answer` as JSON string):**
```json
{
  "success": true,
  "action": "query",
  "response": "AI response text or object",
  "model": "gemini-2.5-flash",
  "duration": "1234ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Chat with Context (`chat`)

Execute a conversation with context (multiple messages).

**Request:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "chat",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful coding assistant."
      },
      {
        "role": "user",
        "content": "What is React?"
      },
      {
        "role": "assistant",
        "content": "React is a JavaScript library for building user interfaces..."
      },
      {
        "role": "user",
        "content": "How do I use hooks?"
      }
    ],
    "model": "gemini-2.5-flash",
    "temperature": 0.7
  },
  "response": {
    "answer": ""
  }
}
```

**Parameters:**
- `action` (required): Must be `"chat"`
- `messages` (required): Array of message objects, each with:
  - `role` (required): `"user"`, `"assistant"`, or `"system"`
  - `content` (required): Message content (string)
- `model` (optional): Model name (default: `gemini-2.5-flash`)
- `temperature` (optional): 0.0 to 1.0 (default: 0.7)

**Response:**
```json
{
  "requester_service": "ai",
  "payload": {
    "action": "chat",
    "messages": [...]
  },
  "response": {
    "answer": "{\"success\":true,\"action\":\"chat\",\"response\":\"React Hooks are functions that let you use state and other React features...\",\"model\":\"gemini-2.5-flash\",\"duration\":\"2345ms\",\"timestamp\":\"2024-01-15T10:31:00.000Z\"}"
  }
}
```

## Error Handling

### Missing or Invalid Prompt
```json
{
  "error": "Handler execution failed",
  "details": "prompt is required and must be a non-empty string",
  "requester_service": "ai"
}
```

### AI Service Not Available
```json
{
  "error": "Handler execution failed",
  "details": "AI service (Gemini) is not available. Please configure GEMINI_API_KEY.",
  "requester_service": "ai"
}
```

### Invalid Action
```json
{
  "error": "Handler execution failed",
  "details": "Unknown AI action: invalid_action. Supported actions: query, chat",
  "requester_service": "ai"
}
```

## Example Usage via Coordinator

### Example 1: Simple Query (using "ai" service)
```javascript
// From another microservice via Coordinator
const envelope = {
  requester_service: "ai",
  payload: {
    action: "query",
    prompt: "What are the best practices for microservices architecture?",
    format: "text"
  },
  response: {
    answer: ""
  }
};

// Send via Coordinator
const response = await coordinatorClient.post(envelope);
// response.response.answer contains the AI response as JSON string
```

### Example 1b: Simple Query (using "course-builder" service)
```javascript
// Course Builder service can use its own service name for AI queries
const envelope = {
  requester_service: "course-builder",
  payload: {
    action: "query",
    prompt: "Generate a course outline for React Hooks",
    format: "text"
  },
  response: {
    answer: ""
  }
};

// Send via Coordinator
const response = await coordinatorClient.post(envelope);
// response.response.answer contains the AI response as JSON string
```

### Example 2: JSON Format Query
```javascript
const envelope = {
  requester_service: "ai",
  payload: {
    action: "query",
    prompt: "List 5 programming languages with their primary use cases. Return as JSON array.",
    format: "json",
    temperature: 0.3
  },
  response: {
    answer: ""
  }
};
```

### Example 3: Chat with Context
```javascript
const envelope = {
  requester_service: "ai",
  payload: {
    action: "chat",
    messages: [
      { role: "user", content: "What is TypeScript?" },
      { role: "assistant", content: "TypeScript is a typed superset of JavaScript..." },
      { role: "user", content: "How do I define types?" }
    ]
  },
  response: {
    answer: ""
  }
};
```

## Available Models

The following models are available (set via `GEMINI_MODEL` environment variable):
- `gemini-2.5-flash` (default)
- `gemini-2.5-pro`
- `gemini-2.0-flash`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

## Timeout and Retry

- **Timeout:** 60 seconds per query
- **Retries:** 3 attempts with exponential backoff
- **Max Tokens:** 8192 tokens per response

## Direct Endpoints (Alternative)

If you need direct access (not via Coordinator), you can also use:
- `POST /api/v1/ai/query` - Direct query endpoint
- `POST /api/v1/ai/chat` - Direct chat endpoint

However, **Coordinator pattern is recommended** for microservice-to-microservice communication.

## Implementation Details

- **Handler:** `aiHandler()` in `backend/src/api/routes/endpoints.js`
- **AI Client:** `GeminiApiClient` (requires `GEMINI_API_KEY`)
- **Field Mapper:** `fieldMapper.js` utility for automatic field name mapping
- **Dependencies:** `geminiClient` must be available in dependencies

## Field Mapping

The AI query endpoint now includes automatic field mapping capabilities to handle field name mismatches between microservices:

### Supported Service Mappings

- **skills-engine**: Maps `learner_id` → `user_id`, `organization_id` → `company_id`, `missing_skills_map` → `gap`, etc.
- **directory**: Maps `employee_id` → `user_id`, `organization_name` → `company_name`, etc.
- **course-builder**: Maps `course_id` → `competency_target_name`, `learner_name` → `user_name`, etc.
- **learning-analytics**: Maps `learner_id` → `user_id`, `course_id` → `competency_target_name`, etc.

### Automatic Field Mapping in Skills Gaps Endpoint

The `/api/v1/skills-gaps` endpoint now automatically maps incoming fields before processing, so Skills Engine can send `learner_id` and it will be automatically mapped to `user_id`.

## Security

- All requests must go through Coordinator with ECDSA signatures
- Service authentication via `X-Service-Name` and `X-Signature` headers
- No direct public access to AI endpoints (unless explicitly configured)

