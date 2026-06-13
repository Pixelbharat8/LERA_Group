#!/bin/bash

echo "🔐 Creating Super Admin User for LERA Academy"
echo "=============================================="
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "❌ PostgreSQL is not running!"
    echo "   Start it with: brew services start postgresql@15"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Create super admin user
echo "Creating super admin user..."
echo "Email: admin@lera.com"
echo "Password: admin123"
echo ""

psql -h localhost -U lera -d lera << 'EOF'
-- First, make sure we have a superadmin role
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'superadmin', 'Super Administrator', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create the super admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO users (id, email, password, full_name, role_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@lera.com',
  '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu',
  'Super Administrator',
  id,
  true,
  NOW(),
  NOW()
FROM roles WHERE name = 'superadmin'
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  full_name = EXCLUDED.full_name,
  is_active = true,
  updated_at = NOW();

-- Verify the user was created
SELECT 
  u.email, 
  u.full_name, 
  r.name as role,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@lera.com';
EOF

echo ""
echo "=============================================="
echo "✅ Admin User Created Successfully!"
echo ""
echo "📋 Login Credentials:"
echo "   Email: admin@lera.com"
echo "   Password: admin123"
echo ""
echo "🌐 Access URLs:"
echo "   Login: http://localhost:3000/auth/login"
echo "   Dashboard: http://localhost:3000/dashboard/superadmin"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open http://localhost:3000/auth/login"
echo "   2. Login with the credentials above"
echo "   3. You'll be redirected to the admin dashboard"
echo ""
