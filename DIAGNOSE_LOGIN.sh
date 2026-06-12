#!/bin/bash

echo ""
echo "🔍 LERA LOGIN TROUBLESHOOTING"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Check if Identity Service is running
echo "1️⃣  Checking Identity Service (port 8080)..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "   ✅ Port 8080 is in use (service running)"
    
    # Try to reach the health endpoint
    echo ""
    echo "2️⃣  Testing Identity Service health..."
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null)
    if [ "$HEALTH" = "200" ]; then
        echo "   ✅ Identity Service is healthy (200 OK)"
    else
        echo "   ⚠️  Identity Service returned: $HEALTH"
    fi
    
    # Try to reach the auth endpoint
    echo ""
    echo "3️⃣  Testing login endpoint..."
    LOGIN_TEST=$(curl -s -X POST http://localhost:8080/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@lera.com","password":"admin123"}' 2>&1)
    
    if echo "$LOGIN_TEST" | grep -q "token"; then
        echo "   ✅ Login endpoint works! Token received."
        echo "   Response preview:"
        echo "$LOGIN_TEST" | head -5
    else
        echo "   ❌ Login failed. Response:"
        echo "$LOGIN_TEST"
    fi
    
else
    echo "   ❌ Port 8080 is NOT in use"
    echo ""
    echo "   🔧 FIX: Start Identity Service"
    echo "   Run in a terminal:"
    echo "   cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run"
    echo ""
    exit 1
fi

echo ""
echo "4️⃣  Checking PostgreSQL..."
if pg_isready -h localhost > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is running"
    
    # Check if admin user exists in database
    echo ""
    echo "5️⃣  Checking admin user in database..."
    USER_CHECK=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera \
        -t -c "SELECT email FROM users WHERE email = 'admin@lera.com';" 2>&1)
    
    if echo "$USER_CHECK" | grep -q "admin@lera.com"; then
        echo "   ✅ Admin user EXISTS in database"
    else
        echo "   ❌ Admin user NOT FOUND in database"
        echo "   This means Identity Service DataLoader hasn't run yet"
        echo ""
        echo "   🔧 FIX: Restart Identity Service to trigger DataLoader"
    fi
else
    echo "   ❌ PostgreSQL is NOT running"
    echo ""
    echo "   🔧 FIX: Start PostgreSQL"
    echo "   brew services start postgresql@15"
fi

echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "📊 DIAGNOSIS SUMMARY:"
echo ""

# Final verdict
if lsof -i :8080 > /dev/null 2>&1; then
    if curl -s -X POST http://localhost:8080/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@lera.com","password":"admin123"}' 2>&1 | grep -q "token"; then
        echo "✅ Everything is working! Login should succeed."
        echo "   If browser still shows error, try:"
        echo "   1. Hard refresh: Cmd+Shift+R"
        echo "   2. Clear browser cache"
        echo "   3. Open incognito window"
    else
        echo "⚠️  Identity Service is running but login fails"
        echo ""
        echo "Possible causes:"
        echo "  1. DataLoader hasn't run (restart Identity Service)"
        echo "  2. Database connection issue"
        echo "  3. Password encoding mismatch"
        echo ""
        echo "🔧 Try restarting Identity Service:"
        echo "   1. Press Ctrl+C in Identity Service terminal"
        echo "   2. Run: cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run"
    fi
else
    echo "❌ Identity Service is NOT running"
    echo ""
    echo "🔧 START IT NOW:"
    echo "   cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run"
fi

echo ""
