#!/bin/bash

echo ""
echo "🔍 Checking LERA Services Status..."
echo "═══════════════════════════════════════"
echo ""

check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo "✅ $name (port $port) - RUNNING"
        
        # Try to curl health endpoint
        if curl -s http://localhost:$port/actuator/health > /dev/null 2>&1; then
            echo "   └─ Health check: PASS"
        elif curl -s http://localhost:$port > /dev/null 2>&1; then
            echo "   └─ HTTP response: PASS"
        else
            echo "   └─ Port open but not responding yet..."
        fi
    else
        echo "❌ $name (port $port) - NOT RUNNING"
    fi
    echo ""
}

# Check PostgreSQL
echo "📦 Database:"
if pg_isready -h localhost > /dev/null 2>&1; then
    echo "✅ PostgreSQL - RUNNING"
else
    echo "❌ PostgreSQL - NOT RUNNING"
    echo "   Run: brew services start postgresql@15"
fi
echo ""

echo "🖥️  Backend Services:"
check_port 8080 "Identity Service"
check_port 8081 "Academy Service"
check_port 8082 "Payment Service"
check_port 8083 "Payroll Service"
check_port 8084 "Attendance Service"
check_port 8085 "Connect Service"

echo "🌐 Frontend:"
check_port 3000 "Next.js Frontend"

echo "═══════════════════════════════════════"
echo ""

# Count running Java processes
JAVA_COUNT=$(ps aux | grep java | grep -v grep | wc -l | tr -d ' ')
NODE_COUNT=$(ps aux | grep node | grep -v grep | wc -l | tr -d ' ')

echo "📊 Process Summary:"
echo "   Java processes: $JAVA_COUNT (expect 6)"
echo "   Node processes: $NODE_COUNT (expect 1+)"
echo ""

if [ "$JAVA_COUNT" -eq 6 ] && [ "$NODE_COUNT" -ge 1 ]; then
    echo "✅ ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "🌐 Open: http://localhost:3000"
    echo "👤 Login: admin@lera.com / admin123"
else
    echo "⚠️  Some services are not running"
    echo ""
    echo "📝 To start services manually, see:"
    echo "   /Users/rahulsharma/LERA_Group/MANUAL_STARTUP_GUIDE.md"
fi
echo ""
