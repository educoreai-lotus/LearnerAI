# Directory Company Registration/Update Flow

This document describes how Directory microservice sends company data to your API.

---

## 📥 What Directory POSTs

**Endpoint:** `POST /api/v1/companies/register`

**When Directory calls this:**
- ✅ When a new company joins
- ✅ When a company updates their information

**Body from Directory:**
```json
{
  "company_id": "uuid",
  "company_name": "string",
  "approval_policy": "auto" | "manual",
  "decision_maker": {
    "employee_id": "uuid",
    "employee_name": "string",
    "employee_email": "string"
  }
}
```

---

## 🔄 What Your Backend Does

### Step 1: Store Company in Companies Table

```
Directory POSTs company data
    │
    └─> POST /api/v1/companies/register
        │
        └─> Upsert to companies table
            ├─> If company_id exists → UPDATE
            └─> If company_id doesn't exist → CREATE
```

### Step 2: Update Existing Learners

```
After storing company
    │
    └─> Find all learners with this company_id
        │
        └─> Update each learner:
            ├─> company_name (in case it changed)
            ├─> decision_maker_policy (from approval_policy)
            └─> decision_maker_id (from decision_maker.employee_id)
```

---

## 📋 Detailed Implementation

### 1. Company Upsert Logic

```javascript
// ProcessCompanyUpdateUseCase.execute()
const company = await companyRepository.upsertCompany({
  company_id,
  company_name,
  approval_policy,
  decision_maker: {
    employee_id,
    employee_name,
    employee_email
  }
});
```

### 2. Update Existing Learners

```javascript
// After company is stored
const learners = await learnerRepository.getLearnersByCompany(company_id);

for (const learner of learners) {
  await learnerRepository.updateLearner(learner.user_id, {
    company_name,                    // Update name
    decision_maker_policy: approval_policy,  // Sync policy
    decision_maker_id: decision_maker.employee_id  // Sync decision maker
  });
}
```

---

## 🔗 Complete Flow

```
Directory detects new/updated company
        │
        ▼
┌───────────────────────────────┐
│ POST /api/v1/companies/       │
│ register                      │
│ Body: {                        │
│   company_id,                  │
│   company_name,                │
│   approval_policy,             │
│   decision_maker               │
│ }                              │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ ProcessCompanyUpdateUseCase   │
└───────────┬───────────────────┘
            │
            ├─> Step 1: Upsert to companies table
            │   └─> Store company data
            │
            └─> Step 2: Update existing learners
                └─> Sync all learners with this company_id
                    ├─> Update company_name
                    ├─> Update decision_maker_policy
                    └─> Update decision_maker_id
```

---

## 🔄 How It Works with Skills Engine Flow

### Scenario: New Company → New Learner → Skills Gap

```
1. Directory POSTs company
   └─> POST /api/v1/companies/register
       └─> Stored in companies table

2. Skills Engine POSTs gap (new learner)
   └─> POST /api/v1/skills-gaps
       └─> Check learner exists? NO
           └─> Get company from companies table
               └─> Create learner with company data

3. Learning path generation
   └─> Uses updated skills_raw_data
       └─> Uses company approval_policy from companies table
```

---

## ✅ Benefits

1. **Single Source of Truth** - Company data stored once in companies table
2. **Automatic Sync** - All learners updated when company changes
3. **No Repeated API Calls** - Don't need to call Directory for each learner
4. **Fast Lookups** - Company data available immediately from database

---

**Companies table is the bridge between Directory and your learners!** ✅

