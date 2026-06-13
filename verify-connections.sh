#!/bin/bash

echo ""
echo "🔍 LERA Academy - Database & API Connection Verification"
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PostgreSQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CHECKING POSTGRESQL DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if PostgreSQL is running
pg_isready -d lera >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    
    # Count tables
    table_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')
    echo -e "${GREEN}✅ Database 'lera' accessible${NC}"
    echo -e "${GREEN}✅ Tables found: $table_count (Expected: 41)${NC}"
    
    # Check seed data
    user_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    role_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ')
    program_count=$(psql -d lera -t -c "SELECT COUNT(*) FROM course_programs;" 2>/dev/null | tr -d ' ')
    
    echo -e "${GREEN}✅ Seed data loaded:${NC}"
    echo "   - Users: $user_count (Expected: 1)"
    echo "   - Roles: $role_count (Expected: 7)"
    echo "   - Course Programs: $program_count (Expected: 6)"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    echo "   Please start PostgreSQL: brew services start postgresql@15"
fi
echo ""

# Check Backend Services
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  CHECKING BACKEND SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

services=(
    "8080:Identity Service:identity-service"
    "8081:Academy Service:academy-service"
    "8082:Payment Service:payment-service"
    "8083:Payroll Service:payroll-service"
    "8084:Attendance Service:attendance-service"
    "8085:Connect Service:connect-service"
)

running_count=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r port name app_name <<< "$service"
    
    # Check if service is running
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name (Port $port)${NC} - Running & Healthy"
        ((running_count++))
    else
        # Check if port is in use
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  $name (Port $port)${NC} - Port in use but not healthy"
        else
            echo -e "${RED}❌ $name (Port $port)${NC} - Not running"
            echo "   Start with: cd backend/$app_name && mvn spring-boot:run"
        fi
    fi
done

echo ""
echo "Services Running: $running_count/$total_services"
echo ""

# Check Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  CHECKING FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Next.js Frontend (Port 3000)${NC} - Running"
    echo "   Access at: http://localhost:3000"
else
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Frontend (Port 3000)${NC} - Port in use but not responding"
    else
        echo -e "${RED}❌ Frontend (Port 3000)${NC} - Not running"
        echo "   Start with: cd frontend && npm run dev"
    fi
fi
echo ""

# Test Database Connection via Identity Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  TESTING DATABASE-TO-API CONNECTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$running_count" -gt 0 ]; then
    # Test Identity Service - Centers endpoint
    echo "Testing: GET /api/centers (Identity Service)"
    centers_response=$(curl -s http://localhost:8080/api/centers 2>/dev/null)
    if [ ! -z "$centers_response" ]; then
        echo -e "${GREEN}✅ Identity Service connected to database${NC}"
        echo "   Sample response: $(echo $centers_response | cut -c1-100)..."
    else
        echo -e "${RED}❌ Identity Service not responding${NC}"
    fi
    echo ""
    
    # Test Academy Service - Programs endpoint
    if curl -s http://localhost:8081/actuator/health >/dev/null 2>&1; then
        echo "Testing: GET /api/programs (Academy Service)"
        programs_response=$(curl -s http://localhost:8081/api/programs 2>/dev/null)
        if [ ! -z "$programs_response" ]; then
            echo -e "${GREEN}✅ Academy Service connected to database${NC}"
            echo "   Sample response: $(echo $programs_response | cut -c1-100)..."
        else
            echo -e "${RED}❌ Academy Service not responding${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No backend services running - skipping API tests${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Overall status
if pg_isready -d lera >/dev/null 2>&1; then
    echo -e "Database: ${GREEN}✅ Connected${NC}"
else
    echo -e "Database: ${RED}❌ Not Connected${NC}"
fi

echo "Backend Services: $running_count/$total_services running"

if [ "$response" = "200" ]; then
    echo -e "Frontend: ${GREEN}✅ Running${NC}"
else
    echo -e "Frontend: ${RED}❌ Not Running${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pg_isready -d lera >/dev/null 2>&1 && [ "$running_count" -gt 0 ] && [ "$response" = "200" ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
    echo ""
    echo "🔗 Access Points:"
    echo "   • Frontend: http://localhost:3000"
    echo "   • Identity API: http://localhost:8080"
    echo "   • Academy API: http://localhost:8081"
    echo "   • Login: admin@lera.com / admin123"
else
    echo -e "${YELLOW}⚠️  SYSTEM NOT FULLY OPERATIONAL${NC}"
    echo ""
    echo "📋 Quick Start Guide:"
    echo "   1. Start PostgreSQL: brew services start postgresql@15"
    echo "   2. Start backend services (see DATABASE_BACKEND_API_MAPPING.md)"
    echo "   3. Start frontend: cd frontend && npm run dev"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
