#!/bin/bash
########################################################
#  LERA GROUP – Stop All Services
########################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🛑  LERA GROUP – STOP ALL  🛑         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Stop backend services (Spring Boot on ports 8081-8089)
for PORT in 8081 8082 8083 8084 8085 8086 8087 8088 8089; do
  PID=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    kill $PID 2>/dev/null
    echo -e "${RED}  ✖ Stopped service on port $PORT (PID $PID)${NC}"
  fi
done

# Kill leftover Maven/Spring processes
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "mvn.*spring-boot" 2>/dev/null || true

# Stop frontend — Next may bind :3001 / :3002 when :3000 is busy
for PORT in 3000 3001 3002; do
  PID=$(lsof -ti :$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    kill $PID 2>/dev/null
    echo -e "${RED}  ✖ Stopped process on port $PORT (PID $PID)${NC}"
  fi
done
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

# Stop database (Docker)
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$ROOT_DIR/database/docker-compose.yml" ]; then
  cd "$ROOT_DIR/database"
  if docker compose version &>/dev/null; then
    docker compose down 2>/dev/null
    echo -e "${RED}  ✖ Stopped PostgreSQL container (docker compose)${NC}"
  elif command -v docker-compose &>/dev/null; then
    docker-compose down 2>/dev/null
    echo -e "${RED}  ✖ Stopped PostgreSQL container (docker-compose)${NC}"
  fi
fi

echo ""
echo -e "${GREEN}  ✅ All services stopped.${NC}"
echo ""
