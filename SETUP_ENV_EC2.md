# Setup Environment Variables on EC2

## Problem
Your containers are starting but missing environment variables. The backend needs these to function properly.

## Solution: Create .env File

### Step 1: Navigate to Your Project Directory

```bash
cd ~/learnerai
```

### Step 2: Create Backend Directory (if it doesn't exist)

```bash
mkdir -p backend
```

### Step 3: Create .env File

```bash
nano backend/.env
```

### Step 4: Paste Your Environment Variables

**IMPORTANT:** Replace all `your_*` placeholders with your actual values!

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_DB_NAME=postgres

# Gemini API Configuration (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key

# Microservice Tokens
LEARNER_AI_SERVICE_TOKEN=your_learner_ai_service_token
SKILLS_ENGINE_TOKEN=your_skills_engine_token
SKILLS_ENGINE_URL=http://localhost:5001
COURSE_BUILDER_TOKEN=your_course_builder_token
COURSE_BUILDER_URL=http://localhost:5002
RAG_MICROSERVICE_TOKEN=your_rag_microservice_token
RAG_MICROSERVICE_URL=http://localhost:5004
ANALYTICS_TOKEN=your_analytics_token
ANALYTICS_URL=http://localhost:5003
REPORTS_TOKEN=your_reports_token
REPORTS_URL=http://localhost:5005

# Coordinator Configuration
COORDINATOR_URL=https://coordinator-production-6004.up.railway.app
COORDINATOR_PUBLIC_KEY=your_coordinator_public_key
LEARNERAI_DOMAIN=http://YOUR_EC2_PUBLIC_IP:5000
LEARNERAI_PRIVATE_KEY=your_private_key_pem_format
SERVICE_NAME=learnerAI-service
SERVICE_VERSION=1.0.0
SERVICE_DESCRIPTION=LearnerAI Backend Service
SERVICE_TEAM=Your Team
SERVICE_OWNER=system
SERVICE_CAPABILITIES=learning-path-generation,approval-workflow

# API Configuration
API_VERSION=v1
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:3000

# Job Processing
JOB_TIMEOUT_MS=300000
MAX_RETRIES=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Railway Asset Access (optional)
RAILWAY_ASSET_KEY=your_railway_asset_key

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 5: Get Your EC2 Public IP

```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

Or check in AWS Console → EC2 → Instances → Your instance → Public IPv4 address

**Replace `YOUR_EC2_PUBLIC_IP` in the .env file with this IP.**

### Step 6: Set Proper Permissions

```bash
chmod 600 backend/.env
```

### Step 7: Stop Current Containers

```bash
docker-compose down
```

### Step 8: Start Containers Again

```bash
docker-compose up -d
```

### Step 9: Check Logs

```bash
docker-compose logs -f backend
```

You should see:
```
✅ Dependencies initialized successfully
🚀 LearnerAI Backend server running on 0.0.0.0:5000
✅ Server is ready and listening for connections
```

---

## Quick Test

```bash
# Test backend health
curl http://localhost:5000/health

# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

---

## Alternative: Use .env in Same Directory

If you prefer to have `.env` in the same directory as `docker-compose.yml`, you can:

1. Create `.env` in `~/learnerai/`:
   ```bash
   nano .env
   ```

2. Update `docker-compose.yml` to use:
   ```yaml
   env_file:
     - .env
   ```

   Instead of:
   ```yaml
   env_file:
     - ./backend/.env
   ```

---

## Security Note

⚠️ **Never commit `.env` files to git!** They contain sensitive credentials.

Make sure `.env` is in your `.gitignore` file.

