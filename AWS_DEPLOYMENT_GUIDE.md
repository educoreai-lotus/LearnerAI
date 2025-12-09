# AWS Deployment Guide for LearnerAI

This guide covers deploying your Docker containers to AWS using various services.

## 🎯 AWS Deployment Options

### Option 1: AWS ECR (Elastic Container Registry) + ECS (Elastic Container Service)
**Best for:** Production deployments with auto-scaling and load balancing

### Option 2: AWS ECR + EC2
**Best for:** More control over infrastructure

### Option 3: AWS App Runner
**Best for:** Simple container deployments without managing infrastructure

### Option 4: AWS ECR + Fargate
**Best for:** Serverless container deployments

---

## 📋 Option 1: AWS ECR + ECS (Recommended)

### Step 1: Create AWS ECR Repository

1. Go to AWS Console → **ECR (Elastic Container Registry)**
2. Click **"Create repository"**
3. Choose **"Private"** or **"Public"**
4. Repository name: `learnerai-backend` (repeat for `learnerai-frontend`)
5. Click **"Create repository"**

### Step 2: Get ECR Login Command

In AWS Console, click on your repository → **"View push commands"**

Or use AWS CLI:
```bash
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
```

**Replace:**
- `YOUR_REGION` - e.g., `us-east-1`
- `YOUR_ACCOUNT_ID` - Your AWS account ID (12 digits)

### Step 3: Tag Your Images

```bash
docker tag learnerai-backend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker tag learnerai-frontend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
```

### Step 4: Push to ECR

```bash
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
```

### Step 5: Create ECS Cluster

1. Go to **ECS** → **Clusters** → **"Create Cluster"**
2. Choose **"EC2 Linux + Networking"** or **"Fargate"**
3. Configure:
   - Cluster name: `learnerai-cluster`
   - Instance type: `t3.medium` or larger
   - Number of instances: 2 (for high availability)
4. Click **"Create"**

### Step 6: Create ECS Task Definition

1. Go to **ECS** → **Task Definitions** → **"Create new Task Definition"**
2. Choose **"Fargate"** or **"EC2"**
3. Configure:
   - Task definition name: `learnerai-backend`
   - Task role: Create new or use existing
   - Task execution role: Create new
   - CPU: 512 (0.5 vCPU)
   - Memory: 1024 (1 GB)
4. Add container:
   - Container name: `backend`
   - Image URI: `YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1`
   - Port mappings: `5000:5000`
   - Environment variables: Add all from your `.env` file
5. Click **"Create"**

Repeat for frontend with:
- Task definition name: `learnerai-frontend`
- Image: `learnerai-frontend:0.0.1`
- Port: `3000:80`

### Step 7: Create ECS Service

1. Go to your cluster → **"Create Service"**
2. Configure:
   - Launch type: **Fargate** or **EC2**
   - Task definition: `learnerai-backend`
   - Service name: `learnerai-backend-service`
   - Number of tasks: 1 (or more for scaling)
   - VPC: Select your VPC
   - Subnets: Select 2+ subnets
   - Security groups: Create/select security group allowing port 5000
   - Load balancer: Create Application Load Balancer (optional)
3. Click **"Create Service"**

Repeat for frontend service.

---

## 📋 Option 2: AWS ECR + EC2

### Step 1-4: Same as Option 1 (Push to ECR)

### Step 5: Launch EC2 Instance

1. Go to **EC2** → **Instances** → **"Launch Instance"**
2. Configure:
   - Name: `learnerai-server`
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance type: `t3.medium` or larger
   - Key pair: Create/select key pair
   - Security group: Allow ports 22 (SSH), 5000 (backend), 3000 (frontend)
   - Storage: 20 GB minimum
3. Click **"Launch Instance"**

### Step 6: Install Docker on EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

Install Docker:
```bash
# For Amazon Linux
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Logout and login again, or run:
newgrp docker
```

### Step 7: Login to ECR and Pull Images

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Login to ECR
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com

# Pull images
docker pull YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker pull YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
```

### Step 8: Create docker-compose.yml on EC2

Create `docker-compose.yml` on EC2 with ECR image URLs:

```yaml
version: '3.8'
services:
  backend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
    ports:
      - "5000:5000"
    environment:
      # Add your environment variables here
      - NODE_ENV=production
      # ... etc
      
  frontend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
    ports:
      - "3000:80"
```

### Step 9: Run Containers

```bash
docker-compose up -d
```

---

## 📋 Option 3: AWS App Runner (Simplest)

### Step 1: Push to ECR (Steps 1-4 from Option 1)

### Step 2: Create App Runner Service

1. Go to **App Runner** → **"Create service"**
2. Source: **"Container registry"** → **"Amazon ECR"**
3. Select your ECR repository: `learnerai-backend`
4. Configure:
   - Service name: `learnerai-backend`
   - CPU: 0.5 vCPU
   - Memory: 1 GB
   - Port: 5000
   - Environment variables: Add from `.env`
5. Click **"Create & deploy"**

Repeat for frontend.

---

## 🔐 Environment Variables in AWS

### For ECS Task Definitions:
Add environment variables in the container definition:
- Key: `GEMINI_API_KEY`
- Value: `your_actual_key`

### For EC2:
Create `.env` file on EC2 or use:
```bash
export GEMINI_API_KEY=your_key
export SUPABASE_URL=your_url
# ... etc
```

### For App Runner:
Add in the service configuration → Environment variables section

### Using AWS Secrets Manager (Recommended for Production):

1. Go to **Secrets Manager** → **"Store a new secret"**
2. Choose **"Other type of secret"**
3. Add key-value pairs:
   ```
   GEMINI_API_KEY: your_key
   SUPABASE_URL: your_url
   ```
4. Secret name: `learnerai-secrets`
5. Create secret

Then reference in ECS Task Definition:
- Add secret: `GEMINI_API_KEY` → `arn:aws:secretsmanager:region:account:secret:learnerai-secrets:GEMINI_API_KEY::`

---

## 🌐 Setting Up Load Balancer

### Application Load Balancer (ALB):

1. Go to **EC2** → **Load Balancers** → **"Create Load Balancer"**
2. Choose **"Application Load Balancer"**
3. Configure:
   - Name: `learnerai-alb`
   - Scheme: **Internet-facing**
   - IP address type: **IPv4**
   - VPC: Your VPC
   - Subnets: Select 2+ public subnets
   - Security group: Allow HTTP (80) and HTTPS (443)
4. Listeners:
   - Port 80 → Target group for frontend
   - Port 5000 → Target group for backend
5. Target groups:
   - Frontend: Port 80, Health check: `/health`
   - Backend: Port 5000, Health check: `/health`
6. Register ECS tasks or EC2 instances as targets

---

## 📊 Monitoring & Logging

### CloudWatch Logs:

ECS automatically sends logs to CloudWatch:
- Log group: `/ecs/learnerai-backend`
- View logs: CloudWatch → Log groups

### CloudWatch Metrics:

Monitor:
- CPU utilization
- Memory utilization
- Request count
- Error rate

---

## 💰 Cost Estimation

### ECS Fargate:
- Backend: ~$15-30/month (0.5 vCPU, 1GB RAM, 24/7)
- Frontend: ~$15-30/month
- **Total: ~$30-60/month**

### EC2:
- t3.medium: ~$30/month
- Data transfer: Variable
- **Total: ~$30-50/month**

### App Runner:
- Similar to Fargate pricing
- **Total: ~$30-60/month**

---

## 🚀 Quick Start Commands

### Push to ECR:
```bash
# Login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag
docker tag learnerai-backend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/learnerai-backend:0.0.1
docker tag learnerai-frontend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/learnerai-frontend:0.0.1

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/learnerai-backend:0.0.1
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/learnerai-frontend:0.0.1
```

---

## 📚 Additional Resources

- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [AWS CLI Installation](https://aws.amazon.com/cli/)

---

## ⚠️ Important Notes

1. **Security Groups:** Always restrict access to necessary ports only
2. **IAM Roles:** Use least privilege principle for IAM roles
3. **Secrets:** Never commit secrets to code; use AWS Secrets Manager
4. **Backup:** Set up automated backups for databases
5. **Monitoring:** Enable CloudWatch alarms for errors and high CPU/memory
6. **Costs:** Monitor AWS costs regularly; set up billing alerts


