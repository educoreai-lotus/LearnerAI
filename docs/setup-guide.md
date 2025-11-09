# Setup Guide

Step-by-step guide for setting up accounts and configuring the LearnerAI microservice.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- GitHub account

## Step 1: Account Setup

### 1.1 Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project:
   - Project name: `learnerai` (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to initialize (2-3 minutes)
5. Get your credentials:
   - Go to Project Settings → API
   - Copy `Project URL` → This is your `SUPABASE_URL`
   - Copy `anon public` key → This is your `SUPABASE_KEY`
   - Copy `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 1.2 Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key → This is your `GEMINI_API_KEY`
5. Note: Free tier available for developers

### 1.3 Vercel Setup (Frontend)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories
4. You'll configure deployment later when ready

### 1.4 Railway Setup (Backend)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories
4. You'll configure deployment later when ready

## Step 2: Local Environment Setup

### 2.1 Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy environment template:
   ```bash
   # On Windows PowerShell:
   Copy-Item env.template .env
   
   # On Linux/Mac:
   cp env.template .env
   ```

3. Edit `.env` file with your credentials:
   - Add your Supabase credentials
   - Add your Gemini API key
   - Add microservice tokens (when available)
   - Set `FRONTEND_URL=http://localhost:5173` for local development

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start backend server:
   ```bash
   npm run dev
   ```
   Server should run on `http://localhost:3000`

### 2.2 Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Copy environment template:
   ```bash
   # On Windows PowerShell:
   Copy-Item env.template .env
   
   # On Linux/Mac:
   cp env.template .env
   ```

3. Edit `.env` file:
   - Set `VITE_RAILWAY_API_URL=http://localhost:3000` for local development
   - Add Railway asset key (when available)

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start development server:
   ```bash
   npm run dev
   ```
   Frontend should run on `http://localhost:5173`

## Step 3: Database Setup

### 3.1 Create Supabase Tables

You'll need to create the following tables in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL scripts (to be created in `database/` directory)

**Key Tables:**
- `cache_skills` - For Micro/Nano Skill divisions
- `learning_paths` - For generated learning paths
- `jobs` - For job status tracking
- `course_suggestions` - For RAG suggestions
- `prompt_registry` - For prompt version management

See `docs/architecture.md` for detailed schema information.

## Step 4: Deployment Setup

### 4.1 Deploy Backend to Railway

1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `learnerAI` repository
5. Select the `backend` directory as root
6. Add environment variables:
   - Copy all variables from `backend/env.template`
   - Add your actual values
   - **Important**: Never commit `.env` files to Git!
7. Railway will automatically deploy
8. Copy the deployment URL → This is your backend API URL

### 4.2 Deploy Frontend to Vercel

1. Go to Vercel dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   - `VITE_RAILWAY_API_URL` → Your Railway backend URL
   - `VITE_RAILWAY_ASSET_KEY` → Your Railway asset key
6. Deploy

### 4.3 Update Environment Variables

After deployment, update:
- **Frontend**: Update `VITE_RAILWAY_API_URL` with your Railway backend URL
- **Backend**: Update `FRONTEND_URL` with your Vercel frontend URL

## Step 5: GitHub Actions Setup

1. Push your code to GitHub
2. GitHub Actions will automatically run on push
3. Check `.github/workflows/ci.yml` for workflow configuration
4. Tests will run automatically (once implemented)

## Step 6: Microservice Tokens

You'll need to obtain tokens from other microservices:
- Skills Engine token
- Course Builder token
- RAG Microservice token
- Analytics token
- Reports token

Add these to your backend environment variables once available.

## Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Verify Supabase connection
- Check port 3000 is not in use

### Frontend can't connect to backend
- Verify `VITE_RAILWAY_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running

### Database connection issues
- Verify Supabase credentials
- Check network connectivity
- Verify database is initialized

## Next Steps

After setup is complete:
1. Review `docs/requirements.md` for feature requirements
2. Review `docs/architecture.md` for system architecture
3. Review `docs/ui-ux-design.md` for UI specifications
4. Start implementing features following the roadmap in `Project Roadmap.json`

## Support

For issues or questions, refer to:
- `docs/README.md` - General documentation
- `docs/architecture.md` - Architecture details
- `Project Refinement Log.md` - All project decisions

