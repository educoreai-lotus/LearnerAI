# AWS EC2 Ubuntu Deployment Guide for LearnerAI

Step-by-step guide to deploy LearnerAI Docker containers on AWS EC2 with Ubuntu.

## 📋 Prerequisites

- AWS Account
- AWS CLI installed locally (optional, but helpful)
- Docker images built locally (`learnerai-backend:0.0.1` and `learnerai-frontend:0.0.1`)
- SSH key pair for EC2 access

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Images to AWS ECR (Elastic Container Registry)

#### 1.1 Create ECR Repositories

1. Go to **AWS Console** → **ECR (Elastic Container Registry)**
2. Click **"Create repository"**
3. Configure:
   - **Visibility settings:** Private
   - **Repository name:** `learnerai-backend`
   - **Tag immutability:** Disabled (or Enabled for production)
4. Click **"Create repository"**
5. Repeat for `learnerai-frontend`

#### 1.2 Get ECR Login Command

In AWS Console → ECR → Your repository → Click **"View push commands"**

Or note your:
- **AWS Account ID** (12 digits)
- **AWS Region** (e.g., `us-east-1`)

#### 1.3 Login to ECR from Your Local Machine

**On Windows (CMD or PowerShell):**

```cmd
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
```

**Replace:**
- `YOUR_REGION` → e.g., `us-east-1`
- `YOUR_ACCOUNT_ID` → Your 12-digit AWS account ID

**Example:**
```cmd
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

#### 1.4 Tag Your Images

```cmd
docker tag learnerai-backend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker tag learnerai-frontend:0.0.1 YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
```

**Example:**
```cmd
docker tag learnerai-backend:0.0.1 123456789012.dkr.ecr.us-east-1.amazonaws.com/learnerai-backend:0.0.1
docker tag learnerai-frontend:0.0.1 123456789012.dkr.ecr.us-east-1.amazonaws.com/learnerai-frontend:0.0.1
```

#### 1.5 Push Images to ECR

```cmd
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
```

---

### Step 2: Launch EC2 Instance with Ubuntu

#### 2.1 Go to EC2 Console

1. Go to **AWS Console** → **EC2** → **Instances**
2. Click **"Launch Instance"**

#### 2.2 Configure Instance

**Name and tags:**
- Name: `learnerai-server`

**Application and OS Images:**
- **Ubuntu** → Select **Ubuntu Server 22.04 LTS** (or latest)

**Instance type:**
- **t3.medium** (2 vCPU, 4 GB RAM) - minimum recommended
- Or **t3.large** (2 vCPU, 8 GB RAM) for better performance

**Key pair:**
- Create new key pair or select existing
- Name: `learnerai-key`
- Key pair type: **RSA**
- Private key file format: **.pem** (for Linux/Mac) or **.ppk** (for PuTTY on Windows)
- Click **"Create key pair"** and **download** the key file
- ⚠️ **IMPORTANT:** Save this key file securely - you'll need it to SSH into the instance

**Network settings:**
- **Create security group** or select existing
- Security group name: `learnerai-sg`
- Allow SSH (port 22) from:
  - **My IP** (recommended) or **Anywhere-IPv4** (0.0.0.0/0) for testing
- Allow **Custom TCP** port **5000** (backend) from:
  - **Anywhere-IPv4** (0.0.0.0/0) or specific IPs
- Allow **Custom TCP** port **3000** (frontend) from:
  - **Anywhere-IPv4** (0.0.0.0/0) or specific IPs
- Allow **HTTP** (port 80) and **HTTPS** (port 443) if using load balancer

**Configure storage:**
- **20 GB** gp3 (minimum)
- Or **30 GB** for more space

#### 2.3 Launch Instance

1. Review settings
2. Click **"Launch Instance"**
3. Wait for instance to be **"Running"** (Status checks: 2/2 checks passed)

#### 2.4 Note Your Instance Details

- **Public IPv4 address:** `X.X.X.X` (you'll use this to SSH)
- **Instance ID:** `i-xxxxxxxxxxxxx`

---

### Step 3: Connect to EC2 Instance

#### 3.1 On Windows (Using PowerShell or CMD)

**If you have OpenSSH installed (Windows 10/11):**

```cmd
ssh -i path/to/learnerai-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Example:**
```cmd
ssh -i C:\Users\win10\Downloads\learnerai-key.pem ubuntu@54.123.45.67
```

**If using PuTTY (Windows):**

1. Convert `.pem` to `.ppk` using PuTTYgen
2. Use PuTTY to connect:
   - Host: `ubuntu@YOUR_PUBLIC_IP`
   - Port: `22`
   - Connection type: **SSH**
   - Auth → Credentials → Private key: Select your `.ppk` file

#### 3.2 First Connection

You'll see a security warning - type `yes` to continue.

**If you get "Permission denied":**
- Make sure the key file has correct permissions (Windows: right-click → Properties → Security → Remove inheritance)
- On Linux/Mac: `chmod 400 learnerai-key.pem`

---

### Step 4: Install Docker on Ubuntu EC2

Once connected to your EC2 instance, run:

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group (to run docker without sudo)
sudo usermod -aG docker ubuntu

# Verify Docker installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

**Reconnect to EC2:**
```cmd
ssh -i path/to/learnerai-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Verify Docker works without sudo:**
```bash
docker ps
```

---

### Step 5: Install AWS CLI on EC2

```bash
# Download AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Install unzip if not installed
sudo apt-get install -y unzip

# Unzip
unzip awscliv2.zip

# Install AWS CLI
sudo ./aws/install

# Verify installation
aws --version

# Configure AWS credentials (you'll need AWS Access Key ID and Secret Access Key)
aws configure
```

**AWS Credentials Setup:**
1. Go to **AWS Console** → **IAM** → **Users** → Your user → **Security credentials**
2. Click **"Create access key"**
3. Choose **"Command Line Interface (CLI)"**
4. Download or copy:
   - **Access key ID**
   - **Secret access key**
5. Run `aws configure` and enter:
   - AWS Access Key ID: `YOUR_ACCESS_KEY`
   - AWS Secret Access Key: `YOUR_SECRET_KEY`
   - Default region: `us-east-1` (or your region)
   - Default output format: `json`

---

### Step 6: Login to ECR and Pull Images

```bash
# Login to ECR
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com

# Pull images
docker pull YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
docker pull YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1

# Verify images
docker images
```

---

### Step 7: Create docker-compose.yml on EC2

```bash
# Create project directory
mkdir -p ~/learnerai
cd ~/learnerai

# Create docker-compose.yml
nano docker-compose.yml
```

**Paste this content (replace YOUR_ACCOUNT_ID and YOUR_REGION):**

```yaml
version: '3.8'

services:
  backend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-backend:0.0.1
    container_name: learnerai-backend
    ports:
      - "5000:5000"
    environment:
      # Server Configuration
      - NODE_ENV=production
      - PORT=5000
      
      # Supabase Configuration
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SUPABASE_DB_HOST=${SUPABASE_DB_HOST}
      - SUPABASE_DB_PORT=${SUPABASE_DB_PORT:-5432}
      - SUPABASE_DB_USER=${SUPABASE_DB_USER:-postgres}
      - SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}
      - SUPABASE_DB_NAME=${SUPABASE_DB_NAME:-postgres}
      
      # Gemini API Configuration
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      
      # Microservice Configuration
      - LEARNER_AI_SERVICE_TOKEN=${LEARNER_AI_SERVICE_TOKEN}
      - SKILLS_ENGINE_TOKEN=${SKILLS_ENGINE_TOKEN}
      - SKILLS_ENGINE_URL=${SKILLS_ENGINE_URL:-http://skills-engine:5001}
      - COURSE_BUILDER_TOKEN=${COURSE_BUILDER_TOKEN}
      - COURSE_BUILDER_URL=${COURSE_BUILDER_URL:-http://course-builder:5002}
      - RAG_MICROSERVICE_TOKEN=${RAG_MICROSERVICE_TOKEN}
      - RAG_MICROSERVICE_URL=${RAG_MICROSERVICE_URL:-http://rag-service:5004}
      - ANALYTICS_TOKEN=${ANALYTICS_TOKEN}
      - ANALYTICS_URL=${ANALYTICS_URL:-http://analytics:5003}
      - REPORTS_TOKEN=${REPORTS_TOKEN}
      - REPORTS_URL=${REPORTS_URL:-http://reports:5005}
      
      # Coordinator Configuration
      - COORDINATOR_URL=${COORDINATOR_URL}
      - COORDINATOR_PUBLIC_KEY=${COORDINATOR_PUBLIC_KEY}
      - LEARNERAI_DOMAIN=${LEARNERAI_DOMAIN:-http://YOUR_PUBLIC_IP:5000}
      - LEARNERAI_PRIVATE_KEY=${LEARNERAI_PRIVATE_KEY}
      - SERVICE_NAME=${SERVICE_NAME:-learnerAI-service}
      - SERVICE_VERSION=${SERVICE_VERSION:-1.0.0}
      - SERVICE_DESCRIPTION=${SERVICE_DESCRIPTION:-LearnerAI Backend Service}
      - SERVICE_TEAM=${SERVICE_TEAM}
      - SERVICE_OWNER=${SERVICE_OWNER:-system}
      - SERVICE_CAPABILITIES=${SERVICE_CAPABILITIES}
      
      # API Configuration
      - API_VERSION=${API_VERSION:-v1}
      - FRONTEND_URL=${FRONTEND_URL:-http://YOUR_PUBLIC_IP:3000}
      
      # Job Processing
      - JOB_TIMEOUT_MS=${JOB_TIMEOUT_MS:-300000}
      - MAX_RETRIES=${MAX_RETRIES:-3}
      
      # Rate Limiting
      - RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS:-60000}
      - RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS:-100}
      
      # Railway Asset Access
      - RAILWAY_ASSET_KEY=${RAILWAY_ASSET_KEY}
      
      # SendGrid (optional)
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    networks:
      - learnerai-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/learnerai-frontend:0.0.1
    container_name: learnerai-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://YOUR_PUBLIC_IP:5000
      - VITE_API_VERSION=v1
      - VITE_ENV=production
    networks:
      - learnerai-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  learnerai-network:
    driver: bridge
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

### Step 8: Create .env File on EC2

```bash
# Create .env file
nano .env
```

**Paste your environment variables:**

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

# Gemini API Configuration
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
COORDINATOR_URL=https://coordinator.example.com
COORDINATOR_PUBLIC_KEY=your_coordinator_public_key
LEARNERAI_DOMAIN=http://YOUR_PUBLIC_IP:5000
LEARNERAI_PRIVATE_KEY=your_private_key_pem_format
SERVICE_NAME=learnerAI-service
SERVICE_VERSION=1.0.0
SERVICE_DESCRIPTION=LearnerAI Backend Service
SERVICE_TEAM=Your Team
SERVICE_OWNER=system
SERVICE_CAPABILITIES=learning-path-generation,approval-workflow

# API Configuration
API_VERSION=v1
FRONTEND_URL=http://YOUR_PUBLIC_IP:3000

# Job Processing
JOB_TIMEOUT_MS=300000
MAX_RETRIES=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Railway Asset Access
RAILWAY_ASSET_KEY=your_railway_asset_key

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

**Replace `YOUR_PUBLIC_IP` with your EC2 instance's public IP address.**

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

### Step 9: Update docker-compose.yml with Environment Variables

```bash
# Edit docker-compose.yml to use .env file
nano docker-compose.yml
```

Add `env_file` to both services:

```yaml
services:
  backend:
    # ... existing config ...
    env_file:
      - .env
      
  frontend:
    # ... existing config ...
    env_file:
      - .env
```

---

### Step 10: Start Containers

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker ps

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

### Step 11: Verify Deployment

**Test Backend:**
```bash
curl http://localhost:5000/health
```

**From your local machine:**
```cmd
curl http://YOUR_PUBLIC_IP:5000/health
```

**Test Frontend:**
Open in browser: `http://YOUR_PUBLIC_IP:3000`

---

## 🔄 Updating Containers

When you push new images to ECR:

```bash
# Login to ECR
aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com

# Pull latest images
docker-compose pull

# Restart containers
docker-compose up -d
```

---

## 🛠️ Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose stop

# Start containers
docker-compose start

# Restart containers
docker-compose restart

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --force-recreate

# View container status
docker ps

# Execute command in container
docker exec -it learnerai-backend sh
docker exec -it learnerai-frontend sh

# View container resource usage
docker stats
```

---

## 🔐 Security Best Practices

1. **Use Security Groups:** Only allow necessary ports
2. **Use IAM Roles:** Attach IAM role to EC2 instance for ECR access (instead of access keys)
3. **Keep System Updated:** `sudo apt-get update && sudo apt-get upgrade -y`
4. **Use HTTPS:** Set up SSL certificate with Let's Encrypt or AWS Certificate Manager
5. **Firewall:** Configure UFW (Uncomplicated Firewall)
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 5000/tcp
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

---

## 💰 Cost Estimation

- **EC2 t3.medium:** ~$30/month (24/7 running)
- **EC2 t3.large:** ~$60/month
- **Data transfer:** Variable (first 100 GB free)
- **ECR storage:** ~$0.10/GB/month (first 500 MB free)

**Total:** ~$30-60/month

---

## 🐛 Troubleshooting

### Cannot connect via SSH
- Check security group allows port 22 from your IP
- Verify key file permissions
- Check instance is running

### Docker permission denied
```bash
sudo usermod -aG docker ubuntu
# Logout and login again
```

### Cannot pull from ECR
- Verify AWS credentials: `aws configure list`
- Check IAM permissions for ECR
- Verify repository name and region

### Containers not starting
```bash
# Check logs
docker-compose logs

# Check environment variables
docker-compose config
```

### Port already in use
```bash
# Find process using port
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :3000

# Kill process or change port in docker-compose.yml
```

---

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)



