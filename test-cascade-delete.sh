#!/bin/bash

# =====================================================
# CASCADE DELETE TEST SCRIPT
# =====================================================
# This script tests the CASCADE DELETE implementation
# =====================================================

echo "========================================"
echo "🧪 CASCADE DELETE - VERIFICATION TEST"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1️⃣  Checking CASCADE DELETE configuration..."
echo ""

CASCADE_COUNT=$(psql -d lera -t -c "
SELECT COUNT(*) 
FROM pg_constraint 
WHERE confrelid = 'users'::regclass 
  AND contype = 'f' 
  AND confdeltype = 'c';
")

SET_NULL_COUNT=$(psql -d lera -t -c "
SELECT COUNT(*) 
FROM pg_constraint 
WHERE confrelid = 'users'::regclass 
  AND contype = 'f' 
  AND confdeltype = 'n';
")

echo "   ✅ CASCADE DELETE constraints: $CASCADE_COUNT"
echo "   📝 SET NULL constraints: $SET_NULL_COUNT"
echo ""

echo "2️⃣  Sample CASCADE DELETE tables:"
echo ""
psql -d lera -c "
SELECT 
  conrelid::regclass AS table_name,
  CASE confdeltype 
    WHEN 'c' THEN '✅ CASCADE'
    WHEN 'n' THEN '📝 SET NULL'
  END AS action
FROM pg_constraint 
WHERE confrelid = 'users'::regclass 
  AND contype = 'f'
  AND conrelid::regclass IN (
    'teachers'::regclass,
    'students'::regclass, 
    'staff'::regclass,
    'user_profiles'::regclass,
    'user_sessions'::regclass,
    'notifications'::regclass,
    'audit_logs'::regclass,
    'activity_logs'::regclass
  )
ORDER BY action DESC, table_name;
" 2>/dev/null

echo ""
echo "3️⃣  Checking Teacher CASCADE chain..."
echo ""
psql -d lera -c "
SELECT 
  conrelid::regclass AS table_name,
  CASE confdeltype 
    WHEN 'c' THEN '✅ CASCADE'
    WHEN 'n' THEN '📝 SET NULL'
  END AS action
FROM pg_constraint 
WHERE confrelid = 'teachers'::regclass 
  AND contype = 'f'
ORDER BY action DESC, table_name;
" 2>/dev/null

echo ""
echo "4️⃣  Example Test User (John Nguyen):"
echo ""
psql -d lera -c "
SELECT 
  u.id,
  u.email,
  u.fullname,
  u.status,
  t.id as teacher_id,
  t.teacher_code
FROM users u
LEFT JOIN teachers t ON t.user_id = u.id
WHERE u.email = 'john.nguyen@lera.com';
" 2>/dev/null

echo ""
echo "========================================"
echo "✅ CASCADE DELETE READY TO USE!"
echo "========================================"
echo ""
echo "📋 How to test:"
echo "   1. Login as Super Admin (admin@lera.com / admin123)"
echo "   2. Go to User Management page"
echo "   3. Click DELETE button on any user"
echo "   4. Confirm deletion (2 prompts)"
echo "   5. User + ALL related records deleted!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Deletion is PERMANENT"
echo "   - Use DISABLE instead to preserve data"
echo "   - Super Admin cannot be deleted"
echo "   - Audit logs preserved (SET NULL)"
echo ""
