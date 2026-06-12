#!/bin/bash

# =====================================================
# LERA GROUP - System Status Check Script
# =====================================================

echo "============================================"
echo "      LERA Group - System Status"
echo "============================================"
echo ""

# Function to check service
check_service() {
    local name=$1
    local port=$2
    local health_endpoint=$3
    
    if curl -s --max-time 2 "http://localhost:$port$health_endpoint" >/dev/null 2>&1; then
        echo "✅ $name (port $port): UP"
        return 0
    else
        echo "❌ $name (port $port): DOWN"
        return 1
    fi
}

echo "Backend Services:"
echo "-----------------"
check_service "Identity Service" 8081 "/actuator/health"
check_service "Academy Service" 8082 "/actuator/health"
check_service "Payment Service" 8083 "/actuator/health"
check_service "Payroll Service" 8084 "/actuator/health"
check_service "Attendance Service" 8085 "/actuator/health"
check_service "Connect Service" 8086 "/actuator/health"
check_service "AI Gateway" 8087 "/actuator/health"
check_service "Rule Engine" 8088 "/actuator/health"

echo ""
echo "Frontend:"
echo "---------"
check_service "Next.js Frontend" 3000 ""

echo ""
echo "Database:"
echo "---------"
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL (port 5432): UP"
else
    echo "❌ PostgreSQL (port 5432): DOWN"
fi

echo ""
echo "============================================"
echo "      Port Usage Summary"
echo "============================================"
for port in 3000 8081 8082 8083 8084 8085 8086 8087 8088; do
    pid=$(lsof -ti tcp:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        proc=$(ps -p "$pid" -o comm= 2>/dev/null)
        echo "Port $port: PID $pid ($proc)"
    else
        echo "Port $port: Free"
    fi
done
