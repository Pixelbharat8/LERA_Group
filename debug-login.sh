#!/bin/bash

echo "🔍 Checking LERA Academy Login Issues..."
echo "========================================="
echo ""

# Check if user exists
echo "1️⃣ Checking if admin user exists..."
psql -h localhost -U lera -d lera -c "
SELECT 
  u.email, 
  u.full_name, 
  r.name as role,
  u.is_active,
  LENGTH(u.password) as password_length
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
" 2>&1

echo ""
echo "2️⃣ Checking available roles..."
psql -h localhost -U lera -d lera -c "
SELECT id, name, description FROM roles;
" 2>&1

echo ""
echo "3️⃣ Testing Identity Service API..."
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}' 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo "Response: $body"

echo ""
echo "========================================="
