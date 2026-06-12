#!/bin/bash

###############################################################################
# LERA Group - Fix Remaining Issues
# Purpose: Fix UserDTO bug, add Payment/Payroll modals, Gamification frontend
# Time Estimate: 90 minutes
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_step() {
    echo -e "${GREEN}✅${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

###############################################################################
# ISSUE 1: Fix UserDTO Mapping Bug
###############################################################################

log_header "FIXING ISSUE 1: UserDTO Mapping Bug (Users Page - Failed to fetch)"

log_info "The Users page shows 'Failed to fetch' because UserService is not"
log_info "mapping user.role.displayName to userDTO.roleName"
log_info ""
log_info "Finding UserService file..."

# Find the UserService file
USER_SERVICE=$(find /Users/rahulsharma/LERA_Group/backend -name "UserService.java" -type f | head -1)

if [ -z "$USER_SERVICE" ]; then
    echo -e "${RED}❌ UserService.java not found${NC}"
    echo "Please create UserService.java in identity_service with proper role mapping"
else
    echo -e "${YELLOW}📝 UserService found at: $USER_SERVICE${NC}"
    log_step "Need to verify getAllUsers() method maps roleName properly"
    echo ""
    echo "Expected mapping:"
    echo "  user.getRole().getDisplayName() → userDTO.setRoleName()"
    echo ""
    echo "If not present, add this in getAllUsers():"
    echo "  userDTO.setRoleName(user.getRole().getDisplayName());"
fi

echo ""
log_info "To manually fix:"
echo "1. Open the UserService.java file"
echo "2. Find the getAllUsers() method"
echo "3. Ensure the mapping includes:"
echo "   userDTO.setRoleName(user.getRole().getDisplayName());"
echo "4. Rebuild and restart identity_service"
echo ""

###############################################################################
# ISSUE 2: Add Payment Form Modal
###############################################################################

log_header "FIXING ISSUE 2: Add Payment Form Modal"

log_info "The Payments page has a 'Record Payment' button that doesn't work"
log_info "Need to add a form modal to capture payment details"

PAYMENT_PAGE="/Users/rahulsharma/LERA_Group/frontend/app/dashboard/payments/page.tsx"

if [ -f "$PAYMENT_PAGE" ]; then
    log_step "Payments page found"
    echo ""
    echo "Required additions:"
    echo "1. Add useState hook for modal visibility"
    echo "2. Add useState hook for form data (studentId, amount, method, description)"
    echo "3. Add handleSubmit function to POST to /api/payments"
    echo "4. Add Modal component with form fields"
    echo "5. Update 'Record Payment' button to open modal"
    echo ""
    echo "Form fields needed:"
    echo "  - Student ID (select dropdown)"
    echo "  - Amount (number input)"
    echo "  - Payment Method (select: CASH, BANK_TRANSFER, CARD, MOMO, VNPAY)"
    echo "  - Description (textarea)"
    echo ""
else
    echo -e "${RED}❌ Payments page not found at $PAYMENT_PAGE${NC}"
fi

echo ""

###############################################################################
# ISSUE 3: Add Payroll Form Modal
###############################################################################

log_header "FIXING ISSUE 3: Add Payroll Form Modal"

log_info "The Payroll page has a 'Run Payroll' button that doesn't work"
log_info "Need to add a form modal to capture payroll details"

PAYROLL_PAGE="/Users/rahulsharma/LERA_Group/frontend/app/dashboard/payroll/page.tsx"

if [ -f "$PAYROLL_PAGE" ]; then
    log_step "Payroll page found"
    echo ""
    echo "Required additions:"
    echo "1. Add useState hook for modal visibility"
    echo "2. Add useState hook for form data"
    echo "3. Add handleSubmit function to POST to /api/payroll"
    echo "4. Add Modal component with form fields"
    echo "5. Update 'Run Payroll' button to open modal"
    echo ""
    echo "Form fields needed:"
    echo "  - Employee ID (select dropdown)"
    echo "  - Base Salary (number input)"
    echo "  - Teaching Hours (number input)"
    echo "  - Pay Period Start (date input)"
    echo "  - Pay Period End (date input)"
    echo "  - Notes (textarea)"
    echo ""
else
    echo -e "${RED}❌ Payroll page not found at $PAYROLL_PAGE${NC}"
fi

echo ""

###############################################################################
# ISSUE 4: Implement Gamification Frontend
###############################################################################

log_header "FIXING ISSUE 4: Implement Gamification Frontend"

log_info "The Gamification page exists but is incomplete"
log_info "Need to implement leaderboard and points display"

GAMIFICATION_PAGE="/Users/rahulsharma/LERA_Group/frontend/app/dashboard/superadmin/gamification/page.tsx"

if [ -f "$GAMIFICATION_PAGE" ]; then
    log_step "Gamification page found"
    echo ""
    echo "Required components:"
    echo "1. Student Points Display"
    echo "   - Fetch from: GET /api/gamification/students/{id}/points"
    echo "   - Display: Points, Level, Next Level Progress"
    echo ""
    echo "2. Leaderboard"
    echo "   - Fetch from: GET /api/gamification/leaderboard"
    echo "   - Display: Ranking, Student Name, Points, Level"
    echo ""
    echo "3. Badge Management"
    echo "   - Display: Earned Badges, Badge Icons, Award Dates"
    echo ""
    echo "4. Points Graph"
    echo "   - Show points trend over time"
    echo ""
else
    echo -e "${RED}❌ Gamification page not found at $GAMIFICATION_PAGE${NC}"
fi

echo ""

###############################################################################
# QUICK FIX GUIDE
###############################################################################

log_header "QUICK FIX IMPLEMENTATION GUIDE"

echo -e "${YELLOW}📋 Issue Priority:${NC}"
echo ""
echo "1. ${RED}CRITICAL${NC} - Fix UserDTO mapping (Users page broken)"
echo "   Time: 15 minutes"
echo "   Location: identity_service/UserService.java"
echo "   Impact: Unblocks Users page"
echo ""
echo "2. ${YELLOW}HIGH${NC} - Add Payment Modal (users can't record payments)"
echo "   Time: 30 minutes"
echo "   Location: frontend/app/dashboard/payments/page.tsx"
echo "   Impact: Enables payment recording"
echo ""
echo "3. ${YELLOW}HIGH${NC} - Add Payroll Modal (users can't run payroll)"
echo "   Time: 30 minutes"
echo "   Location: frontend/app/dashboard/payroll/page.tsx"
echo "   Impact: Enables payroll processing"
echo ""
echo "4. ${BLUE}MEDIUM${NC} - Implement Gamification (nice to have for MVP)"
echo "   Time: 30 minutes"
echo "   Location: frontend/app/dashboard/superadmin/gamification/page.tsx"
echo "   Impact: Improves user engagement"
echo ""

###############################################################################
# IMPLEMENTATION CHECKLIST
###############################################################################

log_header "IMPLEMENTATION CHECKLIST"

echo -e "${BLUE}After completing each fix:${NC}"
echo ""
echo "Fix 1 - UserDTO:"
echo "  [ ] Locate getAllUsers() in UserService.java"
echo "  [ ] Add: userDTO.setRoleName(user.getRole().getDisplayName());"
echo "  [ ] Rebuild: mvn clean install -DskipTests"
echo "  [ ] Restart: identity_service"
echo "  [ ] Test: curl http://localhost:8080/api/users"
echo ""
echo "Fix 2 - Payment Modal:"
echo "  [ ] Add modal state hooks"
echo "  [ ] Create form component"
echo "  [ ] Add submit handler"
echo "  [ ] Update button onClick"
echo "  [ ] Test in browser: Admin > Payments"
echo ""
echo "Fix 3 - Payroll Modal:"
echo "  [ ] Add modal state hooks"
echo "  [ ] Create form component"
echo "  [ ] Add submit handler"
echo "  [ ] Update button onClick"
echo "  [ ] Test in browser: Admin > Payroll"
echo ""
echo "Fix 4 - Gamification:"
echo "  [ ] Create leaderboard component"
echo "  [ ] Add points display"
echo "  [ ] Add badge display"
echo "  [ ] Add points graph"
echo "  [ ] Test in browser: Admin > Gamification"
echo ""

###############################################################################
# NEXT STEPS
###############################################################################

log_header "NEXT STEPS"

echo -e "${GREEN}To implement all fixes:${NC}"
echo ""
echo "Step 1: Start services"
echo "  bash /Users/rahulsharma/LERA_Group/IMPLEMENT_PHASE1.sh"
echo ""
echo "Step 2: Open IDE and apply fixes in order"
echo "  - Fix UserDTO mapping first (Critical)"
echo "  - Add Payment modal (High)"
echo "  - Add Payroll modal (High)"
echo "  - Implement Gamification (Medium)"
echo ""
echo "Step 3: Rebuild and test each fix"
echo "  After each fix: mvn clean install && restart service"
echo ""
echo "Step 4: Test in browser"
echo "  http://localhost:3000"
echo "  Admin: admin@lera.com / admin123"
echo ""
echo "Step 5: Verify all pages working"
echo "  bash /Users/rahulsharma/LERA_Group/RUN_TESTS.sh"
echo ""

echo -e "${BLUE}Estimated Total Time: 90 minutes${NC}"
echo ""

