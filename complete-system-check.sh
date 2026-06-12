#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🔍 LERA ACADEMY - COMPLETE SYSTEM VERIFICATION"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
issues=0
warnings=0

echo "════════════════════════════════════════════════════════════════════════════"
echo "1️⃣  CHECKING POSTGRESQL DATABASE"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if PostgreSQL is running
if pg_isready -d lera >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    
    # Count tables
    table_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')
    
    if [ ! -z "$table_count" ]; then
        echo -e "${GREEN}✅ Connected to database 'lera'${NC}"
        echo -e "   Tables found: ${BLUE}$table_count${NC}"
        
        if [ "$table_count" != "41" ]; then
            echo -e "${YELLOW}⚠️  Expected 41 tables, found $table_count${NC}"
            ((warnings++))
        fi
        
        # List all tables
        echo ""
        echo "📋 All tables in database:"
        psql -d lera -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>/dev/null | while read -r table; do
            table=$(echo $table | tr -d ' ')
            if [ ! -z "$table" ]; then
                echo "   • $table"
            fi
        done
        
        # Check seed data
        echo ""
        echo "📊 Seed data verification:"
        user_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
        role_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ')
        permission_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM permissions;" 2>/dev/null | tr -d ' ')
        program_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM course_programs;" 2>/dev/null | tr -d ' ')
        center_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM centers;" 2>/dev/null | tr -d ' ')
        
        echo "   • Users: $user_count (Expected: 1)"
        echo "   • Roles: $role_count (Expected: 7)"
        echo "   • Permissions: $permission_count (Expected: 20)"
        echo "   • Course Programs: $program_count (Expected: 6)"
        echo "   • Centers: $center_count (Expected: 1)"
        
        # Verify admin user
        echo ""
        echo "👤 Admin user verification:"
        admin_email=$(psql -d lera -t -c "SELECT email FROM users WHERE email = 'admin@lera.com';" 2>/dev/null | tr -d ' ')
        if [ "$admin_email" = "admin@lera.com" ]; then
            echo -e "   ${GREEN}✅ Admin user exists (admin@lera.com)${NC}"
        else
            echo -e "   ${RED}❌ Admin user not found${NC}"
            ((issues++))
        fi
    else
        echo -e "${RED}❌ Could not query database${NC}"
        ((issues++))
    fi
else
    echo -e "${RED}❌ PostgreSQL is not running or database 'lera' does not exist${NC}"
    echo "   Please start PostgreSQL: brew services start postgresql@15"
    echo "   Or create database: createdb lera"
    ((issues++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "2️⃣  CHECKING BACKEND SERVICES"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

services=(
    "8080:Identity Service:identity_service"
    "8081:Academy Service:academy_service"
    "8082:Payment Service:payment_service"
    "8083:Payroll Service:payroll_service"
    "8084:Attendance Service:attendance_service"
    "8085:Connect Service:connect_service"
)

running_count=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r port name dir <<< "$service"
    
    # Check if port is in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        # Try to check health endpoint
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health 2>/dev/null)
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ $name (Port $port)${NC} - Running & Healthy"
            ((running_count++))
        else
            echo -e "${YELLOW}⚠️  $name (Port $port)${NC} - Port in use but health check failed"
            ((warnings++))
        fi
    else
        echo -e "${RED}❌ $name (Port $port)${NC} - Not running"
        echo "   Start: cd backend/$dir && mvn spring-boot:run"
        ((issues++))
    fi
done

echo ""
echo "Services Status: $running_count/$total_services running"

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "3️⃣  CHECKING BACKEND ENTITIES & REPOSITORIES"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

echo "📦 Backend entities found:"

# Identity Service
echo ""
echo "Identity Service (Port 8080):"
identity_entities=$(find /Users/rahulsharma/LERA_Group/backend/identity_service/src/main/java -name "*Entity.java" -o -name "User.java" -o -name "Role.java" -o -name "Permission.java" -o -name "Center.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $identity_entities"
ls /Users/rahulsharma/LERA_Group/backend/identity_service/src/main/java/com/lera/identity_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

# Academy Service
echo ""
echo "Academy Service (Port 8081):"
academy_entities=$(find /Users/rahulsharma/LERA_Group/backend/academy_service/src/main/java/com/lera/academy_service/entity -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $academy_entities"
ls /Users/rahulsharma/LERA_Group/backend/academy_service/src/main/java/com/lera/academy_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

# Payment Service
echo ""
echo "Payment Service (Port 8082):"
payment_entities=$(find /Users/rahulsharma/LERA_Group/backend/payment_service/src/main/java/com/lera/payment_service/entity -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $payment_entities"
ls /Users/rahulsharma/LERA_Group/backend/payment_service/src/main/java/com/lera/payment_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

# Attendance Service
echo ""
echo "Attendance Service (Port 8084):"
attendance_entities=$(find /Users/rahulsharma/LERA_Group/backend/attendance_service/src/main/java/com/lera/attendance_service/entity -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $attendance_entities"
ls /Users/rahulsharma/LERA_Group/backend/attendance_service/src/main/java/com/lera/attendance_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

# Connect Service
echo ""
echo "Connect Service (Port 8085):"
connect_entities=$(find /Users/rahulsharma/LERA_Group/backend/connect_service/src/main/java/com/lera/connect_service/entity -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $connect_entities"
ls /Users/rahulsharma/LERA_Group/backend/connect_service/src/main/java/com/lera/connect_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

# Payroll Service
echo ""
echo "Payroll Service (Port 8083):"
payroll_entities=$(find /Users/rahulsharma/LERA_Group/backend/payroll_service/src/main/java/com/lera/payroll_service/entity -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
echo "   Entities: $payroll_entities"
ls /Users/rahulsharma/LERA_Group/backend/payroll_service/src/main/java/com/lera/payroll_service/entity/*.java 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "4️⃣  CHECKING API CONTROLLERS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

echo "🔌 API Controllers found:"

for service_dir in identity_service academy_service payment_service payroll_service attendance_service connect_service; do
    controllers=$(find /Users/rahulsharma/LERA_Group/backend/$service_dir/src/main/java -name "*Controller.java" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$controllers" -gt 0 ]; then
        echo ""
        echo "$service_dir: $controllers controllers"
        find /Users/rahulsharma/LERA_Group/backend/$service_dir/src/main/java -name "*Controller.java" 2>/dev/null | xargs -n1 basename | sed 's/\.java$//' | sed 's/^/   • /'
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "5️⃣  CHECKING FRONTEND"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if frontend is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Next.js Frontend (Port 3000)${NC} - Running"
        echo "   URL: http://localhost:3000"
        ((running_count++))
    else
        echo -e "${YELLOW}⚠️  Frontend (Port 3000)${NC} - Port in use but not responding"
        ((warnings++))
    fi
else
    echo -e "${RED}❌ Frontend (Port 3000)${NC} - Not running"
    echo "   Start: cd frontend && npm run dev"
    ((issues++))
fi

# Check frontend structure
echo ""
echo "📁 Frontend structure:"
if [ -f "/Users/rahulsharma/LERA_Group/frontend/package.json" ]; then
    echo -e "   ${GREEN}✅ package.json found${NC}"
    
    # Check if node_modules exists
    if [ -d "/Users/rahulsharma/LERA_Group/frontend/node_modules" ]; then
        echo -e "   ${GREEN}✅ node_modules installed${NC}"
    else
        echo -e "   ${YELLOW}⚠️  node_modules not found - run: npm install${NC}"
        ((warnings++))
    fi
else
    echo -e "   ${RED}❌ package.json not found${NC}"
    ((issues++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "6️⃣  DATABASE-TO-BACKEND MAPPING VERIFICATION"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

echo "🔗 Checking table-to-entity mapping:"

# Expected mappings
declare -A table_entity_map=(
    ["users"]="Identity Service"
    ["roles"]="Identity Service"
    ["permissions"]="Identity Service"
    ["centers"]="Identity Service"
    ["students"]="Academy Service"
    ["teachers"]="Academy Service"
    ["classes"]="Academy Service"
    ["course_programs"]="Academy Service"
    ["enrollments"]="Academy Service"
    ["blog_posts"]="Academy Service"
    ["testimonials"]="Academy Service"
    ["cms_settings"]="Academy Service"
    ["banners"]="Academy Service"
    ["attendance"]="Attendance Service"
    ["payments"]="Payment Service"
    ["payroll"]="Payroll Service"
    ["leads"]="Connect Service"
    ["lead_followups"]="Connect Service"
)

if pg_isready -d lera >/dev/null 2>&1; then
    for table in "${!table_entity_map[@]}"; do
        exists=$(psql -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" 2>/dev/null | tr -d ' ')
        if [ "$exists" = "1" ]; then
            echo -e "   ${GREEN}✅${NC} $table → ${table_entity_map[$table]}"
        else
            echo -e "   ${RED}❌${NC} $table → Missing in database"
            ((issues++))
        fi
    done
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Database status
if pg_isready -d lera >/dev/null 2>&1; then
    echo -e "Database: ${GREEN}✅ Connected${NC} ($table_count tables)"
else
    echo -e "Database: ${RED}❌ Not Connected${NC}"
fi

# Services status
echo "Backend Services: $running_count/$total_services running"

# Frontend status
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "Frontend: ${GREEN}✅ Running${NC}"
else
    echo -e "Frontend: ${RED}❌ Not Running${NC}"
fi

echo ""
echo "Issues Found: $issues"
echo "Warnings: $warnings"

echo ""
echo "════════════════════════════════════════════════════════════════════════════"

if [ $issues -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL - NO ISSUES FOUND!${NC}"
elif [ $issues -eq 0 ]; then
    echo -e "${YELLOW}⚠️  SYSTEM OPERATIONAL WITH $warnings WARNINGS${NC}"
else
    echo -e "${RED}❌ SYSTEM HAS $issues ISSUES AND $warnings WARNINGS${NC}"
    echo ""
    echo "📋 Recommended Actions:"
    
    if ! pg_isready -d lera >/dev/null 2>&1; then
        echo "   1. Start PostgreSQL: brew services start postgresql@15"
        echo "   2. Verify database: psql -d lera -c '\dt'"
    fi
    
    if [ $running_count -lt $total_services ]; then
        echo "   3. Start backend services (see output above for commands)"
    fi
    
    if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   4. Start frontend: cd frontend && npm run dev"
    fi
fi

echo "════════════════════════════════════════════════════════════════════════════"
echo ""
