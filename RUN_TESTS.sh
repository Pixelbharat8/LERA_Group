#!/bin/bash

###############################################################################
# LERA Group - Comprehensive Testing Script
# Purpose: Run all Phase 1 tests from QUICK_TEST_GUIDE.md
# Time Estimate: 30 minutes total
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_test() {
    echo -e "${BLUE}📋${NC} $1"
}

log_pass() {
    echo -e "${GREEN}✅${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}❌${NC} $1"
    ((TESTS_FAILED++))
}

log_skip() {
    echo -e "${YELLOW}⏭️ ${NC} $1"
    ((TESTS_SKIPPED++))
}

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local expected_code=$4
    
    log_test "$name"
    
    local response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>/dev/null)
    local body=$(echo "$response" | head -n 1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_code" ]; then
        log_pass "$name returned HTTP $status"
        return 0
    else
        log_fail "$name returned HTTP $status (expected $expected_code)"
        return 1
    fi
}

# Database query helper
test_db_query() {
    local name=$1
    local query=$2
    local expected_min=$3
    
    log_test "$name"
    
    local result=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -tc "$query" 2>/dev/null | grep -oE '[0-9]+' | head -1)
    
    if [ -z "$result" ]; then
        log_fail "$name: query failed"
        return 1
    fi
    
    if [ "$result" -ge "$expected_min" ]; then
        log_pass "$name: found $result records (expected >= $expected_min)"
        return 0
    else
        log_fail "$name: found $result records (expected >= $expected_min)"
        return 1
    fi
}

###############################################################################
# PHASE 1: CONNECTIVITY TESTS
###############################################################################

log_header "PHASE 1: SERVICE CONNECTIVITY TESTS"

echo -e "${YELLOW}⏳${NC} Waiting for services to be ready..."
sleep 5

test_endpoint "Identity Service Health" "GET" "http://localhost:8080/actuator/health" "200"
test_endpoint "Academy Service Health" "GET" "http://localhost:8081/actuator/health" "200"
test_endpoint "Payment Service Health" "GET" "http://localhost:8082/actuator/health" "200"
test_endpoint "Payroll Service Health" "GET" "http://localhost:8083/actuator/health" "200"
test_endpoint "Attendance Service Health" "GET" "http://localhost:8084/actuator/health" "200"
test_endpoint "Connect Service Health" "GET" "http://localhost:8085/actuator/health" "200"
test_endpoint "AI Gateway Health" "GET" "http://localhost:8086/actuator/health" "200"

###############################################################################
# PHASE 2: DATABASE TESTS - VERIFY DATA WAS LOADED
###############################################################################

log_header "PHASE 2: DATABASE INTEGRITY TESTS - VERIFY DATALOADERS EXECUTED"

echo -e "${YELLOW}⏳${NC} Testing database connections and data..."

# Academy Service Data
test_db_query "Teachers loaded" "SELECT COUNT(*) FROM teachers;" 3
test_db_query "Students loaded" "SELECT COUNT(*) FROM students;" 4
test_db_query "Classes loaded" "SELECT COUNT(*) FROM classes;" 2
test_db_query "Enrollments loaded" "SELECT COUNT(*) FROM enrollments;" 6
test_db_query "Course Programs loaded" "SELECT COUNT(*) FROM course_programs;" 3

# Attendance Service Data
test_db_query "Attendance records loaded" "SELECT COUNT(*) FROM attendance;" 16

# Payment Service Data
test_db_query "Payment records loaded" "SELECT COUNT(*) FROM payments;" 7

# Payroll Service Data
test_db_query "Payroll records loaded" "SELECT COUNT(*) FROM payroll_records;" 8

# CRM Service Data (should already exist)
test_db_query "CRM Leads exist" "SELECT COUNT(*) FROM leads;" 1

###############################################################################
# PHASE 3: API ENDPOINT TESTS
###############################################################################

log_header "PHASE 3: API ENDPOINT TESTS - VERIFY CRUD OPERATIONS"

echo -e "${YELLOW}⏳${NC} Testing API endpoints..."

# Academy Service Endpoints
test_endpoint "GET Teachers" "GET" "http://localhost:8081/api/teachers" "200"
test_endpoint "GET Students" "GET" "http://localhost:8081/api/students" "200"
test_endpoint "GET Classes" "GET" "http://localhost:8081/api/classes" "200"
test_endpoint "GET Enrollments" "GET" "http://localhost:8081/api/enrollments" "200"
test_endpoint "GET Courses" "GET" "http://localhost:8081/api/courses" "200"

# Attendance Service Endpoints
test_endpoint "GET Attendance" "GET" "http://localhost:8084/api/attendance" "200"

# Payment Service Endpoints
test_endpoint "GET Payments" "GET" "http://localhost:8082/api/payments" "200"

# Payroll Service Endpoints
test_endpoint "GET Payroll" "GET" "http://localhost:8083/api/payroll" "200"

# Connect Service / CRM Endpoints
test_endpoint "GET Leads" "GET" "http://localhost:8085/api/leads" "200"

# Identity Service Endpoints
test_endpoint "GET Roles" "GET" "http://localhost:8080/api/roles" "200"
test_endpoint "GET Users" "GET" "http://localhost:8080/api/users" "200"

###############################################################################
# PHASE 4: FRONTEND PORT CONFIGURATION TESTS
###############################################################################

log_header "PHASE 4: FRONTEND PORT MAPPING VERIFICATION"

echo -e "${BLUE}📋${NC} Verifying port configurations in frontend files..."

# Check that port fixes were applied
log_test "Payments page uses port 8082"
if grep -q "localhost:8082" /Users/rahulsharma/LERA_Group/frontend/app/dashboard/payments/page.tsx 2>/dev/null; then
    log_pass "Payments page correctly mapped to port 8082"
else
    log_fail "Payments page port mapping issue"
fi

log_test "Attendance page uses port 8084"
if grep -q "localhost:8084" /Users/rahulsharma/LERA_Group/frontend/app/dashboard/attendance/page.tsx 2>/dev/null; then
    log_pass "Attendance page correctly mapped to port 8084"
else
    log_fail "Attendance page port mapping issue"
fi

log_test "Payroll page uses port 8083"
if grep -q "localhost:8083" /Users/rahulsharma/LERA_Group/frontend/app/dashboard/payroll/page.tsx 2>/dev/null; then
    log_pass "Payroll page correctly mapped to port 8083"
else
    log_fail "Payroll page port mapping issue"
fi

###############################################################################
# PHASE 5: DATALOADER VERIFICATION
###############################################################################

log_header "PHASE 5: DATALOADER FILES VERIFICATION"

echo -e "${BLUE}📋${NC} Verifying all DataLoader files exist and are correct..."

log_test "AcademyDataLoader.java exists"
if [ -f "/Users/rahulsharma/LERA_Group/backend/academy_service/src/main/java/com/lera/academy_service/config/AcademyDataLoader.java" ]; then
    log_pass "AcademyDataLoader.java found"
else
    log_fail "AcademyDataLoader.java not found"
fi

log_test "AttendanceDataLoader.java exists"
if [ -f "/Users/rahulsharma/LERA_Group/backend/attendance_service/src/main/java/com/lera/attendance_service/config/AttendanceDataLoader.java" ]; then
    log_pass "AttendanceDataLoader.java found"
else
    log_fail "AttendanceDataLoader.java not found"
fi

log_test "PaymentDataLoader.java exists"
if [ -f "/Users/rahulsharma/LERA_Group/backend/payment_service/src/main/java/com/lera/payment_service/config/PaymentDataLoader.java" ]; then
    log_pass "PaymentDataLoader.java found"
else
    log_fail "PaymentDataLoader.java not found"
fi

log_test "PayrollDataLoader.java exists"
if [ -f "/Users/rahulsharma/LERA_Group/backend/payroll_service/src/main/java/com/lera/payroll_service/config/PayrollDataLoader.java" ]; then
    log_pass "PayrollDataLoader.java found"
else
    log_fail "PayrollDataLoader.java not found"
fi

###############################################################################
# PHASE 6: DOCUMENTATION VERIFICATION
###############################################################################

log_header "PHASE 6: DOCUMENTATION VERIFICATION"

echo -e "${BLUE}📋${NC} Verifying all documentation files..."

DOCS=("QUICK_TEST_GUIDE.md" "PHASE1_ACTION_PLAN.md" "SUPERADMIN_FEATURES_ANALYSIS.md" "FINAL_SUMMARY.md" "README_DOCUMENTATION.md" "WORK_COMPLETION_SUMMARY.md")

for doc in "${DOCS[@]}"; do
    if [ -f "/Users/rahulsharma/LERA_Group/$doc" ]; then
        log_pass "$doc exists"
    else
        log_fail "$doc not found"
    fi
done

###############################################################################
# TEST SUMMARY
###############################################################################

log_header "TEST SUMMARY & RESULTS"

echo -e "${GREEN}Passed:${NC}  $TESTS_PASSED"
echo -e "${RED}Failed:${NC}  $TESTS_FAILED"
echo -e "${YELLOW}Skipped:${NC} $TESTS_SKIPPED"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
    echo -e "${BLUE}Success Rate: $PERCENTAGE% ($TESTS_PASSED/$TOTAL)${NC}"
fi

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_header "✅ ALL TESTS PASSED - PHASE 1 COMPLETE!"
else
    log_header "⚠️  SOME TESTS FAILED - REVIEW ABOVE"
fi

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with: admin@lera.com / admin123"
echo "3. Navigate to SuperAdmin dashboard"
echo "4. Verify all pages show data:"
echo "   - Teachers (should show 3)"
echo "   - Students (should show 4)"
echo "   - Classes (should show 2)"
echo "   - Enrollments (should show data)"
echo "   - Attendance (should show 16 records)"
echo "   - Payments (should show 7 records)"
echo "   - Payroll (should show 8 records)"
echo ""
echo "📝 For detailed testing, see: QUICK_TEST_GUIDE.md"
echo "🐛 For troubleshooting, see: PHASE1_ACTION_PLAN.md"
echo ""

