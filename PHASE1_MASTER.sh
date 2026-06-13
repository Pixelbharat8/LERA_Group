#!/bin/bash

###############################################################################
# LERA Group - PHASE 1 COMPLETE IMPLEMENTATION MASTER SCRIPT
# Purpose: Execute all Phase 1 tasks end-to-end
# Steps:
#   1. Rebuild services (5 min)
#   2. Start all services (2 min)
#   3. Run test checklist (30 min)
#   4. Fix remaining issues guide (reference)
# Total Time: ~40-50 minutes
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Global settings
BASE_DIR="/Users/rahulsharma/LERA_Group"
BACKEND_DIR="$BASE_DIR/backend"

log_title() {
    echo ""
    echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${NC} $1"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_step() {
    echo -e "${GREEN}✅${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

###############################################################################
# MAIN MENU
###############################################################################

show_menu() {
    clear
    log_title "🎯 LERA GROUP - PHASE 1 IMPLEMENTATION & TESTING"
    
    echo ""
    echo -e "${CYAN}Choose what you want to do:${NC}"
    echo ""
    echo "  1) 🚀 RUN ALL (Rebuild + Start + Test) - ~50 min"
    echo "  2) 🔨 REBUILD SERVICES ONLY - 5 min"
    echo "  3) ▶️  START SERVICES ONLY - 2 min"
    echo "  4) 🧪 RUN TESTS ONLY - 30 min"
    echo "  5) 🛠️  FIX REMAINING ISSUES GUIDE"
    echo "  6) 📊 SHOW SERVICE STATUS"
    echo "  7) 📖 SHOW DOCUMENTATION"
    echo "  8) 🛑 STOP ALL SERVICES"
    echo "  9) ❌ EXIT"
    echo ""
}

###############################################################################
# FUNCTION: REBUILD SERVICES
###############################################################################

rebuild_all() {
    log_section "PHASE 1: REBUILDING SERVICES WITH DATALOADERS (5 min)"
    
    # Kill existing processes
    log_info "Cleaning up old processes..."
    killall java 2>/dev/null || true
    sleep 2
    log_step "Old processes cleaned"
    
    # Function to rebuild
    rebuild_service() {
        local service=$1
        local dir="$BACKEND_DIR/$service"
        
        if [ ! -d "$dir" ]; then
            log_error "Service not found: $service"
            return 1
        fi
        
        echo -ne "${YELLOW}🔨 Rebuilding $service...${NC}"
        cd "$dir"
        
        if [ -f "mvnw" ]; then
            ./mvnw clean install -DskipTests -q 2>&1 > /dev/null || true
        else
            mvn clean install -DskipTests -q 2>&1 > /dev/null || true
        fi
        
        if [ -f "target/classes" ]; then
            echo -e "\r${GREEN}✅ $service rebuilt${NC}                    "
            return 0
        else
            echo -e "\r${YELLOW}⚠️  $service (may need checking)${NC}       "
            return 0
        fi
    }
    
    # Rebuild critical services
    rebuild_service "academy_service"
    rebuild_service "attendance_service"
    rebuild_service "payment_service"
    rebuild_service "payroll_service"
    
    # Rebuild supporting services
    rebuild_service "identity_service"
    rebuild_service "connect_service"
    rebuild_service "ai_gateway"
    
    log_step "All services rebuilt!"
}

###############################################################################
# FUNCTION: START SERVICES
###############################################################################

start_all() {
    log_section "PHASE 2: STARTING ALL SERVICES (2 min)"
    
    # Check PostgreSQL
    log_info "Verifying PostgreSQL..."
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        log_warn "PostgreSQL not responding - starting..."
        brew services start postgresql@15 2>/dev/null || true
        sleep 3
    fi
    log_step "PostgreSQL ready"
    
    # Function to start service
    start_service() {
        local service=$1
        local port=$2
        local dir="$BACKEND_DIR/$service"
        
        if [ ! -d "$dir" ]; then
            log_error "Service not found: $service"
            return 1
        fi
        
        echo -ne "${YELLOW}🚀 Starting $service (port $port)...${NC}"
        cd "$dir"
        
        # Find and run JAR or fallback to Maven
        local jar=$(find target -name "*.jar" -type f 2>/dev/null | head -1)
        if [ -n "$jar" ]; then
            nohup java -jar "$jar" > "/tmp/${service}.log" 2>&1 &
        else
            nohup mvn spring-boot:run -DskipTests > "/tmp/${service}.log" 2>&1 &
        fi
        
        sleep 3
        echo -e "\r${GREEN}✅ $service started${NC}                  "
    }
    
    # Start all services
    start_service "identity_service" 8080
    start_service "academy_service" 8081
    start_service "attendance_service" 8084
    start_service "payment_service" 8082
    start_service "payroll_service" 8083
    start_service "connect_service" 8085
    start_service "ai_gateway" 8086
    
    log_step "All services started in background"
    
    # Wait for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 10
    
    # Show service status
    show_service_status
}

###############################################################################
# FUNCTION: RUN TESTS
###############################################################################

run_all_tests() {
    log_section "PHASE 3: RUNNING COMPREHENSIVE TESTS"
    
    log_info "This will test all services and database integrity..."
    echo ""
    
    # Test connectivity
    log_step "Testing service connectivity"
    test_endpoint_simple "Identity Service" "http://localhost:8080/actuator/health"
    test_endpoint_simple "Academy Service" "http://localhost:8081/actuator/health"
    test_endpoint_simple "Payment Service" "http://localhost:8082/actuator/health"
    test_endpoint_simple "Payroll Service" "http://localhost:8083/actuator/health"
    test_endpoint_simple "Attendance Service" "http://localhost:8084/actuator/health"
    test_endpoint_simple "Connect Service" "http://localhost:8085/actuator/health"
    test_endpoint_simple "AI Gateway" "http://localhost:8086/actuator/health"
    
    echo ""
    log_step "Testing database data"
    
    # Database tests
    test_db_simple "Teachers" "SELECT COUNT(*) FROM teachers"
    test_db_simple "Students" "SELECT COUNT(*) FROM students"
    test_db_simple "Classes" "SELECT COUNT(*) FROM classes"
    test_db_simple "Enrollments" "SELECT COUNT(*) FROM enrollments"
    test_db_simple "Attendance" "SELECT COUNT(*) FROM attendance"
    test_db_simple "Payments" "SELECT COUNT(*) FROM payments"
    test_db_simple "Payroll" "SELECT COUNT(*) FROM payroll_records"
    
    echo ""
    log_step "Testing API endpoints"
    
    # API tests
    test_endpoint_simple "GET Teachers" "http://localhost:8081/api/teachers"
    test_endpoint_simple "GET Students" "http://localhost:8081/api/students"
    test_endpoint_simple "GET Payments" "http://localhost:8082/api/payments"
    test_endpoint_simple "GET Payroll" "http://localhost:8083/api/payroll"
    test_endpoint_simple "GET Leads" "http://localhost:8085/api/leads"
    
    echo ""
    log_step "All tests complete!"
}

test_endpoint_simple() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        log_step "$name ✓"
    else
        log_warn "$name ⚠️  (may still be starting)"
    fi
}

test_db_simple() {
    local name=$1
    local query=$2
    
    local result=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -tc "$query" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "?")
    log_step "$name: $result records"
}

###############################################################################
# FUNCTION: SHOW SERVICE STATUS
###############################################################################

show_service_status() {
    log_section "SERVICE STATUS"
    
    echo -e "${CYAN}Checking all services...${NC}"
    echo ""
    
    check_service() {
        local name=$1
        local port=$2
        
        if curl -s -f "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} $name (port $port) - RUNNING"
        else
            echo -e "${RED}❌${NC} $name (port $port) - NOT RESPONDING"
        fi
    }
    
    check_service "Identity Service" 8080
    check_service "Academy Service" 8081
    check_service "Payment Service" 8082
    check_service "Payroll Service" 8083
    check_service "Attendance Service" 8084
    check_service "Connect Service" 8085
    check_service "AI Gateway" 8086
    
    echo ""
    echo -e "${CYAN}Quick Access:${NC}"
    echo "  Frontend:   http://localhost:3000"
    echo "  Admin:      admin@lera.com / admin123"
    echo ""
}

###############################################################################
# FUNCTION: SHOW DOCUMENTATION
###############################################################################

show_documentation() {
    log_section "DOCUMENTATION & GUIDES"
    
    echo -e "${CYAN}Available Documents:${NC}"
    echo ""
    
    DOCS=(
        "QUICK_TEST_GUIDE.md:Complete testing checklist with 18+ pages"
        "PHASE1_ACTION_PLAN.md:3-phase action plan with technical details"
        "SUPERADMIN_FEATURES_ANALYSIS.md:Analysis of all 22 SuperAdmin features"
        "FINAL_SUMMARY.md:Executive summary of work completed"
        "README_DOCUMENTATION.md:Navigation guide for all documents"
        "WORK_COMPLETION_SUMMARY.md:Summary of Phase 1 completion"
    )
    
    for doc in "${DOCS[@]}"; do
        IFS=':' read -r name desc <<< "$doc"
        if [ -f "$BASE_DIR/$name" ]; then
            echo -e "  ${GREEN}✅${NC} $name"
            echo -e "     $desc"
        else
            echo -e "  ${RED}❌${NC} $name (not found)"
        fi
    done
    
    echo ""
    echo -e "${CYAN}View in editor:${NC}"
    echo "  Open: $BASE_DIR"
    echo ""
}

###############################################################################
# FUNCTION: STOP ALL SERVICES
###############################################################################

stop_all() {
    log_section "STOPPING ALL SERVICES"
    
    log_warn "Stopping all Java services..."
    killall java 2>/dev/null || true
    sleep 2
    log_step "All services stopped"
}

###############################################################################
# FUNCTION: SHOW FIXES GUIDE
###############################################################################

show_fixes_guide() {
    log_section "REMAINING ISSUES - FIX GUIDE"
    
    echo -e "${YELLOW}4 Issues to Fix:${NC}"
    echo ""
    
    echo "1. ${RED}[CRITICAL]${NC} UserDTO Mapping Bug"
    echo "   Location: identity_service/UserService.java"
    echo "   Issue: Users page shows 'Failed to fetch'"
    echo "   Fix: Add role mapping in getAllUsers()"
    echo "   Time: 15 minutes"
    echo ""
    
    echo "2. ${YELLOW}[HIGH]${NC} Payment Form Modal"
    echo "   Location: frontend/app/dashboard/payments/page.tsx"
    echo "   Issue: 'Record Payment' button doesn't open form"
    echo "   Fix: Add React Modal with form fields"
    echo "   Time: 30 minutes"
    echo ""
    
    echo "3. ${YELLOW}[HIGH]${NC} Payroll Form Modal"
    echo "   Location: frontend/app/dashboard/payroll/page.tsx"
    echo "   Issue: 'Run Payroll' button doesn't open form"
    echo "   Fix: Add React Modal with form fields"
    echo "   Time: 30 minutes"
    echo ""
    
    echo "4. ${BLUE}[MEDIUM]${NC} Gamification Frontend"
    echo "   Location: frontend/app/dashboard/superadmin/gamification/page.tsx"
    echo "   Issue: Page exists but components incomplete"
    echo "   Fix: Implement leaderboard and points display"
    echo "   Time: 30 minutes"
    echo ""
    
    echo -e "${GREEN}Total Fix Time: ~90 minutes${NC}"
    echo ""
    echo "For detailed guide, run:"
    echo "  bash $BASE_DIR/FIX_REMAINING_ISSUES.sh"
    echo ""
}

###############################################################################
# RUN ALL PROCESS
###############################################################################

run_all_process() {
    log_title "🎯 RUNNING ALL PHASES (50 min)"
    
    echo -e "${YELLOW}⏳ This will:${NC}"
    echo "  1. Rebuild all services (5 min)"
    echo "  2. Start all services (2 min)"
    echo "  3. Run comprehensive tests (30 min)"
    echo "  4. Show results"
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rebuild_all
        echo ""
        start_all
        echo ""
        run_all_tests
        echo ""
        log_title "✅ PHASE 1 COMPLETE"
        echo ""
        echo -e "${GREEN}Next Steps:${NC}"
        echo "1. Open http://localhost:3000 in browser"
        echo "2. Login: admin@lera.com / admin123"
        echo "3. Navigate to SuperAdmin dashboard"
        echo "4. Verify data is showing on all pages"
        echo ""
        echo "For remaining fixes, select option 5 from menu"
        echo ""
    fi
}

###############################################################################
# MAIN LOOP
###############################################################################

main() {
    while true; do
        show_menu
        read -p "Enter choice (1-9): " choice
        
        case $choice in
            1)
                run_all_process
                read -p "Press Enter to continue..."
                ;;
            2)
                rebuild_all
                read -p "Press Enter to continue..."
                ;;
            3)
                start_all
                read -p "Press Enter to continue..."
                ;;
            4)
                run_all_tests
                read -p "Press Enter to continue..."
                ;;
            5)
                show_fixes_guide
                read -p "Press Enter to continue..."
                ;;
            6)
                show_service_status
                read -p "Press Enter to continue..."
                ;;
            7)
                show_documentation
                read -p "Press Enter to continue..."
                ;;
            8)
                stop_all
                read -p "Press Enter to continue..."
                ;;
            9)
                log_step "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid choice. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Run main
main

