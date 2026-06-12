#!/bin/bash

echo "🔍 Backend Services Health Check"
echo "=================================="
echo ""

services=(
  "identity_service:8080"
  "academy_service:8081"
  "attendance_service:8082"
  "payment_service:8083"
  "payroll_service:8084"
  "connect_service:8085"
  "ai_gateway:8086"
  "rule_engine:8087"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    echo "✅ $name (port $port): UP"
  else
    echo "❌ $name (port $port): DOWN (HTTP $response)"
  fi
done

echo ""
echo "=================================="
echo ""
echo "🔐 Testing Login API..."
login_response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}')

if echo "$login_response" | grep -q '"success":true'; then
  echo "✅ Login API: Working"
  echo ""
  echo "Response preview:"
  echo "$login_response" | jq -r '{success, message, roleName: .user.roleName}' 2>/dev/null
else
  echo "❌ Login API: Failed"
  echo "$login_response" | jq . 2>/dev/null || echo "$login_response"
fi

echo ""
echo "=================================="
echo ""
echo "🌐 Frontend Status:"
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ Frontend: Running on http://localhost:3000"
else
  echo "❌ Frontend: Not responding"
fi

echo ""
echo "=================================="
echo "📋 Login Instructions:"
echo "   1. Go to: http://localhost:3000/auth/login"
echo "   2. Email: admin@lera.com"
echo "   3. Password: admin123"
echo "   4. You'll be redirected to: /dashboard/superadmin"
echo "=================================="
