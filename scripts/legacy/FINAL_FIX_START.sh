#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          🚀 LERA GROUP - FINAL FIX & STARTUP                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Stop everything first
echo "🛑 Stopping all existing services..."
killall java 2>/dev/null
killall node 2>/dev/null
sleep 3
echo "   ✅ Cleared"

# Start PostgreSQL
echo ""
echo "📦 Starting PostgreSQL..."
brew services start postgresql@15
sleep 3

# Verify PostgreSQL
if psql -h localhost -U lera -d lera -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
else
    echo "   ⚠️  PostgreSQL may not be ready, but continuing..."
fi

# Change to project directory
cd /Users/rahulsharma/LERA_Group

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  Instructions: Open 8 NEW Terminal Windows/Tabs                  ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Copy and paste each command into a SEPARATE terminal:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 1 - Identity Service (Port 8080):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 2 - Academy Service (Port 8081):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 3 - Payment Service (Port 8082):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/payment_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 4 - Payroll Service (Port 8083):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/payroll_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 5 - Attendance Service (Port 8084):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/attendance_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 6 - Connect Service (Port 8085):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/backend/connect_service && mvn spring-boot:run"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TERMINAL 7 - Frontend (Port 3000):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "cd /Users/rahulsharma/LERA_Group/frontend && npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ What to look for in each terminal:"
echo "   Backend services: 'Started Application in XX seconds'"
echo "   Frontend: 'ready started server on 0.0.0.0:3000'"
echo ""
echo "🌐 Once all services show 'Started', open browser:"
echo "   http://localhost:3000"
echo "   Login: admin@lera.com / admin123"
echo ""
echo "⏱️  Each service takes 15-30 seconds to start"
echo "    Total time: 2-3 minutes for all services"
echo ""
