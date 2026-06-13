#!/bin/bash

# LERA Group - Docker Build Monitor Script
# This script helps you monitor the Docker Compose build progress in real-time

echo "=========================================="
echo "🔍 LERA Group Build Monitor"
echo "=========================================="
echo ""

# Function to check if build is running
check_build_status() {
    if docker ps -a | grep -q "building"; then
        return 0
    else
        return 1
    fi
}

# Function to display build progress
show_progress() {
    echo "📊 Current Build Status:"
    echo "---"
    docker compose ps 2>/dev/null || echo "No containers running yet..."
    echo ""
    echo "🔨 Recent Build Activity:"
    echo "---"
    docker compose logs --tail=20 --no-color 2>/dev/null | grep -E "(FROM|WORKDIR|COPY|RUN|Building|built|Created|Started)" || echo "Building in progress..."
}

# Function to show disk space
show_disk_space() {
    echo ""
    echo "💾 Docker Disk Usage:"
    docker system df
}

# Main monitoring loop
echo "Starting live monitoring... (Press Ctrl+C to exit)"
echo ""

while true; do
    clear
    echo "=========================================="
    echo "🔍 LERA Group Build Monitor"
    echo "=========================================="
    echo "⏰ Last Updated: $(date '+%H:%M:%S')"
    echo ""
    
    # Show build progress
    show_progress
    
    # Show disk space every 5th iteration
    if [ $(($(date +%s) % 30)) -lt 5 ]; then
        show_disk_space
    fi
    
    echo ""
    echo "---"
    echo "💡 Tips:"
    echo "  • Build takes 5-10 minutes for first run"
    echo "  • Watch for 'Created' messages (services ready)"
    echo "  • Check logs: docker compose logs -f [service_name]"
    echo "---"
    
    # Wait 5 seconds before next update
    sleep 5
done
