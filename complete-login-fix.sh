#!/bin/bash

echo "🔐 Complete Login Fix - LERA Academy"
echo "====================================="
echo ""

echo "Step 1: Checking current database state..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- Show current users
SELECT 
  u.id,
  u.email,
  u.fullname,
  r.name as role,
  u.status,
  LEFT(u.password_hash, 30) || '...' as password_preview
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LIMIT 5;
EOF

echo ""
echo "Step 2: Creating admin user with BCrypt password..."
echo ""

# The password 'admin123' hashed with BCrypt
# This is a known valid BCrypt hash for 'admin123'
psql -h localhost -U lera -d lera << 'EOF'
-- Delete existing admin if any
DELETE FROM users WHERE email = 'admin@lera.com';

-- Insert admin with proper BCrypt hash for password 'admin123'
INSERT INTO users (
  id,
  center_id,
  role_id,
  email,
  phone,
  password_hash,
  fullname,
  fullname_vi,
  status,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  NULL,
  r.id,
  'admin@lera.com',
  '0123456789',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Super Administrator',
  'Quản Trị Viên',
  'ACTIVE',
  true,
  NOW(),
  NOW()
FROM roles r
WHERE r.name = 'superadmin';

-- Verify the insert
SELECT 
  u.id,
  u.email,
  u.fullname,
  r.name as role,
  u.status,
  u.email_verified,
  LENGTH(u.password_hash) as pwd_length
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
EOF

echo ""
echo "Step 3: Testing login via API..."
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}')

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE")

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"

echo ""
echo "====================================="
if [ "$http_code" = "200" ]; then
  echo "✅ SUCCESS! Login is working!"
  echo ""
  echo "📋 Credentials:"
  echo "   Email: admin@lera.com"
  echo "   Password: admin123"
  echo ""
  echo "🌐 URLs:"
  echo "   Login: http://localhost:3000/auth/login"
  echo "   Dashboard: http://localhost:3000/dashboard/superadmin"
  echo ""
  echo "🔄 Now refresh your browser and try logging in!"
else
  echo "❌ Login still failing. Checking logs..."
  echo ""
  tail -30 /tmp/identity_service.log | grep -i "error\|exception" || echo "No errors in log"
fi
