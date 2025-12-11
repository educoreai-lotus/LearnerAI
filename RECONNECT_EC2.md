# Quick Guide: Reconnect to EC2 Instance

## Step 1: Find Your EC2 Public IP

1. Go to **AWS Console** → **EC2** → **Instances**
2. Find your instance (name: `learnerai-server` or similar)
3. Copy the **Public IPv4 address** (e.g., `54.123.45.67`)

**Note:** If your instance was stopped, the IP might have changed. Check the new IP address.

---

## Step 2: Locate Your SSH Key File

Your key file is usually named `learnerai-key.pem` and might be in:
- `C:\Users\win10\Downloads\learnerai-key.pem`
- `C:\Users\win10\Desktop\learnerai-key.pem`
- Or wherever you saved it

---

## Step 3: Reconnect via CMD or PowerShell

### Option A: Using CMD (Command Prompt)

1. Open **CMD** (Windows Key + R → type `cmd` → Enter)
2. Navigate to where your key file is (optional):
   ```cmd
   cd C:\Users\win10\Downloads
   ```
3. Run SSH command:
   ```cmd
   ssh -i learnerai-key.pem ubuntu@YOUR_PUBLIC_IP
   ```

**Replace `YOUR_PUBLIC_IP` with your actual IP (e.g., `54.123.45.67`)**

**Example:**
```cmd
ssh -i learnerai-key.pem ubuntu@54.123.45.67
```

### Option B: Using PowerShell

1. Open **PowerShell**
2. Run SSH command:
   ```powershell
   ssh -i "C:\Users\win10\Downloads\learnerai-key.pem" ubuntu@YOUR_PUBLIC_IP
   ```

**Example:**
```powershell
ssh -i "C:\Users\win10\Downloads\learnerai-key.pem" ubuntu@54.123.45.67
```

---

## Step 4: First Connection Warning

If you see:
```
The authenticity of host '54.123.45.67' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes` and press Enter.

---

## Troubleshooting

### ❌ "Permission denied (publickey)"

**Fix:** Make sure the key file path is correct and accessible:
```cmd
# Try with full path
ssh -i "C:\Users\win10\Downloads\learnerai-key.pem" ubuntu@YOUR_PUBLIC_IP
```

### ❌ "Could not resolve hostname"

**Fix:** Check your internet connection and verify the IP address in AWS Console.

### ❌ "Connection timed out"

**Possible causes:**
1. **Instance is stopped** - Go to AWS Console → EC2 → Start the instance
2. **Security group** - Make sure port 22 (SSH) is open for your IP
3. **Wrong IP** - Check the Public IPv4 address in AWS Console (it changes if instance was stopped/started)

### ❌ "Bad permissions"

**Fix (Windows):**
1. Right-click the `.pem` file → **Properties**
2. Go to **Security** tab
3. Click **Advanced** → **Disable inheritance** → **Remove all inherited permissions**
4. Add your user with **Read** permission only

---

## Quick Check: Is Your Instance Running?

1. Go to **AWS Console** → **EC2** → **Instances**
2. Check **Instance State**:
   - ✅ **Running** = Good, you can connect
   - ⏸️ **Stopped** = Start it first (right-click → **Start instance**)
   - ⚠️ **Stopping** = Wait until it's **Running**

---

## After Connecting Successfully

Once connected, you'll see:
```
Welcome to Ubuntu 22.04 LTS...
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

**Check if Docker containers are running:**
```bash
docker ps
```

**View logs:**
```bash
cd ~/learnerai
docker-compose logs -f
```

**Check if services are up:**
```bash
curl http://localhost:5000/health
```

---

## Quick Reference Commands

```bash
# Check Docker containers
docker ps

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Check disk space
df -h

# Check memory
free -h
```

