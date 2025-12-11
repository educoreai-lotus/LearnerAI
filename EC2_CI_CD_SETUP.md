# CI/CD Setup for EC2 Deployment

This guide shows you how to set up automated deployment to EC2 using GitHub Actions.

## Overview

When you push code to GitHub, it will:
1. ✅ Build Docker images
2. ✅ Push images to Docker Hub (or AWS ECR)
3. ✅ SSH into EC2 instance
4. ✅ Pull latest images
5. ✅ Restart containers

---

## Option 1: Using Docker Hub (Easier)

### Step 1: Create Docker Hub Account

1. Sign up at [hub.docker.com](https://hub.docker.com)
2. Create repositories:
   - `your-dockerhub-username/learnerai-backend`
   - `your-dockerhub-username/learnerai-frontend`

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

```
EC2_HOST=your-ec2-public-ip-or-domain
EC2_USER=ubuntu
EC2_SSH_KEY=your-private-key-content (paste entire .pem file content)
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

**To get Docker Hub token:**
- Docker Hub → Account Settings → Security → New Access Token

**To get SSH key content:**
```cmd
# On Windows, read the key file:
type C:\Users\win10\Downloads\learnerai.pem
# Copy the entire content (including -----BEGIN and -----END lines)
```

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy-ec2.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/learnerai-backend:latest
        cache-from: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/learnerai-backend:buildcache
        cache-to: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/learnerai-backend:buildcache,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/learnerai-frontend:latest
        cache-from: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/learnerai-frontend:buildcache
        cache-to: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/learnerai-frontend:buildcache,mode=max
    
    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.9.0
      with:
        ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
    
    - name: Add EC2 to known hosts
      run: |
        ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
    
    - name: Deploy to EC2
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'EOF'
          cd ~/learnerai
          
          # Login to Docker Hub
          echo "${{ secrets.DOCKERHUB_TOKEN }}" | docker login -u "${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin
          
          # Pull latest images
          docker-compose pull
          
          # Restart containers
          docker-compose up -d
          
          # Clean up old images
          docker image prune -f
          
          # Show running containers
          docker ps
        EOF
```

### Step 4: Update docker-compose.yml on EC2

Make sure your `docker-compose.yml` on EC2 uses Docker Hub images:

```yaml
services:
  backend:
    image: your-dockerhub-username/learnerai-backend:latest
    # ... rest of config
  
  frontend:
    image: your-dockerhub-username/learnerai-frontend:latest
    # ... rest of config
```

---

## Option 2: Using AWS ECR (More Secure)

### Step 1: Create ECR Repositories

1. AWS Console → **ECR** → **Create repository**
2. Create:
   - `learnerai-backend`
   - `learnerai-frontend`

### Step 2: Add GitHub Secrets

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
EC2_HOST=your-ec2-public-ip
EC2_USER=ubuntu
EC2_SSH_KEY=your-private-key-content
```

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy-ec2-ecr.yml`:

```yaml
name: Deploy to EC2 via ECR

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
    
    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/learnerai-backend:latest
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/learnerai-frontend:latest
    
    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.9.0
      with:
        ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
    
    - name: Deploy to EC2
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << EOF
          cd ~/learnerai
          
          # Login to ECR
          aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | \
            docker login --username AWS --password-stdin \
            ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com
          
          # Pull latest images
          docker-compose pull
          
          # Restart containers
          docker-compose up -d
          
          # Clean up
          docker image prune -f
        EOF
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Option 3: Simple Script-Based Deployment (Easiest)

### Step 1: Create Deployment Script on EC2

SSH into EC2 and create `~/learnerai/deploy.sh`:

```bash
#!/bin/bash
cd ~/learnerai

# Pull latest code (if using git)
# git pull origin main

# Pull latest Docker images
docker-compose pull

# Restart containers
docker-compose up -d --force-recreate

# Clean up old images
docker image prune -f

# Show status
docker ps
docker-compose logs --tail=50
```

Make it executable:
```bash
chmod +x ~/learnerai/deploy.sh
```

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy-ec2-simple.yml`:

```yaml
name: Deploy to EC2 (Simple)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.9.0
      with:
        ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
    
    - name: Deploy to EC2
      run: |
        ssh -o StrictHostKeyChecking=no ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'EOF'
          cd ~/learnerai
          
          # Pull latest images from Docker Hub
          docker-compose pull
          
          # Restart containers
          docker-compose up -d
          
          # Clean up
          docker image prune -f
          
          echo "✅ Deployment complete!"
          docker ps
        EOF
```

**Note:** This assumes you manually build and push images to Docker Hub, then this script just pulls and restarts.

---

## Recommended: Complete Automated Pipeline

Here's a complete workflow that builds, pushes, and deploys:

```yaml
name: CI/CD to EC2

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
  BACKEND_IMAGE: ${{ secrets.DOCKERHUB_USERNAME }}/learnerai-backend
  FRONTEND_IMAGE: ${{ secrets.DOCKERHUB_USERNAME }}/learnerai-frontend

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Extract metadata for backend
      id: meta-backend
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.BACKEND_IMAGE }}
        tags: |
          type=ref,event=branch
          type=sha,prefix={{branch}}-
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
    
    - name: Build and push backend
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta-backend.outputs.tags }}
        labels: ${{ steps.meta-backend.outputs.labels }}
        cache-from: type=registry,ref=${{ env.BACKEND_IMAGE }}:buildcache
        cache-to: type=registry,ref=${{ env.BACKEND_IMAGE }}:buildcache,mode=max
    
    - name: Extract metadata for frontend
      id: meta-frontend
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.FRONTEND_IMAGE }}
        tags: |
          type=ref,event=branch
          type=sha,prefix={{branch}}-
    
    - name: Build and push frontend
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ steps.meta-frontend.outputs.tags }}
        labels: ${{ steps.meta-frontend.outputs.labels }}
        cache-from: type=registry,ref=${{ env.FRONTEND_IMAGE }}:buildcache
        cache-to: type=registry,ref=${{ env.FRONTEND_IMAGE }}:buildcache,mode=max
    
    - name: Setup SSH
      uses: webfactory/ssh-agent@v0.9.0
      with:
        ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
    
    - name: Add EC2 to known hosts
      run: |
        mkdir -p ~/.ssh
        ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
    
    - name: Deploy to EC2
      run: |
        ssh ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} << 'DEPLOY'
          set -e
          cd ~/learnerai
          
          echo "🔐 Logging into Docker Hub..."
          echo "${{ secrets.DOCKERHUB_TOKEN }}" | docker login -u "${{ secrets.DOCKERHUB_USERNAME }}" --password-stdin
          
          echo "📥 Pulling latest images..."
          docker-compose pull
          
          echo "🔄 Restarting containers..."
          docker-compose up -d --force-recreate
          
          echo "🧹 Cleaning up old images..."
          docker image prune -f
          
          echo "✅ Deployment complete!"
          echo ""
          echo "📊 Container status:"
          docker ps
          
          echo ""
          echo "📋 Recent logs:"
          docker-compose logs --tail=20
        DEPLOY
    
    - name: Health Check
      run: |
        sleep 10
        curl -f http://${{ secrets.EC2_HOST }}:5000/health || exit 1
        echo "✅ Backend health check passed!"
```

---

## Setup Steps Summary

1. **Choose deployment method** (Docker Hub recommended for simplicity)
2. **Add GitHub Secrets** (SSH key, Docker Hub credentials, EC2 host)
3. **Create workflow file** (`.github/workflows/deploy-ec2.yml`)
4. **Update docker-compose.yml** on EC2 to use your image registry
5. **Test deployment** by pushing to main branch

---

## Testing

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch the workflow run
5. Check EC2 logs:
   ```bash
   ssh ubuntu@your-ec2-ip
   docker-compose logs -f
   ```

---

## Troubleshooting

### ❌ SSH Connection Failed
- Check EC2 security group allows port 22 from GitHub Actions IPs
- Verify SSH key secret is correct (include BEGIN/END lines)
- Check EC2 instance is running

### ❌ Docker Login Failed
- Verify Docker Hub token is correct
- Check token has proper permissions

### ❌ Images Not Found
- Make sure images are pushed successfully
- Check image names match in docker-compose.yml

### ❌ Containers Not Starting
- Check environment variables are set on EC2
- View logs: `docker-compose logs`

---

## Security Best Practices

1. ✅ Use GitHub Secrets (never commit credentials)
2. ✅ Use IAM roles instead of access keys (for AWS)
3. ✅ Restrict SSH access to specific IPs
4. ✅ Use Docker Hub access tokens (not passwords)
5. ✅ Regularly rotate secrets
6. ✅ Enable 2FA on Docker Hub and GitHub

---

## Next Steps

After setting up CD:
1. Set up monitoring (CloudWatch, Datadog, etc.)
2. Configure alerts for failed deployments
3. Set up staging environment
4. Add rollback mechanism
5. Configure blue-green deployments

