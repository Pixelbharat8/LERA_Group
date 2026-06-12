#!/bin/bash
# LERA Service Health Check Script

echo "🔍 LERA Service Health Check"
echo "=============================="
echo ""

# Check PostgreSQL
echo "📊 PostgreSQL Status:"
if pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "   ✅ PostgreSQL is running on port 5432"
else
    echo "   ❌ PostgreSQL is NOT running"
    echo "   💡 Run: brew services start postgresql@15"
fi
echo ""

# Check each service
check_service() {
    local name=$1
    local port=$2
    local endpoint=$3
    
    if curl -s --connect-timeout 2 "http://localhost:${port}${endpoint}" > /dev/null 2>&1; then
        echo "   ✅ $name is running on port $port"
    else
        echo "   ❌ $name is NOT running on port $port"
    fi
}

echo "🔧 Backend Services Status:"
check_service "Identity Service" "8080" "/api/auth/health"
check_service "Academy Service" "8081" "/api/courses"
check_service "Payment Service" "8082" "/api/payments"
check_service "Payroll Service" "8083" "/api/payroll"
check_service "Attendance Service" "8084" "/api/attendance"
check_service "Connect Service" "8085" "/api/leads"
check_service "AI Gateway" "8086" "/actuator/health"
check_service "Rule Engine" "8087" "/actuator/health"
echo ""

echo "🌐 Frontend Status:"
if curl -s --connect-timeout 2 "http://localhost:3000" > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is NOT running on port 3000"
fi
echo ""

# Check Java processes
echo "☕ Java Processes:"
ps aux | grep '[j]ava' | wc -l | xargs -I {} echo "   Running {} Java process(es)"
echo ""

echo "=============================="
echo "Done!"
