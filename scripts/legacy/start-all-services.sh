#!/bin/bash

# =====================================================
# LERA GROUP - Complete System Startup Script
# =====================================================
# Run with: ./start-all-services.sh
#
# Optional environment:
#   LERA_PROJECT_ROOT  — override repo root (default: this script’s directory)
#   LERA_START_SOCIAL_MEDIA=true  — also start social_media_service (port 8089);
#       omitted by default so local dev matches centres that do not use marketing APIs.
# =====================================================

echo "============================================"
echo "      LERA Group - Start All Services"
echo "============================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${LERA_PROJECT_ROOT:-$SCRIPT_DIR}"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo ""
echo "🛑 Stopping existing processes on all service ports..."

# Kill processes on all service ports (CORRECT PORTS)
for port in 3000 3001 8081 8082 8083 8084 8085 8086 8087 8088 8089; do
    pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "  Killed process(es) on port $port"
    fi
done

# Also kill any Spring Boot / Next processes
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "org.springframework.boot" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

sleep 2

echo ""
echo "🚀 Starting all LERA services..."
echo ""

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start Identity Service (port 8081) - must start first
echo "1. Starting Identity Service (port 8081)..."
cd "$BACKEND_DIR/identity_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/identity.log" 2>&1 &
sleep 10

# Start Academy Service (port 8082)
echo "2. Starting Academy Service (port 8082)..."
cd "$BACKEND_DIR/academy_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/academy.log" 2>&1 &
sleep 3

# Start Payment Service (port 8083)
echo "3. Starting Payment Service (port 8083)..."
cd "$BACKEND_DIR/payment_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/payment.log" 2>&1 &
sleep 3

# Start Payroll Service (port 8084)
echo "4. Starting Payroll Service (port 8084)..."
cd "$BACKEND_DIR/payroll_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/payroll.log" 2>&1 &
sleep 3

# Start Attendance Service (port 8085)
echo "5. Starting Attendance Service (port 8085)..."
cd "$BACKEND_DIR/attendance_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/attendance.log" 2>&1 &
sleep 3

# Start Connect Service (port 8086)
echo "6. Starting Connect Service (port 8086)..."
cd "$BACKEND_DIR/connect_service"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/connect.log" 2>&1 &
sleep 3

# Start AI Gateway (port 8087)
echo "7. Starting AI Gateway (port 8087)..."
cd "$BACKEND_DIR/ai_gateway"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/ai_gateway.log" 2>&1 &
sleep 3

# Start Rule Engine (port 8088)
echo "8. Starting Rule Engine (port 8088)..."
cd "$BACKEND_DIR/rule_engine"
nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/rule_engine.log" 2>&1 &
sleep 3

# Optional: Social Media Service (8089). Easy to miss — enable explicitly when marketing UI hits /api/social-* .
if [ "${LERA_START_SOCIAL_MEDIA:-}" = "true" ]; then
    echo "8b. Starting Social Media Service (port 8089)…"
    cd "$BACKEND_DIR/social_media_service"
    nohup mvn spring-boot:run -DskipTests > "$PROJECT_ROOT/logs/social_media.log" 2>&1 &
    sleep 3
else
    echo "8b. Skipping Social Media Service (set LERA_START_SOCIAL_MEDIA=true to start port 8089)."
fi

# Start Frontend (port 3000 only — avoids stray chunk errors from mixed ports)
echo "9. Starting Frontend on http://localhost:3000 ..."
cd "$FRONTEND_DIR"
npm install --silent 2>/dev/null
rm -rf "$FRONTEND_DIR/.next"
PORT=3000 nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &

echo ""
echo "============================================"
echo "     Waiting for services to start..."
echo "============================================"
sleep 15

echo ""
echo "============================================"
echo "           SERVICE STATUS"
echo "============================================"

# Check each service
check_service() {
    local name=$1
    local port=$2
    if curl -s --max-time 2 "http://localhost:$port" >/dev/null 2>&1 || curl -s --max-time 2 "http://localhost:$port/actuator/health" >/dev/null 2>&1; then
        echo "✅ $name (port $port): UP"
    else
        echo "⏳ $name (port $port): Starting..."
    fi
}

check_service "Identity Service" 8081
check_service "Academy Service" 8082
check_service "Payment Service" 8083
check_service "Payroll Service" 8084
check_service "Attendance Service" 8085
check_service "Connect Service" 8086
check_service "AI Gateway" 8087
check_service "Rule Engine" 8088
if [ "${LERA_START_SOCIAL_MEDIA:-}" = "true" ]; then
    check_service "Social Media Service" 8089
fi
check_service "Frontend" 3000

echo ""
echo "============================================"
echo "           ACCESS URLS"
echo "============================================"
echo "🌐 Frontend:         http://localhost:3000"
echo "🔐 Identity Service: http://localhost:8081"
echo "📚 Academy Service:  http://localhost:8082"
echo "💰 Payment Service:  http://localhost:8083"
echo "💵 Payroll Service:  http://localhost:8084"
echo "📋 Attendance:       http://localhost:8085"
echo "📱 Connect Service:  http://localhost:8086"
echo "🤖 AI Gateway:       http://localhost:8087"
echo "⚙️  Rule Engine:      http://localhost:8088"
if [ "${LERA_START_SOCIAL_MEDIA:-}" = "true" ]; then
    echo "📣 Social Media:     http://localhost:8089"
fi
echo ""
echo "📁 Logs directory: $PROJECT_ROOT/logs/"
echo ""
echo "✅ Startup complete! Services may take 1-2 mins to fully initialize."
echo "Tip: export LERA_START_SOCIAL_MEDIA=true before running this script to include social_media_service (8089)."
