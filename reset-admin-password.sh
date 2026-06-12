#!/bin/bash

echo "🔐 Resetting Password for admin@lera.edu.vn"
echo "============================================="
echo ""

echo "Step 1: Current user info..."
psql -h localhost -U lera -d lera << 'EOF'
SELECT 
  u.id,
  u.email,
  u.fullname,
  r.name as role,
  u.status,
  u.email_verified
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.edu.vn';
EOF

echo ""
echo "Step 2: Updating password to 'admin123'..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- Update the existing admin user's password
UPDATE users 
SET 
  password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  status = 'ACTIVE',
  email_verified = true,
  updated_at = NOW()
WHERE email = 'admin@lera.edu.vn';

-- Verify the update
SELECT 
  u.email,
  u.fullname,
  r.name as role,
  u.status,
  u.email_verified,
  LENGTH(u.password_hash) as pwd_length
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.edu.vn';
EOF

echo ""
echo "Step 3: Testing login..."
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.edu.vn","password":"admin123"}')

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE")

echo "HTTP Status: $http_code"
echo ""
if [ "$http_code" = "200" ]; then
  echo "✅✅✅ SUCCESS! ✅✅✅"
  echo ""
  echo "Login Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
  echo "============================================="
  echo "🎉 You can now login!"
  echo ""
  echo "📋 Credentials:"
  echo "   Email: admin@lera.edu.vn"
  echo "   Password: admin123"
  echo ""
  echo "🌐 Login URL: http://localhost:3000/auth/login"
  echo ""
  echo "🔄 Refresh your browser and try again!"
  echo "============================================="
else
  echo "❌ Login failed with HTTP $http_code"
  echo ""
  echo "Response:"
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
  echo "Checking identity service logs..."
  tail -50 /tmp/identity_service.log | grep -i "login\|error\|exception" | tail -20
fi
