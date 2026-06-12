#!/bin/bash

echo "🎯 Final Fix - Register Admin Through API"
echo "=========================================="
echo ""

echo "Step 1: Delete old admin user..."
psql -h localhost -U lera -d lera -c "DELETE FROM users WHERE email = 'admin@lera.com';"

echo ""
echo "Step 2: Get SUPER_ADMIN role ID..."
role_id=$(psql -h localhost -U lera -d lera -t -c "SELECT id FROM roles WHERE name = 'SUPER_ADMIN';")
echo "Role ID: $role_id"

echo ""
echo "Step 3: Register admin through Spring Boot API (this will create proper BCrypt hash)..."
echo ""

register_response=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lera.com",
    "password": "admin123",
    "fullname": "Super Administrator",
    "roleName": "SUPER_ADMIN",
    "centerId": null
  }')

echo "Registration Response:"
echo "$register_response" | jq . 2>/dev/null || echo "$register_response"

echo ""
echo "Step 4: Now try logging in..."
echo ""

login_response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lera.com",
    "password": "admin123"
  }')

echo "Login Response:"
echo "$login_response" | jq . 2>/dev/null || echo "$login_response"

# Check if login was successful
if echo "$login_response" | grep -q '"success":true'; then
  echo ""
  echo "=========================================="
  echo "✅✅✅ SUCCESS! ✅✅✅"
  echo ""
  echo "🎉 Admin account created and working!"
  echo ""
  echo "📋 Login Credentials:"
  echo "   Email: admin@lera.com"
  echo "   Password: admin123"
  echo ""
  echo "🌐 Login URL: http://localhost:3000/auth/login"
  echo ""
  echo "🚀 Go to your browser and login now!"
  echo "=========================================="
else
  echo ""
  echo "❌ Login still failed. Check response above."
fi
