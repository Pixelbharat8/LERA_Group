#!/bin/bash

echo "🔍 Deep Dive Login Debugging"
echo "=============================="
echo ""

echo "1️⃣ Testing Identity Service directly..."
echo ""
response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}')

echo "Response from backend:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""

echo "2️⃣ Checking user in database..."
psql -h localhost -U lera -d lera << 'EOF'
SELECT 
  u.id,
  u.email, 
  u.full_name, 
  r.name as role,
  u.is_active,
  LEFT(u.password, 20) || '...' as password_preview,
  LENGTH(u.password) as pwd_length
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
EOF

echo ""
echo "3️⃣ Checking Identity Service logs..."
tail -50 /tmp/identity_service.log | grep -i "login\|auth\|error" | tail -20

echo ""
echo "=============================="
