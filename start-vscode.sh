#!/bin/bash
# LERA Group VS Code Startup Script
# This ensures optimal memory settings for VS Code

echo "🚀 Starting VS Code with optimized memory settings..."

# Set Node.js memory limit to 8GB
export NODE_OPTIONS="--max-old-space-size=8192"

# Verify the setting
echo "✅ NODE_OPTIONS set to: $NODE_OPTIONS"

# Open VS Code in current directory
code .

echo "✅ VS Code launched with optimized settings!"
echo ""
echo "📝 Tips to avoid crashes:"
echo "   1. Don't open large SQL files while AI is running"
echo "   2. Stop services you're not actively testing"
echo "   3. Use 'Refresh' buttons instead of reloading pages"
