#!/bin/bash

# WanderLog Deployment Script for Ubuntu Server
# Run this script on your Ubuntu server as root

set -e

echo "🚀 Starting WanderLog deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install MongoDB
echo "🍃 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Install PM2 and Nginx
echo "⚙️ Installing PM2 and Nginx..."
npm install -g pm2
apt-get install -y nginx git

# Clone repository
echo "📥 Cloning WanderLog repository..."
cd /opt
if [ -d "WanderLog" ]; then
    rm -rf WanderLog
fi
git clone https://github.com/ShakyVertex/WanderLog.git
cd WanderLog

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install
mkdir -p uploads

# Create environment file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/wanderlog
PORT=5001
EOF

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend
npm install
npm run build

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/wanderlog << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /opt/WanderLog/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        root /opt/WanderLog/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/wanderlog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Start services
echo "🎯 Starting services..."
cd /opt/WanderLog/backend
pm2 start server.js --name "wanderlog-backend"
pm2 startup ubuntu -u root --hp /root
pm2 save

systemctl restart nginx

echo "✅ Deployment completed!"
echo "🌍 Your WanderLog application is now running!"
echo "📱 Access it at: http://$(curl -s ifconfig.me)"
echo ""
echo "📊 Service status:"
echo "- MongoDB: $(systemctl is-active mongod)"
echo "- Backend: $(pm2 jlist | jq -r '.[0].pm2_env.status // "stopped"')"
echo "- Nginx: $(systemctl is-active nginx)"