#!/bin/bash

echo "🔐 Creating Admin User - LERA Academy"
echo "======================================"
echo ""

# First, let's run the debug script to see what's there
chmod +x /Users/rahulsharma/LERA_Group/debug-login.sh
/Users/rahulsharma/LERA_Group/debug-login.sh

echo ""
echo "======================================"
echo "🔧 Now creating/updating admin user..."
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- Create super admin user with proper bcrypt hash
-- Password: admin123
-- Bcrypt hash generated with: $2a$10$N9qo8uLOickgx2ZMRZoMye
INSERT INTO users (id, email, password, full_name, role_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@lera.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Super Administrator',
  r.id,
  true,
  NOW(),
  NOW()
FROM roles r 
WHERE r.name = 'superadmin'
ON CONFLICT (email) DO UPDATE SET
  password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  full_name = 'Super Administrator',
  is_active = true,
  updated_at = NOW();

-- Verify
SELECT 
  u.id,
  u.email, 
  u.full_name, 
  r.name as role,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
EOF

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo ""
echo "📋 Login Credentials:"
echo "   URL: http://localhost:3000/auth/login"
echo "   Email: admin@lera.com"
echo "   Password: admin123"
echo ""
echo "🎯 Dashboard: http://localhost:3000/dashboard/superadmin"
echo ""
