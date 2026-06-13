#!/bin/bash

# ===========================================
# LERA Academy - Easy Start Script
# ===========================================
# Run this from ANY directory with:
#   bash /Users/rahulsharma/LERA_Group/EASY_START.sh
# ===========================================

PROJECT_DIR="/Users/rahulsharma/LERA_Group"

echo "============================================"
echo "   LERA Academy - Starting All Services"
echo "============================================"
echo ""

# Step 1: Start Database
echo "📦 Step 1: Starting PostgreSQL Database..."
cd "$PROJECT_DIR/database" && docker-compose up -d
if [ $? -eq 0 ]; then
    echo "✅ Database started successfully!"
else
    echo "⚠️  Database may already be running or Docker is not started"
fi
echo ""

# Wait for database
echo "⏳ Waiting 5 seconds for database to be ready..."
sleep 5

# Step 2: Start Backend Services
echo "🚀 Step 2: Starting Backend Services..."
echo ""
echo "Opening new terminal windows for each service..."
echo ""

# Identity Service (Port 8080)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/identity_service && echo '🔐 Starting Identity Service on port 8080...' && mvn spring-boot:run\""

sleep 3

# Academy Service (Port 8081)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/academy_service && echo '📚 Starting Academy Service on port 8081...' && mvn spring-boot:run\""

sleep 3

# Payment Service (Port 8082)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/payment_service && echo '💳 Starting Payment Service on port 8082...' && mvn spring-boot:run\""

sleep 3

# Payroll Service (Port 8083)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/payroll_service && echo '💰 Starting Payroll Service on port 8083...' && mvn spring-boot:run\""

sleep 3

# Attendance Service (Port 8084)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/attendance_service && echo '📋 Starting Attendance Service on port 8084...' && mvn spring-boot:run\""

sleep 3

# Connect Service (Port 8085)
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/backend/connect_service && echo '🔗 Starting Connect Service on port 8085...' && mvn spring-boot:run\""

sleep 3

# Step 3: Start Frontend
echo "🌐 Step 3: Starting Frontend..."
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/frontend && echo '🌐 Starting Frontend on port 3000...' && npm run dev\""

echo ""
echo "============================================"
echo "   All services are starting!"
echo "============================================"
echo ""
echo "Services will be available at:"
echo "  • Frontend:    http://localhost:3000"
echo "  • Identity:    http://localhost:8080"
echo "  • Academy:     http://localhost:8081"
echo "  • Payment:     http://localhost:8082"
echo "  • Payroll:     http://localhost:8083"
echo "  • Attendance:  http://localhost:8084"
echo "  • Connect:     http://localhost:8085"
echo ""
echo "Login credentials:"
echo "  • Email:    admin@lera.com"
echo "  • Password: admin123"
echo ""
echo "⏳ Please wait 1-2 minutes for all services to fully start."
echo "============================================"
