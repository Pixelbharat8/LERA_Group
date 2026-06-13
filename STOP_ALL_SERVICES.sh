#!/bin/bash

##############################################################################
# LERA Academy - Stop All Services Script
##############################################################################

echo "🛑 Stopping All LERA Academy Services..."
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop backend services (Java/Maven)
if pgrep -f "spring-boot:run" > /dev/null; then
    echo "${YELLOW}🔹 Stopping backend services...${NC}"
    pkill -f "spring-boot:run"
    sleep 2
    echo "${GREEN}✅ Backend services stopped${NC}"
else
    echo "${GREEN}✅ No backend services running${NC}"
fi

# Free backend ports (Spring Boot / stray listeners)
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089; do
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "${YELLOW}🔹 Stopping process on port $port...${NC}"
        kill $pids 2>/dev/null || true
        sleep 1
    fi
done

# Stop frontend — Next.js may fall back to :3001 / :3002 when :3000 is busy
for port in 3000 3001 3002; do
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "${YELLOW}🔹 Stopping process on port $port...${NC}"
        kill $pids 2>/dev/null || true
        sleep 1
    fi
done

if pgrep -f "next-server" >/dev/null 2>&1 || pgrep -f "next dev" >/dev/null 2>&1; then
    echo "${YELLOW}🔹 Stopping remaining Next.js processes...${NC}"
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    sleep 1
fi

echo "${GREEN}✅ Frontend / Next.js ports cleared${NC}"

# Optional: Stop PostgreSQL (commented out by default)
# echo "${YELLOW}🔹 Stopping PostgreSQL...${NC}"
# brew services stop postgresql@15
# echo "${GREEN}✅ PostgreSQL stopped${NC}"

echo ""
echo "${GREEN}✅ All services stopped${NC}"
echo ""
echo "To start services again, run:"
echo "  ./start-lera.sh"
echo ""
