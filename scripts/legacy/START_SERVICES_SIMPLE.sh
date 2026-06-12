#!/bin/bash
# ================================================================
# LERA GROUP - Simple Service Starter
# ================================================================

echo ""
echo "🚀 LERA GROUP - STARTING SERVICES (SIMPLE MODE)"
echo "=================================================="
echo ""

# Kill any existing processes
echo "🛑 Stopping any existing services..."
killall java 2>/dev/null
killall node 2>/dev/null
sleep 2

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
brew services start postgresql@15 2>/dev/null
sleep 3

# Start services in sequence
cd /Users/rahulsharma/LERA_Group

echo ""
echo "🖥️  Starting Backend Services..."
echo "================================"
echo ""

# Identity Service
echo "1️⃣  Identity Service (8080)..."
cd /Users/rahulsharma/LERA_Group/backend/identity_service
mvn spring-boot:run > /tmp/identity.log 2>&1 &
IDENTITY_PID=$!
sleep 8
echo "   PID: $IDENTITY_PID"

# Academy Service
echo "2️⃣  Academy Service (8081)..."
cd /Users/rahulsharma/LERA_Group/backend/academy_service
mvn spring-boot:run > /tmp/academy.log 2>&1 &
ACADEMY_PID=$!
sleep 8
echo "   PID: $ACADEMY_PID"

# Payment Service
echo "3️⃣  Payment Service (8082)..."
cd /Users/rahulsharma/LERA_Group/backend/payment_service
mvn spring-boot:run > /tmp/payment.log 2>&1 &
PAYMENT_PID=$!
sleep 8
echo "   PID: $PAYMENT_PID"

# Payroll Service
echo "4️⃣  Payroll Service (8083)..."
cd /Users/rahulsharma/LERA_Group/backend/payroll_service
mvn spring-boot:run > /tmp/payroll.log 2>&1 &
PAYROLL_PID=$!
sleep 8
echo "   PID: $PAYROLL_PID"

# Attendance Service
echo "5️⃣  Attendance Service (8084)..."
cd /Users/rahulsharma/LERA_Group/backend/attendance_service
mvn spring-boot:run > /tmp/attendance.log 2>&1 &
ATTENDANCE_PID=$!
sleep 8
echo "   PID: $ATTENDANCE_PID"

# Connect Service
echo "6️⃣  Connect Service (8085)..."
cd /Users/rahulsharma/LERA_Group/backend/connect_service
mvn spring-boot:run > /tmp/connect.log 2>&1 &
CONNECT_PID=$!
sleep 8
echo "   PID: $CONNECT_PID"

echo ""
echo "🌐 Starting Frontend (port 3000)..."
cd /Users/rahulsharma/LERA_Group/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5
echo "   PID: $FRONTEND_PID"

echo ""
echo "================================"
echo "✅ All services started!"
echo "================================"
echo ""
echo "📋 Service PIDs:"
echo "   Identity:   $IDENTITY_PID"
echo "   Academy:    $ACADEMY_PID"
echo "   Payment:    $PAYMENT_PID"
echo "   Payroll:    $PAYROLL_PID"
echo "   Attendance: $ATTENDANCE_PID"
echo "   Connect:    $CONNECT_PID"
echo "   Frontend:   $FRONTEND_PID"
echo ""
echo "🔗 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API Base: http://localhost:8080"
echo ""
echo "📝 View Logs:"
echo "   tail -f /tmp/identity.log"
echo "   tail -f /tmp/academy.log"
echo "   tail -f /tmp/frontend.log"
echo ""
echo "⏳ Give services 30-60 seconds to fully start..."
echo ""
