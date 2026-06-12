#!/bin/bash

echo "🧪 LERA Group Services Health Check"
echo "===================================="
echo ""

# Test Frontend
echo "📱 Testing Frontend (http://localhost:3000)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✅ Frontend is UP (HTTP $FRONTEND_STATUS)"
else
    echo "   ❌ Frontend is DOWN (HTTP $FRONTEND_STATUS)"
fi

# Test Gateway
echo ""
echo "🚪 Testing Gateway (http://localhost)..."
GATEWAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$GATEWAY_STATUS" = "200" ]; then
    echo "   ✅ Gateway is UP (HTTP $GATEWAY_STATUS)"
else
    echo "   ❌ Gateway is DOWN (HTTP $GATEWAY_STATUS)"
fi

# Test PgAdmin
echo ""
echo "🗄️  Testing PgAdmin (http://localhost:5050)..."
PGADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050)
if [ "$PGADMIN_STATUS" = "200" ] || [ "$PGADMIN_STATUS" = "302" ]; then
    echo "   ✅ PgAdmin is UP (HTTP $PGADMIN_STATUS)"
else
    echo "   ❌ PgAdmin is DOWN (HTTP $PGADMIN_STATUS)"
fi

# Test Database
echo ""
echo "🗄️  Testing PostgreSQL..."
docker compose exec -T postgres pg_isready -U lera > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ PostgreSQL is UP"
else
    echo "   ❌ PostgreSQL is DOWN"
fi

# Test Backend Services
echo ""
echo "🔧 Testing Backend Services..."
SERVICES=("identity_service:55018" "academy_service:55022" "attendance_service:55017" "connect_service:55016" "payment_service:55019" "payroll_service:55020" "rule_engine:55021" "ai_gateway:55023")

for service_port in "${SERVICES[@]}"; do
    service="${service_port%%:*}"
    port="${service_port##*:}"
    
    # Check if container is running
    if docker compose ps | grep -q "$service.*Up"; then
        echo "   ✅ $service is running"
    else
        echo "   ❌ $service is NOT running"
    fi
done

echo ""
echo "===================================="
echo "💡 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Gateway:  http://localhost"
echo "   PgAdmin:  http://localhost:5050"
echo ""
echo "💡 If browser shows loading:"
echo "   1. Clear browser cache (Cmd+Shift+R on Mac)"
echo "   2. Try incognito/private mode"
echo "   3. Try different browser"
echo "   4. Check browser console for errors (F12)"
echo ""
