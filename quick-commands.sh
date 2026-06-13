#!/bin/bash

# LERA Group - Quick Commands Reference
# Useful shortcuts for managing your Docker services

echo "=========================================="
echo "🚀 LERA Group Quick Commands"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_menu() {
    echo -e "${BLUE}📋 Available Commands:${NC}"
    echo ""
    echo "  1️⃣  - Check service status"
    echo "  2️⃣  - View all logs (live)"
    echo "  3️⃣  - View specific service logs"
    echo "  4️⃣  - Restart all services"
    echo "  5️⃣  - Restart specific service"
    echo "  6️⃣  - Stop all services"
    echo "  7️⃣  - Start all services"
    echo "  8️⃣  - Rebuild and restart everything"
    echo "  9️⃣  - Check Docker disk usage"
    echo "  🔟 - Access PostgreSQL CLI"
    echo "  1️⃣1️⃣ - Test frontend connection"
    echo "  1️⃣2️⃣ - Test gateway connection"
    echo "  0️⃣  - Exit"
    echo ""
}

check_status() {
    echo -e "${GREEN}📊 Checking service status...${NC}"
    docker compose ps
}

view_logs() {
    echo -e "${GREEN}📜 Viewing all logs (Ctrl+C to exit)...${NC}"
    docker compose logs -f
}

view_service_logs() {
    echo -e "${YELLOW}Available services:${NC}"
    echo "  • academy_service"
    echo "  • attendance_service"
    echo "  • connect_service"
    echo "  • identity_service"
    echo "  • payment_service"
    echo "  • payroll_service"
    echo "  • rule_engine"
    echo "  • ai_gateway"
    echo "  • frontend"
    echo "  • gateway"
    echo "  • postgres"
    echo "  • pgadmin"
    echo ""
    read -p "Enter service name: " service
    echo -e "${GREEN}📜 Viewing logs for ${service}...${NC}"
    docker compose logs -f "$service"
}

restart_all() {
    echo -e "${YELLOW}🔄 Restarting all services...${NC}"
    docker compose restart
    echo -e "${GREEN}✅ All services restarted!${NC}"
}

restart_service() {
    read -p "Enter service name: " service
    echo -e "${YELLOW}🔄 Restarting ${service}...${NC}"
    docker compose restart "$service"
    echo -e "${GREEN}✅ ${service} restarted!${NC}"
}

stop_all() {
    read -p "Are you sure you want to stop all services? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        echo -e "${RED}🛑 Stopping all services...${NC}"
        docker compose down
        echo -e "${GREEN}✅ All services stopped!${NC}"
    fi
}

start_all() {
    echo -e "${GREEN}🚀 Starting all services...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅ All services started!${NC}"
}

rebuild_all() {
    read -p "⚠️  This will rebuild everything. Continue? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        echo -e "${YELLOW}🔨 Rebuilding all services...${NC}"
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        echo -e "${GREEN}✅ Rebuild complete!${NC}"
    fi
}

check_disk() {
    echo -e "${GREEN}💾 Docker disk usage:${NC}"
    docker system df
    echo ""
    echo -e "${YELLOW}💡 To clean up: docker system prune -a${NC}"
}

access_postgres() {
    echo -e "${GREEN}🗄️  Accessing PostgreSQL CLI...${NC}"
    echo -e "${YELLOW}Database: lera | User: lera | Password: lera123${NC}"
    docker compose exec postgres psql -U lera -d lera
}

test_frontend() {
    echo -e "${GREEN}🌐 Testing frontend...${NC}"
    curl -I http://localhost:3000 2>/dev/null || echo -e "${RED}❌ Frontend not responding${NC}"
}

test_gateway() {
    echo -e "${GREEN}🚪 Testing gateway...${NC}"
    curl -I http://localhost 2>/dev/null || echo -e "${RED}❌ Gateway not responding${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    echo ""
    
    case $choice in
        1) check_status ;;
        2) view_logs ;;
        3) view_service_logs ;;
        4) restart_all ;;
        5) restart_service ;;
        6) stop_all ;;
        7) start_all ;;
        8) rebuild_all ;;
        9) check_disk ;;
        10) access_postgres ;;
        11) test_frontend ;;
        12) test_gateway ;;
        0) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid choice${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
