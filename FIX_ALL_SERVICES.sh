#!/bin/bash

# ================================================
# LERA Academy - Fix All Services Script
# ================================================
# This script cleans, builds, and verifies all services
# Run from: /Users/rahulsharma/LERA_Group
# ================================================

set -e

echo ""
echo "🔧 LERA Academy - Fixing All Services"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Services to build
SERVICES=(
    "identity_service:8080"
    "academy_service:8081"
    "payment_service:8082"
    "payroll_service:8083"
    "attendance_service:8084"
    "connect_service:8085"
)

echo "📂 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Check PostgreSQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CHECKING DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if pg_isready -d lera >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting PostgreSQL...${NC}"
    brew services start postgresql@15
    sleep 3
fi
echo ""

# Step 2: Clean and Build Each Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  BUILDING ALL SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

build_success=0
build_failed=0

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r service_name port <<< "$service_info"
    service_dir="$SCRIPT_DIR/backend/$service_name"
    
    echo ""
    echo "📦 Building $service_name..."
    
    if [ ! -d "$service_dir" ]; then
        echo -e "${RED}❌ Directory not found: $service_dir${NC}"
        ((build_failed++))
        continue
    fi
    
    cd "$service_dir"
    
    # Clean and compile (skip tests for speed)
    if mvn clean compile -DskipTests -q 2>/dev/null; then
        echo -e "${GREEN}✅ $service_name compiled successfully${NC}"
        ((build_success++))
    else
        echo -e "${RED}❌ $service_name failed to compile${NC}"
        echo "   Running with verbose output..."
        mvn clean compile -DskipTests 2>&1 | tail -20
        ((build_failed++))
    fi
    
    cd "$SCRIPT_DIR"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 BUILD SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Successful: $build_success${NC}"
if [ $build_failed -gt 0 ]; then
    echo -e "${RED}❌ Failed: $build_failed${NC}"
fi
echo ""

# Step 3: Instructions
if [ $build_failed -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 ALL SERVICES BUILT SUCCESSFULLY!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 To start the services, run these in separate terminals:"
    echo ""
    echo "   Terminal 1 (Identity - MUST START FIRST):"
    echo "   cd $SCRIPT_DIR/backend/identity_service && mvn spring-boot:run"
    echo ""
    echo "   Terminal 2 (Academy):"
    echo "   cd $SCRIPT_DIR/backend/academy_service && mvn spring-boot:run"
    echo ""
    echo "   Terminal 3 (Frontend):"
    echo "   cd $SCRIPT_DIR/frontend && npm run dev"
    echo ""
    echo "   Then open: http://localhost:3000"
    echo "   Login: admin@lera.com / admin123"
    echo ""
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${RED}⚠️  SOME SERVICES FAILED TO BUILD${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Run individual builds to see detailed errors:"
    echo "   cd backend/<service_name> && mvn clean compile"
fi
