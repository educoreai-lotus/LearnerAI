# Docker Hub Push Guide

This guide explains how to push your LearnerAI Docker images to Docker Hub.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Hub account (you already have one)
- Images built locally

## 🚀 Steps to Push to Docker Hub

### 1. Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

**Alternative:** Login with username directly:
```bash
docker login -u YOUR_DOCKERHUB_USERNAME
```

### 2. Tag Your Images

Tag your images with your Docker Hub username:

```bash
# Tag frontend image
docker tag learnerai-frontend YOUR_DOCKERHUB_USERNAME/learnerai-frontend:latest

# Tag backend image
docker tag learnerai-backend YOUR_DOCKERHUB_USERNAME/learnerai-backend:latest
```

**Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username.**

**Example:**
```bash
docker tag learnerai-frontend johndoe/learnerai-frontend:latest
docker tag learnerai-backend johndoe/learnerai-backend:latest
```

### 3. Push Images to Docker Hub

```bash
# Push frontend
docker push YOUR_DOCKERHUB_USERNAME/learnerai-frontend:latest

# Push backend
docker push YOUR_DOCKERHUB_USERNAME/learnerai-backend:latest
```

**Example:**
```bash
docker push johndoe/learnerai-frontend:latest
docker push johndoe/learnerai-backend:latest
```

## 🔧 Quick Script (All-in-One)

Create a file `push-to-dockerhub.sh` (or `push-to-dockerhub.bat` for Windows):

### Windows Batch File (`push-to-dockerhub.bat`):

```batch
@echo off
set DOCKERHUB_USERNAME=YOUR_DOCKERHUB_USERNAME

echo Logging in to Docker Hub...
docker login -u %DOCKERHUB_USERNAME%

echo Building images...
docker-compose build

echo Tagging images...
docker tag learnerai-frontend %DOCKERHUB_USERNAME%/learnerai-frontend:latest
docker tag learnerai-backend %DOCKERHUB_USERNAME%/learnerai-backend:latest

echo Pushing frontend...
docker push %DOCKERHUB_USERNAME%/learnerai-frontend:latest

echo Pushing backend...
docker push %DOCKERHUB_USERNAME%/learnerai-backend:latest

echo Done! Images pushed to Docker Hub.
```

### Linux/Mac Shell Script (`push-to-dockerhub.sh`):

```bash
#!/bin/bash
DOCKERHUB_USERNAME="YOUR_DOCKERHUB_USERNAME"

echo "Logging in to Docker Hub..."
docker login -u $DOCKERHUB_USERNAME

echo "Building images..."
docker-compose build

echo "Tagging images..."
docker tag learnerai-frontend $DOCKERHUB_USERNAME/learnerai-frontend:latest
docker tag learnerai-backend $DOCKERHUB_USERNAME/learnerai-backend:latest

echo "Pushing frontend..."
docker push $DOCKERHUB_USERNAME/learnerai-frontend:latest

echo "Pushing backend..."
docker push $DOCKERHUB_USERNAME/learnerai-backend:latest

echo "Done! Images pushed to Docker Hub."
```

**Make executable (Linux/Mac):**
```bash
chmod +x push-to-dockerhub.sh
```

## 📝 Using Docker Hub Images in docker-compose.yml

After pushing, you can update `docker-compose.yml` to pull from Docker Hub instead of building locally:

```yaml
services:
  backend:
    image: YOUR_DOCKERHUB_USERNAME/learnerai-backend:latest
    # Remove or comment out the build section:
    # build:
    #   context: ./backend
    #   dockerfile: Dockerfile
    # ... rest of config

  frontend:
    image: YOUR_DOCKERHUB_USERNAME/learnerai-frontend:latest
    # Remove or comment out the build section:
    # build:
    #   context: ./frontend
    #   dockerfile: Dockerfile
    # ... rest of config
```

Then run:
```bash
docker-compose pull
docker-compose up -d
```

## 🏷️ Versioning Your Images

For better version control, tag with version numbers:

```bash
# Tag with version
docker tag learnerai-frontend YOUR_DOCKERHUB_USERNAME/learnerai-frontend:1.0.0
docker tag learnerai-backend YOUR_DOCKERHUB_USERNAME/learnerai-backend:1.0.0

# Push versioned tags
docker push YOUR_DOCKERHUB_USERNAME/learnerai-frontend:1.0.0
docker push YOUR_DOCKERHUB_USERNAME/learnerai-backend:1.0.0

# Also push as latest
docker push YOUR_DOCKERHUB_USERNAME/learnerai-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/learnerai-backend:latest
```

## 🔍 Verify Images on Docker Hub

1. Go to https://hub.docker.com
2. Login to your account
3. Navigate to "Repositories"
4. You should see `learnerai-frontend` and `learnerai-backend`

## 📋 Complete Command List

```bash
# 1. Login
docker login

# 2. Build images (if not already built)
docker-compose build

# 3. Tag images
docker tag learnerai-frontend YOUR_USERNAME/learnerai-frontend:latest
docker tag learnerai-backend YOUR_USERNAME/learnerai-backend:latest

# 4. Push images
docker push YOUR_USERNAME/learnerai-frontend:latest
docker push YOUR_USERNAME/learnerai-backend:latest

# 5. Verify (optional)
docker images | grep YOUR_USERNAME
```

## ⚠️ Important Notes

1. **Image Names:** Docker Hub image names must be lowercase and can contain hyphens
2. **Public vs Private:** By default, images are public. For private repos, upgrade your Docker Hub plan
3. **Size Limits:** Free accounts have pull rate limits. Large images may take time to push
4. **Authentication:** Your login token is stored in `~/.docker/config.json`

## 🐛 Troubleshooting

### "denied: requested access to the resource is denied"
- Check your Docker Hub username is correct
- Ensure you're logged in: `docker login`
- Verify image name matches your username

### "unauthorized: authentication required"
- Login again: `docker login`
- Check your Docker Hub credentials

### Push is slow
- Large images take time to upload
- Check your internet connection
- Consider using multi-stage builds to reduce image size

## 📚 Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Push Documentation](https://docs.docker.com/engine/reference/commandline/push/)

