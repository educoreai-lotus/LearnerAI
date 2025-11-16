# Skills Engine Fill-Fields Payload Examples

## ⚠️ Common Error: "Invalid JSON" at position 57

This error occurs when the `payload` string contains invalid JSON syntax, usually from unescaped quotes in complex nested objects.

---

## ✅ Simple Working Example (Recommended for Testing)

**Use this minimal payload first to verify the endpoint works:**

```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\"}"
}
```

This will:
- Fetch the learning path from the database
- Return it in the response
- Add any missing fields

---

## ✅ Example with User ID (Fetches Skills Gap Data)

```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\",\"user_id\":\"b2c3d4e5-f6a7-8901-2345-678901234567\"}"
}
```

This will:
- Fetch learning path from database
- Fetch skills gap data (gap_id, skills_raw_data, exam_status)
- Return combined data

---

## ❌ Problem: Complex Learning Path in Payload

**Your current payload has a full `learning_path` object, which is causing JSON parsing errors.**

The issue is that when you have nested JSON objects with many quotes, manually escaping them is error-prone.

### Why It Fails:

When you have:
```json
{
  "payload": "{\"learning_path\":{\"steps\":[{\"title\":\"React Hooks Basics\"}]}}"
}
```

If any quote inside the `learning_path` object isn't properly escaped, JSON.parse() will fail.

---

## ✅ Solution 1: Send Minimal Data (Recommended)

**Don't send the full learning_path - let the endpoint fetch it from the database:**

```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\",\"user_id\":\"b2c3d4e5-f6a7-8901-2345-678901234567\"}"
}
```

The endpoint will:
1. Look up the course by `competency_target_name` in the database
2. Return the `learning_path` from the database
3. Add skills gap data if `user_id` is provided

**This is the intended use case!**

---

## ✅ Solution 2: Use Postman Pre-request Script (For Complex Payloads)

If you MUST send a complex learning_path object, use Postman's Pre-request Script:

1. Go to **Pre-request Script** tab in Postman
2. Paste this code:

```javascript
// Your complex learning path object
const learningPath = {
  steps: [
    {
      step: 1,
      title: "React Hooks Basics",
      skills: ["micro-008"],
      stepId: "step-004",
      duration: "1 week",
      resources: [
        "React Docs: Introducing Hooks",
        "React Docs: useState Hook"
      ],
      objectives: [
        "Understand why React Hooks were introduced",
        "Master useState hook for state management"
      ],
      description: "Introduction to React Hooks and fundamental hooks",
      estimatedTime: "6 hours"
    },
    {
      step: 2,
      title: "Advanced Hooks and Custom Hooks",
      skills: ["micro-009", "micro-010"],
      stepId: "step-005",
      duration: "1.5 weeks",
      // ... rest of your object
    }
  ],
  status: "pending",
  metadata: {
    version: "1.0",
    generatedAt: "2025-11-05T14:30:00Z",
    competencies: ["React Hooks"]
  },
  pathTitle: "React Hooks Mastery",
  totalSteps: 2,
  totalDurationHours: 14
};

// Create the payload data
const payloadData = {
  competency_target_name: "React Hooks",
  learning_path: learningPath,
  approved: false,
  user_id: "b2c3d4e5-f6a7-8901-2345-678901234567"
};

// Set the request body
pm.request.body.raw = JSON.stringify({
  serviceName: "SkillsEngine",
  payload: JSON.stringify(payloadData)  // This properly escapes everything
});

// Set content type
pm.request.headers.add({
  key: "Content-Type",
  value: "application/json"
});
```

3. The script will automatically format the request body correctly
4. Send the request

---

## ✅ Solution 3: Use Online JSON Stringifier

1. Create your payload object as regular JSON:
```json
{
  "competency_target_name": "React Hooks",
  "learning_path": { /* your full object */ },
  "approved": false,
  "user_id": "b2c3d4e5-f6a7-8901-2345-678901234567"
}
```

2. Use an online tool like [JSON Formatter](https://jsonformatter.org/) to:
   - Validate the JSON is correct
   - Stringify it (convert to escaped string)

3. Copy the stringified result and use it as the `payload` value

---

## 🔍 How to Debug JSON Errors

### Step 1: Extract and Validate the Payload String

1. Copy just the `payload` value from your request (the string part)
2. Remove the outer quotes
3. Paste it into a JSON validator (like [jsonlint.com](https://jsonlint.com/))
4. Fix any syntax errors it finds

### Step 2: Check Common Issues

- **Unescaped quotes**: All `"` inside the string must be `\"`
- **Trailing commas**: Remove commas after last items in arrays/objects
- **Unclosed brackets**: Make sure all `{` have matching `}`
- **Invalid characters**: Check for special characters that need escaping

### Step 3: Re-escape and Test

After fixing, wrap it in quotes again and test.

---

## 📝 Recommended Approach

**For Skills Engine fill-fields requests, send minimal data:**

```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\",\"user_id\":\"b2c3d4e5-f6a7-8901-2345-678901234567\"}"
}
```

**The endpoint will:**
- Fetch the learning path from your database
- Fetch skills gap data
- Return everything filled in

**You don't need to send the full learning_path object!**

---

## 🧪 Quick Test

Try this minimal payload first to verify the endpoint works:

```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\"}"
}
```

If this works, then the endpoint is functioning correctly. The issue was with the complex nested JSON in your original payload.

