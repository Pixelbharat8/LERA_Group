#!/bin/bash

echo "=== LERA GROUP COMPLETE SYSTEM CHECK ==="
echo ""

echo "1️⃣ PostgreSQL Status:"
pg_isready -h localhost -p 5432 2>&1 || echo "PostgreSQL NOT running"
echo ""

echo "2️⃣ Running Java Processes:"
ps aux | grep -E "spring-boot|java.*lera" | grep -v grep || echo "No Java processes found"
echo ""

echo "3️⃣ Port Status:"
for port in 8080 8081 8082 8083 8084 8085 8086 8087; do
    result=$(lsof -i :$port 2>&1)
    if [ -n "$result" ]; then
        echo "   Port $port: IN USE"
    else
        echo "   Port $port: FREE"
    fi
done
echo ""

echo "4️⃣ Service Health Checks:"
for port in 8080 8081 8082 8083 8084 8085 8086 8087; do
    service_name=""
    case $port in
        8080) service_name="identity_service" ;;
        8081) service_name="academy_service" ;;
        8082) service_name="attendance_service" ;;
        8083) service_name="payment_service" ;;
        8084) service_name="payroll_service" ;;
        8085) service_name="connect_service" ;;
        8086) service_name="ai_gateway" ;;
        8087) service_name="rule_engine" ;;
    esac
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health 2>&1)
    if [ "$response" = "200" ]; then
        echo "   ✅ $service_name (port $port): UP"
    else
        echo "   ❌ $service_name (port $port): DOWN (HTTP $response)"
    fi
done
echo ""

echo "5️⃣ Log Files:"
for service in identity_service academy_service attendance_service payment_service payroll_service connect_service ai_gateway rule_engine; do
    if [ -f "/tmp/${service}.log" ]; then
        size=$(du -h "/tmp/${service}.log" | cut -f1)
        echo "   📄 ${service}.log - Size: $size"
    else
        echo "   ❌ ${service}.log - NOT FOUND"
    fi
done
echo ""

echo "6️⃣ Frontend Status:"
frontend_port=$(lsof -i :3001 2>&1 | grep -q LISTEN && echo "3001" || (lsof -i :3000 2>&1 | grep -q LISTEN && echo "3000" || echo "NOT RUNNING"))
if [ "$frontend_port" != "NOT RUNNING" ]; then
    echo "   ✅ Running on port $frontend_port"
else
    echo "   ❌ NOT running"
fi
echo ""

echo "7️⃣ Recent Errors in Logs:"
for service in identity_service academy_service attendance_service payment_service payroll_service connect_service ai_gateway rule_engine; do
    if [ -f "/tmp/${service}.log" ]; then
        errors=$(tail -100 "/tmp/${service}.log" 2>/dev/null | grep -i "error\|exception" | wc -l | tr -d ' ')
        if [ "$errors" -gt 0 ]; then
            echo "   ⚠️  $service: $errors error lines found"
        fi
    fi
done

echo ""
echo "=== END OF CHECK ==="
