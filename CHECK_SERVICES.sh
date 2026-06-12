#!/bin/bash

##############################################################################
# LERA Academy - Check Service Status Script
##############################################################################

echo "🔍 Checking LERA Academy Service Status..."
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# 1. CHECK DATABASE
##############################################################################

echo "${BLUE}🗄️  Database (PostgreSQL):${NC}"

if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "${GREEN}   ✅ PostgreSQL is running on port 5432${NC}"
    
    # Check if database is accessible
    if psql -h localhost -U lera -d lera -c '\q' 2>/dev/null; then
        echo "${GREEN}   ✅ Database 'lera' is accessible${NC}"
        
        # Get table count
        table_count=$(psql -h localhost -U lera -d lera -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
        echo "${GREEN}   ✅ Tables in database: $table_count${NC}"
    else
        echo "${RED}   ❌ Database 'lera' is not accessible${NC}"
    fi
else
    echo "${RED}   ❌ PostgreSQL is not running${NC}"
fi

echo ""

##############################################################################
# 2. CHECK BACKEND SERVICES
##############################################################################

echo "${BLUE}☕ Backend Services:${NC}"

# Identity Service (8080)
echo -n "   Identity Service (8080): "
if lsof -ti:8080 > /dev/null 2>&1; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        echo "${GREEN}✅ Running & Healthy${NC}"
    else
        echo "${YELLOW}⚠️  Running but not responding (HTTP $http_code)${NC}"
    fi
else
    echo "${RED}❌ Not running${NC}"
fi

# Academy Service (8081)
echo -n "   Academy Service (8081): "
if lsof -ti:8081 > /dev/null 2>&1; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/students 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        echo "${GREEN}✅ Running & Healthy${NC}"
    else
        echo "${YELLOW}⚠️  Running but not responding (HTTP $http_code)${NC}"
    fi
else
    echo "${RED}❌ Not running${NC}"
fi

# Payment Service (8082)
echo -n "   Payment Service (8082): "
if lsof -ti:8082 > /dev/null 2>&1; then
    echo "${GREEN}✅ Running${NC}"
else
    echo "${YELLOW}⚠️  Not running (optional)${NC}"
fi

# Payroll Service (8083)
echo -n "   Payroll Service (8083): "
if lsof -ti:8083 > /dev/null 2>&1; then
    echo "${GREEN}✅ Running${NC}"
else
    echo "${YELLOW}⚠️  Not running (optional)${NC}"
fi

# Attendance Service (8084)
echo -n "   Attendance Service (8084): "
if lsof -ti:8084 > /dev/null 2>&1; then
    echo "${GREEN}✅ Running${NC}"
else
    echo "${YELLOW}⚠️  Not running (optional)${NC}"
fi

# Connect Service (8085)
echo -n "   Connect Service (8085): "
if lsof -ti:8085 > /dev/null 2>&1; then
    echo "${GREEN}✅ Running${NC}"
else
    echo "${YELLOW}⚠️  Not running (optional)${NC}"
fi

echo ""

##############################################################################
# 3. CHECK FRONTEND
##############################################################################

echo "${BLUE}⚛️  Frontend (Next.js):${NC}"

echo -n "   Frontend (3000): "
if lsof -ti:3000 > /dev/null 2>&1; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        echo "${GREEN}✅ Running & Accessible${NC}"
    else
        echo "${YELLOW}⚠️  Running but not responding (HTTP $http_code)${NC}"
    fi
else
    echo "${RED}❌ Not running${NC}"
fi

echo ""

##############################################################################
# 4. TEST API ENDPOINTS
##############################################################################

echo "${BLUE}🧪 Testing API Endpoints:${NC}"

# Test login endpoint
echo -n "   POST /api/auth/login: "
login_response=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}' 2>/dev/null)

if echo "$login_response" | grep -q "token"; then
    echo "${GREEN}✅ Working (returns token)${NC}"
elif echo "$login_response" | grep -q "Invalid"; then
    echo "${YELLOW}⚠️  Endpoint working but credentials invalid${NC}"
else
    echo "${RED}❌ Not responding${NC}"
fi

# Test students endpoint
echo -n "   GET /api/students: "
students_response=$(curl -s http://localhost:8081/api/students 2>/dev/null)
if echo "$students_response" | grep -q "studentCode"; then
    student_count=$(echo "$students_response" | grep -o "studentCode" | wc -l)
    echo "${GREEN}✅ Working ($student_count students)${NC}"
else
    echo "${RED}❌ Not responding${NC}"
fi

echo ""

##############################################################################
# 5. PROCESS INFO
##############################################################################

echo "${BLUE}📊 Process Information:${NC}"

# Java processes
java_count=$(pgrep -f "spring-boot:run" | wc -l)
echo "   Java/Maven processes: $java_count"

# Node processes  
node_count=$(pgrep -f "node.*next-server" | wc -l)
echo "   Node.js processes: $node_count"

echo ""

##############################################################################
# 6. SUMMARY
##############################################################################

echo "════════════════════════════════════════════════════════════"
echo "${BLUE}📋 Quick Summary:${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""

# Count running services
running_count=0
total_core=3  # DB, Identity, Academy

if pg_isready -h localhost -p 5432 &> /dev/null; then ((running_count++)); fi
if lsof -ti:8080 > /dev/null 2>&1; then ((running_count++)); fi
if lsof -ti:8081 > /dev/null 2>&1; then ((running_count++)); fi

if [ $running_count -eq $total_core ]; then
    echo "${GREEN}✅ All core services are running ($running_count/$total_core)${NC}"
    echo ""
    echo "${BLUE}🌐 Access your application:${NC}"
    echo "   ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo "${BLUE}🔐 Login with:${NC}"
    echo "   Email:    admin@lera.com"
    echo "   Password: admin123"
elif [ $running_count -gt 0 ]; then
    echo "${YELLOW}⚠️  Some services are running ($running_count/$total_core)${NC}"
    echo ""
    echo "To start all services:"
    echo "   ./RUN_ALL_SERVICES.sh"
else
    echo "${RED}❌ No services are running${NC}"
    echo ""
    echo "To start all services:"
    echo "   ./RUN_ALL_SERVICES.sh"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
