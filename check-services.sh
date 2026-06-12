#!/bin/bash

# LERA Group - Check Service Status

echo "============================================"
echo "      LERA Group - Service Status"
echo "============================================"
echo ""

# Check PostgreSQL
echo "📊 PostgreSQL Database:"
if pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "   ✅ Running on localhost:5432"
else
    echo "   ❌ Not running"
fi
echo ""

# Check Backend Services
echo "📊 Backend Services:"
declare -A services
services=(
    ["Identity Service"]=8080
    ["Academy Service"]=8081
    ["Payment Service"]=8082
    ["Attendance Service"]=8083
    ["Payroll Service"]=8084
    ["AI Gateway"]=8085
    ["Connect Service"]=8086
    ["Rule Engine"]=8087
    ["Social Media Service"]=8089
)

for name in "Identity Service" "Academy Service" "Payment Service" "Attendance Service" "Payroll Service" "AI Gateway" "Connect Service" "Rule Engine" "Social Media Service"; do
    port=${services[$name]}
    
    if lsof -i:$port >/dev/null 2>&1; then
        # Try to hit health endpoint
        health=$(curl -s -m 2 http://localhost:$port/actuator/health 2>/dev/null)
        if echo "$health" | grep -q "UP"; then
            echo "   ✅ $name (port $port) - UP"
        elif curl -s -m 2 http://localhost:$port >/dev/null 2>&1; then
            echo "   🔄 $name (port $port) - Starting..."
        else
            echo "   ⚠️  $name (port $port) - Port in use"
        fi
    else
        echo "   ❌ $name (port $port) - Not running"
    fi
done
echo ""

# Check Frontend
echo "📊 Frontend:"
if lsof -i:3000 >/dev/null 2>&1; then
    if curl -s -m 2 http://localhost:3000 >/dev/null 2>&1; then
        echo "   ✅ Frontend (port 3000) - Running"
    else
        echo "   🔄 Frontend (port 3000) - Starting..."
    fi
else
    echo "   ❌ Frontend (port 3000) - Not running"
fi
echo ""

# Summary
echo "============================================"
echo "📋 Quick Commands:"
echo "   Start all:  ./start-all-services.sh"
echo "   Stop all:   ./stop-all-services.sh"
echo "============================================"
