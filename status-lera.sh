#!/bin/zsh
# ============================================================
# LERA GROUP - Check Service Status
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo "${CYAN}║           LERA GROUP - Service Status                      ║${NC}"
echo "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    # Check if port is in use
    pid=$(lsof -ti tcp:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo "   ${GREEN}✅ $name${NC} (port $port) - ${GREEN}RUNNING${NC} [PID: $pid]"
        else
            echo "   ${YELLOW}⏳ $name${NC} (port $port) - ${YELLOW}STARTING${NC} [PID: $pid]"
        fi
    else
        echo "   ${RED}❌ $name${NC} (port $port) - ${RED}STOPPED${NC}"
    fi
}

echo "${YELLOW}🔍 Checking Services...${NC}"
echo ""

check_service "Frontend (Next.js)  " "http://localhost:3000" 3000
check_service "Identity Service    " "http://localhost:8080/actuator/health" 8080
check_service "Academy Service     " "http://localhost:8081/actuator/health" 8081
check_service "Payment Service     " "http://localhost:8082/actuator/health" 8082
check_service "Attendance Service  " "http://localhost:8083/actuator/health" 8083
check_service "Payroll Service     " "http://localhost:8084/actuator/health" 8084
check_service "Connect Service     " "http://localhost:8086/actuator/health" 8086
check_service "AI Gateway          " "http://localhost:8087/actuator/health" 8087
check_service "Rule Engine         " "http://localhost:8088/actuator/health" 8088

echo ""

# Check PostgreSQL
echo "${YELLOW}🐘 Database Status:${NC}"
if pg_isready -q 2>/dev/null; then
    echo "   ${GREEN}✅ PostgreSQL - RUNNING${NC}"
else
    echo "   ${RED}❌ PostgreSQL - STOPPED${NC}"
fi

echo ""
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
