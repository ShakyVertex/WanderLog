#!/bin/bash

# WanderLog Update Script (Enhanced Version)
# Run this script on your server to update to the latest version

set -e

PROJECT_DIR="/opt/WanderLog"
BACKUP_DIR="/opt/backups/wanderlog-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/wanderlog-update.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Starting WanderLog update process..."

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
    log "❌ Error: This script must be run as root"
    echo "Please run: sudo $0"
    exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log "❌ Error: Project directory $PROJECT_DIR not found!"
    echo "Please run the deployment script first."
    exit 1
fi

# Skip backup creation - direct replacement mode
log "⚡ Running in direct replacement mode (no backup)"
BACKUP_DIR="none"

# Change to project directory
cd "$PROJECT_DIR"

# Check current git status
log "📊 Current git status:"
git status --porcelain
git log --oneline -3

# Check for uncommitted changes and handle them
if [ -n "$(git status --porcelain)" ]; then
    log "💾 Found local changes, stashing them..."
    git stash push -m "Auto-stash before update $(date)" || {
        log "⚠️ Warning: Failed to stash changes, attempting reset"
        git reset --hard HEAD
    }
fi

# Clean up potential conflict files
log "🧹 Cleaning up potential conflicts..."
CONFLICT_FILES=("update.sh" "deploy.sh" "auto-update.sh")
for file in "${CONFLICT_FILES[@]}"; do
    if [ -f "$file" ] && ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        log "🔧 Moving untracked file: $file -> $file.local"
        mv "$file" "$file.local" 2>/dev/null || rm -f "$file"
    fi
done

# Fetch and check for updates
log "🔍 Checking for updates..."
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log "✅ Already up to date (commit: ${LOCAL:0:7})"
    log "🎯 Skipping update process"
    exit 0
fi

# Pull latest changes with error handling
log "📥 Pulling latest changes from ${LOCAL:0:7} to ${REMOTE:0:7}..."
if git pull origin main; then
    log "✅ Successfully pulled latest changes"
else
    log "❌ Error: Failed to pull changes"
    log "🔄 Attempting to resolve conflicts..."
    
    # Try to resolve by resetting to remote
    git reset --hard origin/main
    log "⚠️ Reset to remote state, local changes may be lost"
fi

# Show what changed
log "📋 Changes pulled:"
git log --oneline -5

# Function to handle service updates with rollback
update_service() {
    local service_name="$1"
    local update_command="$2"
    
    log "🔧 Updating $service_name..."
    if eval "$update_command"; then
        log "✅ $service_name updated successfully"
        return 0
    else
        log "❌ Error: Failed to update $service_name"
        return 1
    fi
}

# Function to handle failure (no rollback available)
handle_failure() {
    log "❌ Update failed - no rollback available in direct mode"
    log "💡 Manual recovery may be needed"
    log "🔧 Try running the deployment script again if needed"
    exit 1
}

# Function to restart services
restart_services() {
    log "🔄 Restarting services..."
    
    # Restart backend
    if pm2 restart wanderlog-backend 2>/dev/null; then
        log "✅ Backend restarted"
    else
        log "❌ Failed to restart backend"
        return 1
    fi
    
    # Reload nginx
    if nginx -t >/dev/null 2>&1 && systemctl reload nginx; then
        log "✅ Nginx reloaded"
    else
        log "❌ Failed to reload nginx"
        return 1
    fi
    
    return 0
}

# Set trap for error handling
trap 'log "❌ Update failed at line $LINENO"; handle_failure' ERR

# Update backend dependencies
if ! update_service "backend dependencies" "cd '$PROJECT_DIR/backend' && npm install --production"; then
    handle_failure
fi

# Update frontend and rebuild
if ! update_service "frontend" "cd '$PROJECT_DIR/frontend' && npm install && npm run build"; then
    handle_failure
fi

# Restart services
if ! restart_services; then
    handle_failure
fi

# Wait for services to stabilize
log "⏳ Waiting for services to stabilize..."
sleep 5

# Check service status
log "📊 Checking service status..."
log "Backend status: $(pm2 jlist 2>/dev/null | jq -r '.[0].pm2_env.status // "unknown"' 2>/dev/null || echo "unknown")"
log "Nginx status: $(systemctl is-active nginx 2>/dev/null || echo "unknown")"
log "MongoDB status: $(systemctl is-active mongod 2>/dev/null || echo "unknown")"

# Test the application with retry logic
log "🧪 Testing application..."
HEALTH_CHECK="000"
for i in {1..3}; do
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/posts 2>/dev/null || echo "000")
    if [ "$HEALTH_CHECK" = "200" ]; then
        break
    fi
    log "⏳ Health check attempt $i failed, retrying in 3 seconds..."
    sleep 3
done

if [ "$HEALTH_CHECK" = "200" ]; then
    log "✅ Health check passed! Application is running correctly."
else
    log "⚠️ Health check failed (HTTP $HEALTH_CHECK). Check logs:"
    log "Backend logs:"
    pm2 logs wanderlog-backend --lines 10 2>/dev/null || log "Failed to get backend logs"
    log "Nginx error logs:"
    tail -10 /var/log/nginx/error.log 2>/dev/null || log "Failed to get nginx logs"
    
    log "❌ Health check failed - update may not be working correctly"
    handle_failure
fi

# Get public IP
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 ipinfo.io/ip 2>/dev/null || echo "your-server-ip")

log "✅ Update completed successfully!"
log "🌍 Your application is available at: http://$PUBLIC_IP"
log "📄 Update log: $LOG_FILE"
echo ""
echo "💡 Useful commands:"
echo "  - View backend logs: pm2 logs wanderlog-backend"
echo "  - Restart backend: pm2 restart wanderlog-backend"  
echo "  - Check nginx: systemctl status nginx"
echo "  - View update log: tail -f $LOG_FILE"
echo "  - Redeploy if needed: ./deploy.sh"