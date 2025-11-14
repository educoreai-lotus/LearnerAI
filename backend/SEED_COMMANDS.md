# Quick Seed Commands

## PowerShell Commands

### Seed Database
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
```

### View Mock Data (without seeding)
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method GET
```

### Clear Seeded Data
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method DELETE
```

## Alternative: Using curl.exe

If you prefer curl syntax:

### Seed Database
```powershell
curl.exe -X POST http://localhost:5000/api/seed
```

### View Mock Data
```powershell
curl.exe http://localhost:5000/api/seed
```

### Clear Seeded Data
```powershell
curl.exe -X DELETE http://localhost:5000/api/seed
```

## Test Other Endpoints

### Get All Learners
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/learners
```

### Get All Courses
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/courses
```

### Get All Skills Gaps
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps
```

### Health Check
```powershell
Invoke-RestMethod -Uri http://localhost:5000/health
```

## Using Fetch in Browser Console

If you want to test from browser console:

```javascript
// Seed database
fetch('http://localhost:5000/api/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// View mock data
fetch('http://localhost:5000/api/seed')
  .then(r => r.json())
  .then(console.log);

// Clear data
fetch('http://localhost:5000/api/seed', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log);
```

