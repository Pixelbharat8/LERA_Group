#!/bin/bash

echo "🔍 Deep Debug - Why is login failing?"
echo "======================================"
echo ""

echo "1️⃣ Checking BCrypt configuration in Spring..."
echo ""

# Test if the identity service is even reaching the password check
curl -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.edu.vn","password":"admin123"}' 2>&1 | grep -E "HTTP|Content-Type|{"

echo ""
echo ""
echo "2️⃣ Let's try registering a NEW user to see if it works..."
echo ""

# Try registering a new user to see what hash it generates
response=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@lera.com",
    "password": "test123",
    "fullname": "Test User",
    "roleName": "STUDENT"
  }')

echo "Registration response:"
echo "$response" | jq . 2>/dev/null || echo "$response"

echo ""
echo "3️⃣ Now try logging in with the newly registered user..."
echo ""

login_response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@lera.com",
    "password": "test123"
  }')

echo "Login response:"
echo "$login_response" | jq . 2>/dev/null || echo "$login_response"

echo ""
echo "4️⃣ Checking what password hash was created..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
SELECT 
  email,
  fullname,
  LEFT(password_hash, 30) || '...' as password_hash,
  LENGTH(password_hash) as hash_length
FROM users 
WHERE email IN ('admin@lera.edu.vn', 'testuser@lera.com')
ORDER BY created_at DESC;
EOF

echo ""
echo "======================================"
