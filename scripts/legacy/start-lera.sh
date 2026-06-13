#!/bin/zsh
# ============================================================
# LERA GROUP - Complete System Startup Script (All-in-One)
# ============================================================
# This script handles EVERYTHING:
# 1. Kills all existing services (frontend + backend)
# 2. Checks and starts PostgreSQL database
# 3. Creates database and user if needed
# 4. Initializes database schema if needed
# 5. Starts all 9 backend microservices
# 6. Starts the Next.js frontend
# 7. Health checks all services
# ============================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="/Users/rahulsharma/LERA_Group"

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="lera"
DB_USER="lera"
DB_PASSWORD="lera123"

# Service ports (aligned with backend application.properties & frontend next.config.js)
FRONTEND_PORT=3000
IDENTITY_PORT=8081
ACADEMY_PORT=8082
PAYMENT_PORT=8083
PAYROLL_PORT=8084
ATTENDANCE_PORT=8085
CONNECT_PORT=8086
AI_GATEWAY_PORT=8087
RULE_ENGINE_PORT=8088
SOCIAL_MEDIA_PORT=8089
LIBRARY_PORT=8090
TRANSPORT_PORT=8091
HOSTEL_PORT=8092
BOOKSTORE_PORT=8093

# All ports to kill
ALL_PORTS="3000 3001 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090 8091 8092 8093"

echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║     LERA GROUP - Complete System Startup (All-in-One)     ║${NC}"
echo "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
echo "${CYAN}║  Database + Backend (14 Services) + Frontend + Health Check ║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# STEP 1: Kill all existing services
# ============================================================
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}📛 STEP 1: Killing existing services...${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Kill Spring Boot processes
echo "   Stopping Spring Boot services..."
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "org.springframework.boot" 2>/dev/null

# Kill Next.js / Node processes
echo "   Stopping Next.js frontend..."
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "node.*next" 2>/dev/null

# Kill processes on specific ports
echo "   Freeing up ports..."
for port in $ALL_PORTS; do
    pid=$(lsof -ti tcp:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
    fi
done

# Kill any remaining Java processes related to LERA
pkill -f "java.*identity_service" 2>/dev/null
pkill -f "java.*academy_service" 2>/dev/null
pkill -f "java.*payment_service" 2>/dev/null
pkill -f "java.*payroll_service" 2>/dev/null
pkill -f "java.*attendance_service" 2>/dev/null
pkill -f "java.*connect_service" 2>/dev/null
pkill -f "java.*ai_gateway" 2>/dev/null
pkill -f "java.*rule_engine" 2>/dev/null
pkill -f "java.*social_media_service" 2>/dev/null
pkill -f "java.*library_service" 2>/dev/null
pkill -f "java.*transport_service" 2>/dev/null
pkill -f "java.*hostel_service" 2>/dev/null
pkill -f "java.*bookstore_service" 2>/dev/null

sleep 2
echo "${GREEN}   ✅ All services stopped${NC}"
echo ""

# ============================================================
# STEP 2: Start and Setup PostgreSQL Database
# ============================================================
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}🐘 STEP 2: Setting up PostgreSQL Database...${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "${RED}   ❌ PostgreSQL is not installed!${NC}"
    echo "${YELLOW}   Please install: brew install postgresql@14${NC}"
    exit 1
fi
echo "${GREEN}   ✅ PostgreSQL is installed${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo "   Starting PostgreSQL..."
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
    fi
    sleep 3
fi

if pg_isready -q 2>/dev/null; then
    echo "${GREEN}   ✅ PostgreSQL is running${NC}"
else
    echo "${RED}   ❌ PostgreSQL is not running. Please start it manually.${NC}"
    echo "${YELLOW}   Try: brew services start postgresql@14${NC}"
    exit 1
fi

# Create user and database if needed
echo "   Setting up database user and schema..."

# Create user (ignore error if exists)
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null
psql postgres -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null
psql postgres -c "ALTER USER $DB_USER WITH SUPERUSER;" 2>/dev/null

# Create database (ignore error if exists)
psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null

# Test connection
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "${GREEN}   ✅ Database connection successful${NC}"
    echo "      Host: $DB_HOST:$DB_PORT"
    echo "      Database: $DB_NAME"
    echo "      User: $DB_USER"
else
    echo "${RED}   ❌ Database connection failed!${NC}"
    echo "${YELLOW}   Please check PostgreSQL configuration${NC}"
    exit 1
fi

# Initialize schema if init.sql exists and tables don't exist
INIT_SQL="$PROJECT_ROOT/database/init/init.sql"
if [ -f "$INIT_SQL" ]; then
    # Check if tables exist
    TABLE_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$TABLE_COUNT" -lt 10 ] 2>/dev/null; then
        echo "   Initializing database schema..."
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$INIT_SQL" > /dev/null 2>&1
        echo "${GREEN}   ✅ Database schema initialized${NC}"
    else
        echo "${GREEN}   ✅ Database schema already exists ($TABLE_COUNT tables)${NC}"
    fi
fi

echo ""

# ============================================================
# STEP 3: Create log directory
# ============================================================
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p $LOG_DIR
echo "   📁 Log directory: $LOG_DIR"
echo ""

# ============================================================
# STEP 4: Start Backend Services (9 Microservices)
# ============================================================
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}☕ STEP 3: Starting Backend Services (14 Microservices)...${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    echo "   🚀 Starting $service_name (port $port)..."
    cd "$PROJECT_ROOT/backend/$service_dir"
    nohup mvn spring-boot:run -DskipTests > "$LOG_DIR/${service_name}.log" 2>&1 &
    echo "      PID: $!"
}

# Start Identity Service FIRST (handles authentication)
start_service "identity_service" "identity_service" $IDENTITY_PORT
echo "${BLUE}   ⏳ Waiting for Identity Service to initialize (15s)...${NC}"
sleep 15

# Start other services in parallel
start_service "academy_service" "academy_service" $ACADEMY_PORT
start_service "payment_service" "payment_service" $PAYMENT_PORT
start_service "payroll_service" "payroll_service" $PAYROLL_PORT
start_service "attendance_service" "attendance_service" $ATTENDANCE_PORT
start_service "connect_service" "connect_service" $CONNECT_PORT
start_service "ai_gateway" "ai_gateway" $AI_GATEWAY_PORT
start_service "rule_engine" "rule_engine" $RULE_ENGINE_PORT
start_service "social_media_service" "social_media_service" $SOCIAL_MEDIA_PORT
start_service "library_service" "library_service" $LIBRARY_PORT
start_service "transport_service" "transport_service" $TRANSPORT_PORT
start_service "hostel_service" "hostel_service" $HOSTEL_PORT
start_service "bookstore_service" "bookstore_service" $BOOKSTORE_PORT

echo ""
echo "${BLUE}   ⏳ Waiting for services to initialize (60s)...${NC}"
sleep 60
echo "${GREEN}   ✅ Backend services started${NC}"
echo ""

# ============================================================
# STEP 5: Start Frontend (Next.js)
# ============================================================
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}⚛️  STEP 4: Starting Frontend (Next.js)...${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   📦 Installing dependencies (first time setup)..."
    npm install --silent 2>/dev/null
else
    echo "   📦 Dependencies already installed"
fi

echo "   🚀 Starting Next.js on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "      PID: $FRONTEND_PID"

sleep 8
echo "${GREEN}   ✅ Frontend started${NC}"
echo ""

# ============================================================
# STEP 6: Health Check All Services
# ============================================================
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}🔍 STEP 5: Checking Service Health...${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RUNNING_COUNT=0
TOTAL_COUNT=14

check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo "   ${GREEN}✅ $name (port $port) - RUNNING${NC}"
        ((RUNNING_COUNT++))
        return 0
    else
        echo "   ${RED}❌ $name (port $port) - NOT READY${NC}"
        return 1
    fi
}

check_service "Frontend" "http://localhost:$FRONTEND_PORT" $FRONTEND_PORT
check_service "Identity Service" "http://localhost:$IDENTITY_PORT/actuator/health" $IDENTITY_PORT
check_service "Academy Service" "http://localhost:$ACADEMY_PORT/actuator/health" $ACADEMY_PORT
check_service "Payment Service" "http://localhost:$PAYMENT_PORT/actuator/health" $PAYMENT_PORT
check_service "Payroll Service" "http://localhost:$PAYROLL_PORT/actuator/health" $PAYROLL_PORT
check_service "Attendance Service" "http://localhost:$ATTENDANCE_PORT/actuator/health" $ATTENDANCE_PORT
check_service "Connect Service" "http://localhost:$CONNECT_PORT/actuator/health" $CONNECT_PORT
check_service "AI Gateway" "http://localhost:$AI_GATEWAY_PORT/actuator/health" $AI_GATEWAY_PORT
check_service "Rule Engine" "http://localhost:$RULE_ENGINE_PORT/actuator/health" $RULE_ENGINE_PORT
check_service "Social Media Service" "http://localhost:$SOCIAL_MEDIA_PORT/actuator/health" $SOCIAL_MEDIA_PORT
check_service "Library Service" "http://localhost:$LIBRARY_PORT/actuator/health" $LIBRARY_PORT
check_service "Transport Service" "http://localhost:$TRANSPORT_PORT/actuator/health" $TRANSPORT_PORT
check_service "Hostel Service" "http://localhost:$HOSTEL_PORT/actuator/health" $HOSTEL_PORT
check_service "Bookstore Service" "http://localhost:$BOOKSTORE_PORT/actuator/health" $BOOKSTORE_PORT

echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================
if [ $RUNNING_COUNT -eq $TOTAL_COUNT ]; then
    echo "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo "${GREEN}║          🎉 ALL SERVICES RUNNING SUCCESSFULLY! 🎉          ║${NC}"
    echo "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
else
    echo "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo "${YELLOW}║     ⚠️  STARTUP COMPLETE ($RUNNING_COUNT/$TOTAL_COUNT services running)     ║${NC}"
    echo "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo "${MAGENTA}┌────────────────────────────────────────────────────────────┐${NC}"
echo "${MAGENTA}│                    📍 ACCESS POINTS                        │${NC}"
echo "${MAGENTA}├────────────────────────────────────────────────────────────┤${NC}"
echo "${MAGENTA}│${NC}  🌐 Frontend:             ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo "${MAGENTA}│${NC}  🔐 Identity Service:     ${BLUE}http://localhost:$IDENTITY_PORT${NC}"
echo "${MAGENTA}│${NC}  📚 Academy Service:      ${BLUE}http://localhost:$ACADEMY_PORT${NC}"
echo "${MAGENTA}│${NC}  💳 Payment Service:      ${BLUE}http://localhost:$PAYMENT_PORT${NC}"
echo "${MAGENTA}│${NC}  💰 Payroll Service:      ${BLUE}http://localhost:$PAYROLL_PORT${NC}"
echo "${MAGENTA}│${NC}  📋 Attendance Service:   ${BLUE}http://localhost:$ATTENDANCE_PORT${NC}"
echo "${MAGENTA}│${NC}  🔗 Connect Service:      ${BLUE}http://localhost:$CONNECT_PORT${NC}"
echo "${MAGENTA}│${NC}  🤖 AI Gateway:           ${BLUE}http://localhost:$AI_GATEWAY_PORT${NC}"
echo "${MAGENTA}│${NC}  ⚙️  Rule Engine:          ${BLUE}http://localhost:$RULE_ENGINE_PORT${NC}"
echo "${MAGENTA}│${NC}  📱 Social Media Service: ${BLUE}http://localhost:$SOCIAL_MEDIA_PORT${NC}"
echo "${MAGENTA}│${NC}  📚 Library Service:      ${BLUE}http://localhost:$LIBRARY_PORT${NC}"
echo "${MAGENTA}│${NC}  🚌 Transport Service:    ${BLUE}http://localhost:$TRANSPORT_PORT${NC}"
echo "${MAGENTA}│${NC}  🏠 Hostel Service:       ${BLUE}http://localhost:$HOSTEL_PORT${NC}"
echo "${MAGENTA}│${NC}  🛒 Bookstore Service:    ${BLUE}http://localhost:$BOOKSTORE_PORT${NC}"
echo "${MAGENTA}└────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
echo "${CYAN}│                    🗄️  DATABASE INFO                       │${NC}"
echo "${CYAN}├────────────────────────────────────────────────────────────┤${NC}"
echo "${CYAN}│${NC}  Host:     $DB_HOST:$DB_PORT"
echo "${CYAN}│${NC}  Database: $DB_NAME"
echo "${CYAN}│${NC}  User:     $DB_USER"
echo "${CYAN}│${NC}  Password: $DB_PASSWORD"
echo "${CYAN}│${NC}  JDBC URL: jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME"
echo "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo "${GREEN}📂 Log Files:${NC}"
echo "   • Frontend:    $LOG_DIR/frontend.log"
echo "   • Backend:     $LOG_DIR/<service_name>.log"
echo ""
echo "${YELLOW}💡 Useful Commands:${NC}"
echo "   • View logs:     tail -f $LOG_DIR/<service>.log"
echo "   • Stop all:      pkill -f 'spring-boot:run' && pkill -f 'next dev'"
echo "   • Check DB:      psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
echo "   • Restart:       ./start-lera.sh"
echo ""
