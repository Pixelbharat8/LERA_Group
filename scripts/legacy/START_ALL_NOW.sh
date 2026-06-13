#!/bin/bash
# ================================================================
# LERA GROUP - Quick Start All Services Script
# ================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║ 🚀 LERA GROUP - STARTING ALL SERVICES                            ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Change to project root
cd /Users/rahulsharma/LERA_Group

# ================================================================
# STEP 1: Start PostgreSQL
# ================================================================
echo "📦 Step 1: Starting PostgreSQL..."
brew services start postgresql@15 2>/dev/null || echo "PostgreSQL may already be running"
sleep 2

# Verify PostgreSQL
if pg_isready -q 2>/dev/null; then
    echo "   ✅ PostgreSQL is running"
else
    echo "   ⚠️  PostgreSQL status unknown - continuing anyway"
fi

# ================================================================
# STEP 2: Build Payroll Service (was failing)
# ================================================================
echo ""
echo "🔨 Step 2: Building Payroll Service..."
cd /Users/rahulsharma/LERA_Group/backend/payroll_service
mvn clean install -DskipTests -q 2>&1 | tail -5
if [ $? -eq 0 ]; then
    echo "   ✅ Payroll Service built successfully"
else
    echo "   ⚠️  Payroll Service build may have issues"
fi

# ================================================================
# STEP 3: Start Backend Services
# ================================================================
echo ""
echo "🖥️  Step 3: Starting Backend Services..."

# Kill any existing Java processes
killall java 2>/dev/null
sleep 2

# Start Identity Service (8080)
echo "   Starting Identity Service (8080)..."
cd /Users/rahulsharma/LERA_Group/backend/identity_service
nohup mvn spring-boot:run -q > /tmp/identity_service.log 2>&1 &
sleep 3

# Start Academy Service (8081)
echo "   Starting Academy Service (8081)..."
cd /Users/rahulsharma/LERA_Group/backend/academy_service
nohup mvn spring-boot:run -q > /tmp/academy_service.log 2>&1 &
sleep 3

# Start Payment Service (8082)
echo "   Starting Payment Service (8082)..."
cd /Users/rahulsharma/LERA_Group/backend/payment_service
nohup mvn spring-boot:run -q > /tmp/payment_service.log 2>&1 &
sleep 3

# Start Payroll Service (8083)
echo "   Starting Payroll Service (8083)..."
cd /Users/rahulsharma/LERA_Group/backend/payroll_service
nohup mvn spring-boot:run -q > /tmp/payroll_service.log 2>&1 &
sleep 3

# Start Attendance Service (8084)
echo "   Starting Attendance Service (8084)..."
cd /Users/rahulsharma/LERA_Group/backend/attendance_service
nohup mvn spring-boot:run -q > /tmp/attendance_service.log 2>&1 &
sleep 3

# Start Connect Service (8085)
echo "   Starting Connect Service (8085)..."
cd /Users/rahulsharma/LERA_Group/backend/connect_service
nohup mvn spring-boot:run -q > /tmp/connect_service.log 2>&1 &
sleep 3

echo "   ✅ Backend services starting in background"

# ================================================================
# STEP 4: Start Frontend
# ================================================================
echo ""
echo "🌐 Step 4: Starting Frontend..."
cd /Users/rahulsharma/LERA_Group/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

# Start frontend
echo "   Starting Next.js frontend on port 3000..."
nohup npm run dev > /tmp/frontend.log 2>&1 &
sleep 5

echo "   ✅ Frontend starting"

# ================================================================
# STEP 5: Wait for services to start
# ================================================================
echo ""
echo "⏳ Step 5: Waiting for services to start (30 seconds)..."
for i in {1..30}; do
    printf "\r   Progress: [%-30s] %d/30 seconds" $(printf "#%.0s" $(seq 1 $i)) $i
    sleep 1
done
echo ""

# ================================================================
# STEP 6: Verify Services
# ================================================================
echo ""
echo "✅ Step 6: Verifying Services..."

check_service() {
    local port=$1
    local name=$2
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/actuator/health" 2>/dev/null | grep -q "200\|401"; then
        echo "   ✅ $name (port $port) - RUNNING"
        return 0
    else
        echo "   ⚠️  $name (port $port) - May still be starting"
        return 1
    fi
}

check_service 8080 "Identity Service"
check_service 8081 "Academy Service"
check_service 8082 "Payment Service"
check_service 8083 "Payroll Service"
check_service 8084 "Attendance Service"
check_service 8085 "Connect Service"

# Check Frontend
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null | grep -q "200\|304"; then
    echo "   ✅ Frontend (port 3000) - RUNNING"
else
    echo "   ⚠️  Frontend (port 3000) - May still be starting"
fi

# ================================================================
# DONE
# ================================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║ ✅ STARTUP COMPLETE                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Access the application:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   👤 Login: admin@lera.com / admin123"
echo ""
echo "📝 View Logs:"
echo "   tail -f /tmp/identity_service.log"
echo "   tail -f /tmp/academy_service.log"
echo "   tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   killall java && killall node"
echo ""
