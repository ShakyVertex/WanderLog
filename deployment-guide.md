# WanderLog Deployment Guide

## Server Setup for Ubuntu

### 1. Connect to your server
```bash
ssh root@8.221.125.31
```

### 2. Update system packages
```bash
apt update && apt upgrade -y
```

### 3. Install Node.js (using NodeSource repository)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### 4. Install MongoDB
```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
apt-get update

# Install MongoDB
apt-get install -y mongodb-org

# Start MongoDB service
systemctl start mongod
systemctl enable mongod
```

### 5. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 6. Install Git (if not already installed)
```bash
apt-get install -y git
```

## Application Deployment

### 1. Clone the repository
```bash
cd /opt
git clone https://github.com/ShakyVertex/WanderLog.git
cd WanderLog
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create environment file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/wanderlog
PORT=5001
EOF

# Create uploads directory
mkdir -p uploads
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install

# Build production version
npm run build
```

### 4. Install Nginx (for serving frontend)
```bash
apt-get install -y nginx
```

### 5. Configure Nginx
```bash
cat > /etc/nginx/sites-available/wanderlog << EOF
server {
    listen 80;
    server_name 8.221.125.31;

    # Serve frontend
    location / {
        root /opt/WanderLog/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Serve uploaded images
    location /uploads/ {
        root /opt/WanderLog/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/wanderlog /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

### 6. Start Backend with PM2
```bash
cd /opt/WanderLog/backend
pm2 start server.js --name "wanderlog-backend"
pm2 startup
pm2 save
```

### 7. Configure Firewall (optional)
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Verification

### Check services are running:
```bash
# Check MongoDB
systemctl status mongod

# Check PM2 processes
pm2 status

# Check Nginx
systemctl status nginx

# Check application logs
pm2 logs wanderlog-backend
```

### Test the application:
- Open browser and go to `http://8.221.125.31`
- Try creating a post to test functionality

## Update Deployment

### To update the application:
```bash
cd /opt/WanderLog
git pull origin main

# Update backend
cd backend
npm install
pm2 restart wanderlog-backend

# Update frontend
cd ../frontend
npm install
npm run build
systemctl reload nginx
```

## Troubleshooting

### Common issues:
1. **MongoDB not starting**: Check logs with `journalctl -u mongod`
2. **Backend not accessible**: Check PM2 logs with `pm2 logs`
3. **Frontend not loading**: Check Nginx logs with `journalctl -u nginx`
4. **Port conflicts**: Use `netstat -tulpn` to check port usage

### Useful commands:
```bash
# Restart all services
systemctl restart mongod
pm2 restart all
systemctl restart nginx

# Check logs
journalctl -u mongod -f
pm2 logs wanderlog-backend --lines 50
tail -f /var/log/nginx/error.log
```