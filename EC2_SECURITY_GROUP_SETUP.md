# EC2 Security Group Setup - Open Frontend Port

## How to Edit Inbound Rules for Frontend Port (3000)

### Step 1: Go to EC2 Console

1. Open **AWS Console**
2. Navigate to **EC2** → **Instances**
3. Find your instance (e.g., `learnerai-server`)
4. Click on your instance to select it

### Step 2: Open Security Group

1. In the instance details panel (bottom), find the **Security** tab
2. Click on the **Security group** name (e.g., `learnerai-sg`)
   - OR click the **Security groups** link in the details panel

### Step 3: Edit Inbound Rules

1. In the Security Group page, click the **Inbound rules** tab
2. Click **Edit inbound rules** button (top right)

### Step 4: Add Frontend Port Rule

1. Click **Add rule** button
2. Configure the new rule:
   - **Type:** Custom TCP
   - **Port range:** `3000`
   - **Source:** Choose one:
     - **Anywhere-IPv4** (`0.0.0.0/0`) - Allows access from anywhere (for testing)
     - **My IP** - Only allows your current IP (more secure)
     - **Custom** - Enter specific IP addresses or CIDR blocks
   - **Description:** `LearnerAI Frontend`

3. Click **Add rule** again if you also need to add backend port:
   - **Type:** Custom TCP
   - **Port range:** `5000`
   - **Source:** Same as above
   - **Description:** `LearnerAI Backend`

### Step 5: Save Rules

1. Click **Save rules** button (bottom right)
2. Wait for confirmation: "Successfully updated security group rules"

---

## Quick Visual Guide

```
AWS Console → EC2 → Instances
  ↓
Click your instance
  ↓
Security tab → Click Security group name
  ↓
Inbound rules tab → Edit inbound rules
  ↓
Add rule:
  - Type: Custom TCP
  - Port: 3000 (frontend)
  - Port: 5000 (backend)
  - Source: Anywhere-IPv4 (0.0.0.0/0) or My IP
  ↓
Save rules
```

---

## Recommended Security Rules

### For Testing/Development:
```
Type          Port    Source              Description
Custom TCP    22      My IP               SSH access
Custom TCP    3000    0.0.0.0/0           Frontend (public)
Custom TCP    5000    0.0.0.0/0           Backend API (public)
```

### For Production (More Secure):
```
Type          Port    Source              Description
Custom TCP    22      Your Office IP      SSH access
Custom TCP    3000    0.0.0.0/0           Frontend (public)
Custom TCP    5000    Frontend IP only    Backend API (restricted)
HTTP          80      0.0.0.0/0           HTTP (if using load balancer)
HTTPS         443     0.0.0.0/0           HTTPS (if using load balancer)
```

---

## Verify Ports Are Open

After saving, test from your local machine:

```cmd
# Test frontend (should return HTML or connection successful)
curl http://YOUR_EC2_PUBLIC_IP:3000

# Test backend health endpoint
curl http://YOUR_EC2_PUBLIC_IP:5000/health
```

Or open in browser:
- Frontend: `http://YOUR_EC2_PUBLIC_IP:3000`
- Backend Health: `http://YOUR_EC2_PUBLIC_IP:5000/health`

---

## Troubleshooting

### ❌ Still can't access after adding rules?

1. **Check instance is running:**
   - AWS Console → EC2 → Instances → Status should be "Running"

2. **Verify security group is attached:**
   - Instance details → Security tab → Should show your security group

3. **Check if containers are running on EC2:**
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   docker ps
   ```

4. **Verify ports are listening:**
   ```bash
   # On EC2 instance
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :5000
   ```

5. **Check firewall on EC2:**
   ```bash
   # On EC2 instance
   sudo ufw status
   # If enabled, allow ports:
   sudo ufw allow 3000/tcp
   sudo ufw allow 5000/tcp
   ```

### ❌ Connection timeout?

- Make sure you're using the **Public IPv4** address (not Private IP)
- Check if your IP changed (if using "My IP" rule)
- Verify the security group rule was saved successfully

---

## Alternative: Using AWS CLI

If you prefer command line:

```bash
# Add rule for port 3000 (frontend)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Add rule for port 5000 (backend)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0 \
  --region us-east-1
```

**To find your security group ID:**
- AWS Console → EC2 → Security Groups → Your security group → Copy the **Group ID** (e.g., `sg-0123456789abcdef0`)

---

## Security Best Practices

1. **Use "My IP" for SSH (port 22)** - Only allow SSH from your current location
2. **Use Load Balancer** - For production, use AWS Application Load Balancer instead of exposing ports directly
3. **Use HTTPS** - Set up SSL certificate (Let's Encrypt or AWS Certificate Manager)
4. **Restrict Backend Port** - Only allow backend (5000) from frontend IP or load balancer
5. **Regular Audits** - Review security group rules periodically

---

## Quick Reference

**Ports to open:**
- **22** - SSH (for server management)
- **3000** - Frontend (React/Vite app)
- **5000** - Backend API (Node.js)

**Common mistake:** Forgetting to save rules after editing!

