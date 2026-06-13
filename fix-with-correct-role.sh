#!/bin/bash

echo "🔍 Checking roles in database..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- Show all roles
SELECT id, name, description FROM roles ORDER BY name;
EOF

echo ""
echo "🔧 Creating admin user with correct role..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- Delete existing admin@lera.com if exists
DELETE FROM users WHERE email = 'admin@lera.com';

-- Insert admin with SUPER_ADMIN role (note the underscore!)
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
WHERE r.name = 'SUPER_ADMIN';  -- Changed from 'superadmin' to 'SUPER_ADMIN'

-- Verify the insert
SELECT 
  u.id,
  u.email,
  u.fullname,
  r.name as role,
  u.status,
  LENGTH(u.password_hash) as pwd_length
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
EOF

echo ""
echo "🧪 Testing login API..."
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
  echo "✅ SUCCESS! Login works!"
  echo ""
  echo "📋 Login at: http://localhost:3000/auth/login"
  echo "   Email: admin@lera.com"
  echo "   Password: admin123"
else
  echo "❌ Still failing - checking what's wrong..."
  echo ""
  echo "Trying existing user:"
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lera.edu.vn","password":"admin123"}' | jq .
fi
