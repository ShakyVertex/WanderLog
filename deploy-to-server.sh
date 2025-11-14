#!/bin/bash

# WanderLog Auto Deploy Script
# This script will push local changes and update the remote server

set -e

# Server configuration
# This is a huge security risk. These should never be deployed to github

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    error "sshpass is not installed. Please install it first:"
    echo "  macOS: brew install sshpass"
    echo "  Ubuntu: sudo apt-get install sshpass"
    echo "  CentOS: sudo yum install sshpass"
    exit 1
fi

log "🚀 Starting WanderLog deployment process..."

# Step 1: Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    warning "You have uncommitted changes. Do you want to commit them? (y/n)"
    read -p "> " commit_changes
    
    if [ "$commit_changes" = "y" ] || [ "$commit_changes" = "Y" ]; then
        log "📝 Committing changes..."
        git add .
        echo "Enter commit message (or press Enter for default):"
        read -p "> " commit_msg
        
        if [ -z "$commit_msg" ]; then
            commit_msg="Auto commit before deployment $(date)"
        fi
        
        git commit -m "$commit_msg

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        success "Changes committed"
    else
        warning "Deploying with uncommitted changes..."
    fi
fi

# Step 2: Push to GitHub
log "📤 Pushing to GitHub..."
if git push origin main; then
    success "Successfully pushed to GitHub"
else
    error "Failed to push to GitHub"
    exit 1
fi

# Step 3: Connect to server and update
log "🔗 Connecting to server $SERVER_IP..."

# Create the remote command
REMOTE_CMD="
set -e
echo '🔄 Starting server update...'
cd $PROJECT_DIR || exit 1

# Configure backend .env file first
echo '🔧 Configuring backend environment...'
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb://127.0.0.1:27017/wanderlog
PORT=5001
EOF
echo '✅ Backend .env configured'
cd ..

# Run the update script
if [ -f 'update.sh' ]; then
    chmod +x update.sh
    ./update.sh
else
    echo '❌ update.sh not found, running manual update...'
    git pull origin main
    cd backend && npm install --production
    cd ../frontend && npm install && npm run build
    pm2 restart wanderlog-backend
    systemctl reload nginx
fi

echo '✅ Server update completed!'
"

# Execute commands on remote server
if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$REMOTE_CMD"; then
    success "Server updated successfully!"
else
    error "Server update failed!"
    exit 1
fi

# Step 4: Test the deployment
log "🧪 Testing deployment..."
sleep 5

# Test if the website is accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    success "Deployment successful! 🎉"
    echo
    echo "🌍 Your application is live at: http://$SERVER_IP"
    echo "📊 You can monitor logs with:"
    echo "   ssh root@$SERVER_IP 'pm2 logs wanderlog-backend'"
else
    warning "Website returned HTTP $HTTP_CODE. Please check manually."
fi

echo
echo "💡 Useful commands:"
echo "  - Check server status: ssh root@$SERVER_IP 'systemctl status nginx mongod'"
echo "  - View logs: ssh root@$SERVER_IP 'pm2 logs wanderlog-backend'"
echo "  - Manual update: ssh root@$SERVER_IP 'cd $PROJECT_DIR && ./update.sh'"

log "🎯 Deployment process completed!"