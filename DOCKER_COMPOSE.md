# Docker Compose Setup Guide

This guide explains how to run LearnerAI using Docker Compose.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher
- Environment variables configured (see below)

## 🚀 Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in the root directory (`learnerAI/`) with your configuration:

```bash
# Copy from backend/.env.template and frontend/.env.template
# Or create a combined .env file with all required variables
```

**Required Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `GEMINI_API_KEY` - Your Google Gemini API key
- `COORDINATOR_URL` - Coordinator microservice URL
- `COORDINATOR_PUBLIC_KEY` - Coordinator public key
- `LEARNERAI_PRIVATE_KEY` - Your ECDSA private key (PEM format)

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Backend Health Check:** http://localhost:5000/health

## 📝 Available Commands

### Start Services
```bash
# Start in detached mode (background)
docker-compose up -d

# Start and view logs
docker-compose up
```

### Stop Services
```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### View Status
```bash
# List running containers
docker-compose ps

# View logs
docker-compose logs

# View logs for last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Containers
```bash
# Execute command in backend container
docker-compose exec backend sh

# Execute command in frontend container
docker-compose exec frontend sh

# Run npm commands in backend
docker-compose exec backend npm test
```

## 🔧 Configuration

### Service Configuration

**Backend:**
- Port: `5000:5000`
- Container name: `learnerai-backend`
- Health check: `/health` endpoint
- Restart policy: `unless-stopped`

**Frontend:**
- Port: `3000:80`
- Container name: `learnerai-frontend`
- Health check: `/health` endpoint
- Restart policy: `unless-stopped`

### Network

Both services are connected via `learnerai-network` bridge network, allowing them to communicate using service names:
- Backend accessible at: `http://backend:5000`
- Frontend accessible at: `http://frontend:80`

### Environment Variables

Environment variables can be set in:
1. `.env` file in the root directory (recommended)
2. `backend/.env` file (for backend-specific vars)
3. `frontend/.env` file (for frontend-specific vars)
4. Directly in `docker-compose.yml` (not recommended)

**Note:** Variables prefixed with `VITE_` are build-time variables for the frontend and must be set before building.

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 5000 are already in use:

```bash
# Change ports in docker-compose.yml
ports:
  - "3001:80"  # Frontend
  - "5001:5000"  # Backend
```

### Environment Variables Not Loading

1. Ensure `.env` file exists in the root directory
2. Check variable names match exactly (case-sensitive)
3. Restart containers: `docker-compose restart`

### Build Failures

```bash
# Clean build (removes cache)
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps

# Inspect container
docker inspect learnerai-backend
```

### Health Check Failures

```bash
# Check if services are responding
curl http://localhost:5000/health  # Backend
curl http://localhost:3000/health   # Frontend

# Check container health
docker-compose ps
```

## 📦 Production Deployment

For production:

1. Set `NODE_ENV=production` in `.env`
2. Use production-ready environment variables
3. Ensure all secrets are properly configured
4. Use Docker secrets or external secret management
5. Set up proper logging and monitoring

```bash
# Build and start services
docker-compose up -d --build
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use Docker secrets or external secret management in production
- Keep Docker images updated with security patches
- Use non-root users in containers (already configured)
- Limit exposed ports to necessary services only

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Environment Variables in Docker Compose](https://docs.docker.com/compose/environment-variables/)

