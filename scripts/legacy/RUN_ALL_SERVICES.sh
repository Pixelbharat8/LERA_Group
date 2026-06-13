#!/bin/bash

##############################################################################
# LERA Academy - Complete Service Startup Script
# This script starts all services: Database, Backend Services, and Frontend
##############################################################################

set -e  # Exit on error

echo "🚀 LERA Academy - Starting All Services"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/rahulsharma/LERA_Group"

##############################################################################
# 1. CHECK PREREQUISITES
##############################################################################

echo "${BLUE}📋 Checking Prerequisites...${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    echo "${RED}❌ Java is not installed${NC}"
    exit 1
else
    echo "${GREEN}✅ Java: $(java -version 2>&1 | head -1)${NC}"
fi

# Check Maven
if ! command -v mvn &> /dev/null; then
    echo "${RED}❌ Maven is not installed${NC}"
    exit 1
else
    echo "${GREEN}✅ Maven: $(mvn -version | head -1)${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    echo "${GREEN}✅ Node.js: $(node -v)${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "${RED}❌ npm is not installed${NC}"
    exit 1
else
    echo "${GREEN}✅ npm: $(npm -v)${NC}"
fi

echo ""

##############################################################################
# 2. CHECK & START POSTGRESQL
##############################################################################

echo "${BLUE}🗄️  Checking PostgreSQL...${NC}"

if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "${GREEN}✅ PostgreSQL is already running${NC}"
else
    echo "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    brew services start postgresql@15
    sleep 3
    
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

# Verify database exists
if psql -h localhost -U lera -d lera -c '\q' 2>/dev/null; then
    echo "${GREEN}✅ Database 'lera' is accessible${NC}"
else
    echo "${RED}❌ Database 'lera' is not accessible${NC}"
    echo "   Run: psql postgres -c \"CREATE DATABASE lera;\""
    exit 1
fi

echo ""

##############################################################################
# 3. CLEAN UP OLD PROCESSES
##############################################################################

echo "${BLUE}🧹 Cleaning up old processes...${NC}"

# Kill Java processes (backend services)
if pgrep -f "spring-boot:run" > /dev/null; then
    echo "${YELLOW}   Stopping existing backend services...${NC}"
    pkill -f "spring-boot:run" || true
    sleep 2
fi

# Kill Node.js processes (frontend)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "${YELLOW}   Stopping existing frontend on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 || true
    sleep 1
fi

echo "${GREEN}✅ Cleanup complete${NC}"
echo ""

##############################################################################
# 4. START BACKEND SERVICES
##############################################################################

echo "${BLUE}☕ Starting Backend Services...${NC}"
echo ""

# Create logs directory
mkdir -p "$BASE_DIR/logs"

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local dir="$BASE_DIR/backend/$service_name"
    local log_file="$BASE_DIR/logs/${service_name}.log"
    
    if [ -d "$dir" ]; then
        echo "${BLUE}🔹 Starting $service_name on port $port...${NC}"
        cd "$dir"
        
        # Start service in background
        nohup mvn spring-boot:run -DskipTests > "$log_file" 2>&1 &
        local pid=$!
        
        echo "   PID: $pid"
        echo "   Log: $log_file"
        echo ""
    else
        echo "${RED}❌ Directory not found: $dir${NC}"
    fi
}

# Start Identity Service
start_service "identity_service" 8080
sleep 8  # Wait for identity service to fully start

# Start Academy Service  
start_service "academy_service" 8081
sleep 8  # Wait for academy service to fully start

echo "${GREEN}✅ Backend services started${NC}"
echo ""

##############################################################################
# 5. START FRONTEND
##############################################################################

echo "${BLUE}⚛️  Starting Frontend...${NC}"
echo ""

cd "$BASE_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
fi

# Start frontend in background
echo "${BLUE}🔹 Starting Next.js dev server on port 3000...${NC}"
nohup npm run dev -- --port 3000 > "$BASE_DIR/logs/frontend.log" 2>&1 &
local frontend_pid=$!

echo "   PID: $frontend_pid"
echo "   Log: $BASE_DIR/logs/frontend.log"
echo ""

sleep 5

echo "${GREEN}✅ Frontend started${NC}"
echo ""

##############################################################################
# 6. VERIFY SERVICES
##############################################################################

echo "${BLUE}🔍 Verifying Services...${NC}"
echo ""

# Wait a bit for services to initialize
sleep 5

# Check Identity Service
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health | grep -q "200"; then
    echo "${GREEN}✅ Identity Service (8080): Running${NC}"
else
    echo "${RED}❌ Identity Service (8080): Not responding${NC}"
fi

# Check Academy Service
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/students | grep -q "200"; then
    echo "${GREEN}✅ Academy Service (8081): Running${NC}"
else
    echo "${RED}❌ Academy Service (8081): Not responding${NC}"
fi

# Check Frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "${GREEN}✅ Frontend (3000): Running${NC}"
else
    echo "${RED}❌ Frontend (3000): Not responding${NC}"
fi

echo ""

##############################################################################
# 7. DISPLAY STATUS
##############################################################################

echo "════════════════════════════════════════════════════════════"
echo "${GREEN}🎉 All Services Started Successfully!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "${BLUE}📊 Service URLs:${NC}"
echo "   • Frontend:        ${GREEN}http://localhost:3000${NC}"
echo "   • Identity API:    ${GREEN}http://localhost:8080${NC}"
echo "   • Academy API:     ${GREEN}http://localhost:8081${NC}"
echo ""
echo "${BLUE}🔐 Login Credentials:${NC}"
echo "   • Email:    ${GREEN}admin@lera.com${NC}"
echo "   • Password: ${GREEN}admin123${NC}"
echo ""
echo "${BLUE}📝 Log Files:${NC}"
echo "   • Identity:  $BASE_DIR/logs/identity_service.log"
echo "   • Academy:   $BASE_DIR/logs/academy_service.log"
echo "   • Frontend:  $BASE_DIR/logs/frontend.log"
echo ""
echo "${BLUE}🛠️  Useful Commands:${NC}"
echo "   • View logs:       tail -f logs/*.log"
echo "   • Stop services:   ./STOP_ALL_SERVICES.sh"
echo "   • Check status:    ./CHECK_SERVICES.sh"
echo ""
echo "${YELLOW}⚠️  To stop all services, run:${NC}"
echo "   pkill -f 'spring-boot:run'"
echo "   lsof -ti:3000 | xargs kill -9"
echo ""
echo "${GREEN}✨ Open your browser: http://localhost:3000/auth/login${NC}"
echo "════════════════════════════════════════════════════════════"
