#!/bin/bash
# Complete Service Startup Script for LERA Group
# Run this script to start all services from scratch

set -e

echo "=============================================="
echo "   LERA GROUP - Complete System Startup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

WORKSPACE="/Users/rahulsharma/LERA_Group"

# Step 1: Kill any existing services
echo "🔄 Step 1: Stopping existing services..."
pkill -f "spring-boot" 2>/dev/null || true
pkill -f "java.*jar" 2>/dev/null || true
sleep 2

# Step 2: Start PostgreSQL
echo "🗄️  Step 2: Starting PostgreSQL..."
cd "$WORKSPACE/database"
docker-compose down 2>/dev/null || true
docker-compose up -d
sleep 5

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec lera_postgres pg_isready -U lera -d lera >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    sleep 1
done

# Step 3: Build and start Identity Service (8080)
echo ""
echo "🔐 Step 3: Starting Identity Service (port 8080)..."
cd "$WORKSPACE/backend/identity_service"
mvn clean install -DskipTests -q 2>&1 | tail -5
mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/identity.log 2>&1 &
echo "   Identity Service starting in background..."
sleep 15

# Verify Identity Service
if curl -s http://localhost:8080/actuator/health | grep -q "UP"; then
    echo -e "${GREEN}   ✅ Identity Service is UP${NC}"
else
    echo -e "${YELLOW}   ⏳ Identity Service still starting...${NC}"
fi

# Step 4: Build and start Academy Service (8081)
echo ""
echo "🎓 Step 4: Starting Academy Service (port 8081)..."
cd "$WORKSPACE/backend/academy_service"
mvn clean install -DskipTests -q 2>&1 | tail -5
mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/academy.log 2>&1 &
echo "   Academy Service starting in background..."
sleep 10

# Step 5: Build and start Payment Service (8082)
echo ""
echo "💰 Step 5: Starting Payment Service (port 8082)..."
cd "$WORKSPACE/backend/payment_service"
mvn clean install -DskipTests -q 2>&1 | tail -5
mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/payment.log 2>&1 &
echo "   Payment Service starting in background..."
sleep 10

# Step 6: Build and start Payroll Service (8083)
echo ""
echo "💵 Step 6: Starting Payroll Service (port 8083)..."
cd "$WORKSPACE/backend/payroll_service"
mvn clean install -DskipTests -q 2>&1 | tail -5
mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/payroll.log 2>&1 &
echo "   Payroll Service starting in background..."
sleep 10

# Step 7: Build and start Attendance Service (8084)
echo ""
echo "📅 Step 7: Starting Attendance Service (port 8084)..."
cd "$WORKSPACE/backend/attendance_service"
mvn clean install -DskipTests -q 2>&1 | tail -5
mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/attendance.log 2>&1 &
echo "   Attendance Service starting in background..."
sleep 10

# Step 8: Start Frontend (3000)
echo ""
echo "🖥️  Step 8: Starting Frontend (port 3000)..."
cd "$WORKSPACE/frontend"
npm install --silent 2>/dev/null
npm run dev > /tmp/frontend.log 2>&1 &
echo "   Frontend starting in background..."
sleep 5

# Final Status Check
echo ""
echo "=============================================="
echo "   CHECKING ALL SERVICES STATUS"
echo "=============================================="
sleep 10

check_service() {
    local port=$1
    local name=$2
    if curl -s "http://localhost:$port/actuator/health" 2>/dev/null | grep -q "UP"; then
        echo -e "${GREEN}✅ $name (port $port) - UP${NC}"
    elif lsof -i :$port | grep -q LISTEN 2>/dev/null; then
        echo -e "${YELLOW}⏳ $name (port $port) - Starting...${NC}"
    else
        echo -e "${RED}❌ $name (port $port) - Not running${NC}"
    fi
}

check_service 8080 "Identity Service"
check_service 8081 "Academy Service"
check_service 8082 "Payment Service"
check_service 8083 "Payroll Service"
check_service 8084 "Attendance Service"

# Check Frontend
if lsof -i :3000 | grep -q LISTEN 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend (port 3000) - UP${NC}"
else
    echo -e "${RED}❌ Frontend (port 3000) - Not running${NC}"
fi

echo ""
echo "=============================================="
echo "   STARTUP COMPLETE!"
echo "=============================================="
echo ""
echo "📱 Access the application at: http://localhost:3000"
echo ""
echo "🔑 Login credentials:"
echo "   Email: admin@lera.com"
echo "   Password: admin123"
echo ""
echo "📋 View logs:"
echo "   tail -f /tmp/identity.log"
echo "   tail -f /tmp/academy.log"
echo "   tail -f /tmp/payment.log"
echo "   tail -f /tmp/payroll.log"
echo "   tail -f /tmp/attendance.log"
echo "   tail -f /tmp/frontend.log"
echo ""
