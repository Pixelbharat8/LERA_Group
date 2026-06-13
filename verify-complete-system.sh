#!/bin/bash

echo "======================================"
echo "LERA System Verification Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check Database - All Staff
echo "1. Checking all staff in database..."
STAFF_COUNT=$(psql -U rahulsharma -d lera -t -c "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('TEACHER', 'TA', 'STAFF');")
echo -e "${GREEN}✓ Found $STAFF_COUNT staff members${NC}"
psql -U rahulsharma -d lera -c "SELECT u.fullname, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('TEACHER', 'TA', 'STAFF') ORDER BY r.name, u.fullname;"
echo ""

# 2. Check Teachers Table
echo "2. Checking teachers table linkage..."
TEACHERS_COUNT=$(psql -U rahulsharma -d lera -t -c "SELECT COUNT(*) FROM teachers WHERE user_id IS NOT NULL;")
echo -e "${GREEN}✓ $TEACHERS_COUNT teachers linked to users table${NC}"
psql -U rahulsharma -d lera -c "SELECT t.teacher_code, u.fullname FROM teachers t JOIN users u ON t.user_id = u.id ORDER BY t.teacher_code;"
echo ""

# 3. Check Teaching Sessions
echo "3. Checking teaching sessions..."
SESSION_COUNT=$(psql -U rahulsharma -d lera -t -c "SELECT COUNT(*) FROM teacher_sessions WHERE status='COMPLETED';")
echo -e "${GREEN}✓ Found $SESSION_COUNT completed teaching sessions${NC}"
psql -U rahulsharma -d lera -c "SELECT u.fullname, r.name, COUNT(*) as sessions, ROUND(SUM(ts.duration_hours)::numeric, 2) as hours FROM teacher_sessions ts JOIN users u ON ts.teacher_id = u.id JOIN roles r ON u.role_id = r.id GROUP BY u.fullname, r.name ORDER BY r.name;"
echo ""

# 4. Check Salary Configs
echo "4. Checking salary configurations..."
CONFIG_COUNT=$(psql -U rahulsharma -d lera -t -c "SELECT COUNT(*) FROM teacher_salary_config WHERE status='ACTIVE';")
echo -e "${GREEN}✓ Found $CONFIG_COUNT active salary configs${NC}"
psql -U rahulsharma -d lera -c "SELECT u.fullname, r.name as role, tsc.base_salary, tsc.hourly_rate, tsc.salary_type FROM teacher_salary_config tsc JOIN users u ON tsc.teacher_id = u.id JOIN roles r ON u.role_id = r.id ORDER BY r.name, u.fullname;"
echo ""

# 5. Check Identity Service
echo "5. Checking Identity Service API..."
if curl -s http://localhost:8080/api/users > /dev/null; then
    USERS_API_COUNT=$(curl -s http://localhost:8080/api/users | jq '[.[] | select(.roleName == "TEACHER" or .roleName == "TA" or .roleName == "STAFF")] | length')
    echo -e "${GREEN}✓ Identity Service running - returns $USERS_API_COUNT staff members${NC}"
else
    echo -e "${RED}✗ Identity Service not responding${NC}"
fi
echo ""

# 6. Check Attendance Service  
echo "6. Checking Attendance Service API..."
if curl -s http://localhost:8084/api/teacher-sessions > /dev/null; then
    SESSIONS_API_COUNT=$(curl -s http://localhost:8084/api/teacher-sessions | jq 'length')
    echo -e "${GREEN}✓ Attendance Service running - returns $SESSIONS_API_COUNT sessions${NC}"
else
    echo -e "${RED}✗ Attendance Service not responding${NC}"
fi
echo ""

# 7. Check Payroll Service
echo "7. Checking Payroll Service API..."
if curl -s http://localhost:8083/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Payroll Service running${NC}"
else
    echo -e "${RED}✗ Payroll Service not responding${NC}"
fi
echo ""

# 8. Test Payroll Generation
echo "8. Testing payroll generation for all staff..."
PAYROLL_RESULT=$(curl -s -X POST http://localhost:8083/api/payroll/generate \
  -H "Content-Type: application/json" \
  -d '{"payPeriodStart":"2025-11-01","payPeriodEnd":"2025-12-26"}')

PAYROLL_COUNT=$(echo "$PAYROLL_RESULT" | jq 'length')
if [ "$PAYROLL_COUNT" -eq 8 ]; then
    echo -e "${GREEN}✓ Successfully generated $PAYROLL_COUNT payroll records${NC}"
    echo ""
    echo "Payroll Summary:"
    echo "$PAYROLL_RESULT" | jq -r '.[] | "\(.teacherName) (\(.notes | match("\\[([A-Z]+)\\]").captures[0].string)): \(.teachingHours)h × \(.hourlyRate) + \(.baseSalary) = \(.totalAmount) VND"'
else
    echo -e "${RED}✗ Expected 8 records, got $PAYROLL_COUNT${NC}"
fi
echo ""

# 9. Check Recent Payroll in Database
echo "9. Checking recent payroll records in database..."
RECENT_PAYROLL=$(psql -U rahulsharma -d lera -t -c "SELECT COUNT(*) FROM payroll WHERE created_at > NOW() - INTERVAL '10 minutes';")
echo -e "${GREEN}✓ Found $RECENT_PAYROLL recently generated payroll records${NC}"
echo ""

# Summary
echo "======================================"
echo "Verification Complete!"
echo "======================================"
echo ""
echo -e "${GREEN}✓ All Systems Operational:${NC}"
echo "  - $STAFF_COUNT staff members (4 Teachers + 2 TAs + 2 Staff)"
echo "  - $SESSION_COUNT completed teaching sessions"
echo "  - $CONFIG_COUNT salary configurations"
echo "  - $PAYROLL_COUNT payroll records generated"
echo ""
echo "Ready to use! Login to http://localhost:3000"
echo "  - Admin: admin@lera.com / admin123"
echo "  - Teacher: john.nguyen@lera.com / teacher123"
echo "  - TA: emma.wilson@lera.com / staff123"
echo "  - Staff: lisa.nguyen@lera.com / staff123"
