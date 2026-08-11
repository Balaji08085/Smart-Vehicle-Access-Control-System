# Smart Vehicle Access Control System using Secure QR Code and Real-Time Validation

A complete vehicle access control & security validation system for **Madras Christian College (MCC) — MRF Innovation Park**.

---

## 🚀 Features

- **Web Admin Portal**: Vehicle permit requests queue, startup approvals (`GREEN ERA`, `LEXPOSH`, `DSRI`, etc.), validity date editor & printable QR sticker generator.
- **Node.js Backend**: Express API, MongoDB database (`svacs`), local fallback storage, automated email notifications via SMTP.
- **Security Guard Mobile App (`Security_app/`)**: Flutter app with instant QR scanning, Camera HUD overlay, and audit history.

---

## 🛠️ Environment Configuration

In the `backend/` directory, configure your `.env` file with the database URI and server settings:

```env
# MongoDB Connection String (Local or Remote Server)
MONGO_URI=mongodb://admin:YourStrongPasswordHere@127.0.0.1:27017/svacs?authSource=admin

PORT=5000
JWT_SECRET=mcc_secure_jwt_secret_key_987654321

# Email Notifications (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🗄️ Step-by-Step MongoDB Deployment Guide

Follow these instructions to deploy and secure a production MongoDB server for this project.

### Method 1: Installing MongoDB on Ubuntu/Debian Server (Recommended)

#### Step 1: SSH into Your Server
```bash
ssh root@YOUR_SERVER_IP
```

#### Step 2: Update System & Add MongoDB Repository
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install prerequisite tools
sudo apt install -y gnupg curl

# Import official MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB 7.0 repository (for Ubuntu 22.04 LTS)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Refresh package lists
sudo apt update
```

#### Step 3: Install MongoDB Packages
```bash
sudo apt install -y mongodb-org
```

#### Step 4: Start & Enable MongoDB Service
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable auto-start on server boot
sudo systemctl enable mongod

# Verify service status (should display 'active (running)')
sudo systemctl status mongod
```

#### Step 5: Create Administrator & Database Credentials
1. Connect to MongoDB Shell:
   ```bash
   mongosh
   ```
2. Switch to `admin` database:
   ```javascript
   use admin
   ```
3. Create Admin User (Replace `StrongPassword123!` with a strong custom password):
   ```javascript
   db.createUser({
     user: "admin",
     pwd: "StrongPassword123!",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
   })
   ```
4. Exit shell:
   ```javascript
   exit
   ```

#### Step 6: Enable Authentication & Network Binding
1. Open MongoDB configuration file:
   ```bash
   sudo nano /etc/mongod.conf
   ```
2. Set network IP binding:
   - If Node.js backend is on the **same server**, keep `bindIp: 127.0.0.1`.
   - If Node.js backend is on a **different server**, set `bindIp: 0.0.0.0`.
   ```yaml
   net:
     port: 27017
     bindIp: 127.0.0.1
   ```
3. Enable user authentication:
   ```yaml
   security:
     authorization: enabled
   ```
4. Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).
5. Restart MongoDB service to enforce security settings:
   ```bash
   sudo systemctl restart mongod
   ```

#### Step 7: Configure Firewall (UFW)
If MongoDB runs on a dedicated database server, restrict incoming traffic on port `27017` to your application server IP only:
```bash
# Allow traffic on port 27017 from application server IP (e.g. 203.0.113.5)
sudo ufw allow from 203.0.113.5 to any port 27017 proto tcp

# Enable firewall
sudo ufw enable
```

#### Step 8: Verify Backend Connection
Update `backend/.env` with your newly deployed database credentials:
```env
MONGO_URI=mongodb://admin:StrongPassword123!@YOUR_SERVER_IP:27017/svacs?authSource=admin
```

---

### Method 2: Deploying MongoDB using Docker & Docker Compose

If your server uses Docker, deployment can be managed via `docker-compose.yml`:

1. Create `docker-compose.yml`:
   ```yaml
   version: '3.8'

   services:
     mongodb:
       image: mongo:latest
       container_name: mongodb_svacs
       restart: always
       ports:
         - "27017:27017"
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: StrongPassword123!
         MONGO_INITDB_DATABASE: svacs
       volumes:
         - mongo_data:/data/db

   volumes:
     mongo_data:
   ```

2. Start the container in detached mode:
   ```bash
   docker compose up -d
   ```

---

## 🔒 Security Best Practices Checklist

- [x] **Authentication Enabled**: Never leave MongoDB running without `authorization: enabled`.
- [x] **Database Isolation**: Keep application data inside dedicated database (`svacs`).
- [x] **Firewall Protection**: Expose port `27017` only to authorized application servers.
- [x] **Environment Variables**: Store database credentials securely in `.env` (never commit `.env` to Git).
