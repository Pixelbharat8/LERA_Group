#!/bin/bash
########################################################
#  LERA GROUP – One-Command Launch Script
#  KILL ALL → Database → 9 Backend Services → Frontend
########################################################

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DB_DIR="$ROOT_DIR/database"
LOG_DIR="$ROOT_DIR/logs"

# Database config
DB_NAME="lera"
DB_USER="lera"
DB_PASS="lera123"
DB_PORT="5432"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

# ---- Helper: detect docker compose command ----
get_docker_compose_cmd() {
  if docker compose version &>/dev/null; then
    echo "docker compose"
  elif command -v docker-compose &>/dev/null; then
    echo "docker-compose"
  else
    echo ""
  fi
}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🚀  LERA GROUP – FULL LAUNCH  🚀      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

########################################################
# 0. KILL ALL RUNNING SERVICES FIRST
########################################################
echo -e "${RED}━━━ [0] KILLING ALL RUNNING SERVICES ━━━${NC}"

# Kill all backend services on ports 8081-8089
for PORT in 8081 8082 8083 8084 8085 8086 8087 8088 8089 3000; do
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    echo -e "${RED}  ✖ Killed process on port $PORT${NC}"
  fi
done

# Kill any leftover Maven/Java spring-boot processes
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "mvn.*spring-boot" 2>/dev/null || true

# Kill any leftover Next.js/node dev processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Stop old database container if running
COMPOSE_CMD=$(get_docker_compose_cmd)
if [ -n "$COMPOSE_CMD" ]; then
  cd "$DB_DIR" 2>/dev/null && $COMPOSE_CMD down 2>/dev/null || true
fi

echo -e "${GREEN}  ✅ All old processes killed${NC}"
echo ""
sleep 2

########################################################
# 1. DATABASE – Auto-detect: Docker → Homebrew → Postgres.app
########################################################
echo -e "${YELLOW}━━━ [1/11] Starting PostgreSQL Database ━━━${NC}"

DB_READY=false

# ---- Method 1: Docker ----
COMPOSE_CMD=$(get_docker_compose_cmd)
if [ -n "$COMPOSE_CMD" ] && command -v docker &>/dev/null; then
  echo -e "  Trying Docker..."
  cd "$DB_DIR"
  # Remove old stopped container if it conflicts
  docker rm -f lera_postgres 2>/dev/null || true
  $COMPOSE_CMD up -d 2>&1
  echo -e "${GREEN}  ✅ PostgreSQL container started via Docker on localhost:${DB_PORT}${NC}"
  echo -e "${YELLOW}  ⏳ Waiting 8s for database to be ready...${NC}"
  sleep 8
  DB_READY=true
fi

# ---- Method 2: Local PostgreSQL (Homebrew / Postgres.app / system) ----
if [ "$DB_READY" = false ]; then
  echo -e "  Docker not available. Trying local PostgreSQL..."

  # Find psql binary
  PSQL_BIN=""
  if command -v psql &>/dev/null; then
    PSQL_BIN="psql"
  elif [ -x "/opt/homebrew/bin/psql" ]; then
    PSQL_BIN="/opt/homebrew/bin/psql"
  elif [ -x "/usr/local/bin/psql" ]; then
    PSQL_BIN="/usr/local/bin/psql"
  elif [ -x "/Applications/Postgres.app/Contents/Versions/latest/bin/psql" ]; then
    PSQL_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
  fi

  if [ -z "$PSQL_BIN" ]; then
    echo -e "${RED}  ❌ PostgreSQL not found! Install one of:${NC}"
    echo -e "${YELLOW}     Option A: brew install postgresql@15 && brew services start postgresql@15${NC}"
    echo -e "${YELLOW}     Option B: Install Docker Desktop → https://docker.com/products/docker-desktop${NC}"
    echo -e "${YELLOW}     Option C: Install Postgres.app → https://postgresapp.com${NC}"
    echo ""
    echo -e "${RED}  Cannot continue without a database. Exiting.${NC}"
    exit 1
  fi

  # Find pg_isready
  PG_ISREADY=""
  PG_BIN_DIR="$(dirname "$PSQL_BIN")"
  if [ -x "$PG_BIN_DIR/pg_isready" ]; then
    PG_ISREADY="$PG_BIN_DIR/pg_isready"
  elif command -v pg_isready &>/dev/null; then
    PG_ISREADY="pg_isready"
  fi

  # Start PostgreSQL if not running (Homebrew)
  if [ -n "$PG_ISREADY" ] && ! $PG_ISREADY -q 2>/dev/null; then
    echo -e "  PostgreSQL not running. Attempting to start..."
    if command -v brew &>/dev/null; then
      brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
      sleep 3
    elif [ -d "/Applications/Postgres.app" ]; then
      open -a Postgres 2>/dev/null
      sleep 5
    fi
  fi

  # Verify PostgreSQL is running
  if [ -n "$PG_ISREADY" ] && $PG_ISREADY -q 2>/dev/null; then
    echo -e "${GREEN}  ✅ PostgreSQL is running on localhost:${DB_PORT}${NC}"
  else
    echo -e "${YELLOW}  ⚠️  Could not verify PostgreSQL status — continuing anyway${NC}"
  fi

  # Create database and user if they don't exist
  echo -e "  Setting up database '${DB_NAME}' and user '${DB_USER}'..."

  # Try with default superuser (usually current macOS user or 'postgres')
  SUPERUSER=""
  for TRYUSER in "$(whoami)" "postgres"; do
    if $PSQL_BIN -U "$TRYUSER" -d postgres -c "SELECT 1" &>/dev/null; then
      SUPERUSER="$TRYUSER"
      break
    fi
  done

  if [ -n "$SUPERUSER" ]; then
    # Create user if not exists
    $PSQL_BIN -U "$SUPERUSER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null | grep -q 1 || \
      $PSQL_BIN -U "$SUPERUSER" -d postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}' CREATEDB;" 2>/dev/null
    
    # Create database if not exists
    $PSQL_BIN -U "$SUPERUSER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1 || \
      $PSQL_BIN -U "$SUPERUSER" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null
    
    # Grant privileges
    $PSQL_BIN -U "$SUPERUSER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
    $PSQL_BIN -U "$SUPERUSER" -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null
    
    # Run init SQL files
    echo -e "  Running database init scripts..."
    for SQL_FILE in "$DB_DIR/init/init_v2_multi_tenant.sql" \
                    "$DB_DIR/init/rule_engine_tables.sql" \
                    "$DB_DIR/init/V5__ai_features.sql" \
                    "$DB_DIR/init/V6__chat_features.sql" \
                    "$DB_DIR/init/V7__library_management.sql" \
                    "$DB_DIR/init/V8__sports_management.sql" \
                    "$DB_DIR/init/V9__transport_management.sql" \
                    "$DB_DIR/init/V10__website_and_features.sql" \
                    "$DB_DIR/init/V11__fix_all_errors.sql"; do
      if [ -f "$SQL_FILE" ]; then
        PGPASSWORD="${DB_PASS}" $PSQL_BIN -U "${DB_USER}" -d "${DB_NAME}" -f "$SQL_FILE" -q 2>/dev/null || true
      fi
    done
    
    echo -e "${GREEN}  ✅ Database '${DB_NAME}' ready on localhost:${DB_PORT}${NC}"
    DB_READY=true
  else
    echo -e "${RED}  ❌ Cannot connect to PostgreSQL. Please ensure it's running:${NC}"
    echo -e "${YELLOW}     brew services start postgresql@15${NC}"
    exit 1
  fi
fi

# Final connectivity check
echo -e "  Verifying database connection..."
if PGPASSWORD="${DB_PASS}" psql -U "${DB_USER}" -d "${DB_NAME}" -h localhost -p ${DB_PORT} -c "SELECT 1" &>/dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Database connection verified: localhost:${DB_PORT}/${DB_NAME}${NC}"
elif [ -n "$PSQL_BIN" ] && PGPASSWORD="${DB_PASS}" $PSQL_BIN -U "${DB_USER}" -d "${DB_NAME}" -h localhost -p ${DB_PORT} -c "SELECT 1" &>/dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Database connection verified: localhost:${DB_PORT}/${DB_NAME}${NC}"
else
  echo -e "${YELLOW}  ⚠️  Could not verify DB connection — services will retry on their own${NC}"
fi
echo ""

########################################################
# 2. BACKEND SERVICES
########################################################
declare -a SERVICES=(
  "identity_service:8081"
  "academy_service:8082"
  "payment_service:8083"
  "payroll_service:8084"
  "attendance_service:8085"
  "connect_service:8086"
  "ai_gateway:8087"
  "rule_engine:8088"
  "social_media_service:8089"
)

SERVICE_NUM=2
for entry in "${SERVICES[@]}"; do
  SVC_NAME="${entry%%:*}"
  SVC_PORT="${entry##*:}"
  SVC_DIR="$BACKEND_DIR/$SVC_NAME"

  echo -e "${YELLOW}━━━ [$SERVICE_NUM/11] Starting $SVC_NAME (port $SVC_PORT) ━━━${NC}"

  if [ ! -d "$SVC_DIR" ]; then
    echo -e "${RED}  ❌ Directory not found: $SVC_DIR – skipping${NC}"
    SERVICE_NUM=$((SERVICE_NUM + 1))
    continue
  fi

  cd "$SVC_DIR"
  nohup mvn spring-boot:run -DskipTests \
    > "$LOG_DIR/${SVC_NAME}.log" 2>&1 &
  echo -e "${GREEN}  ✅ Launched (PID $!) → log: logs/${SVC_NAME}.log${NC}"

  SERVICE_NUM=$((SERVICE_NUM + 1))
done

echo ""

########################################################
# 3. WAIT FOR IDENTITY SERVICE (others depend on it)
########################################################
echo -e "${YELLOW}━━━ Waiting for Identity Service (8081) ━━━${NC}"
MAX_WAIT=120
WAITED=0
while ! curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}  ⚠️  Identity service not responding after ${MAX_WAIT}s – continuing anyway${NC}"
    break
  fi
  sleep 3
  WAITED=$((WAITED + 3))
  echo -e "  ⏳ Waiting... (${WAITED}s)"
done
if [ $WAITED -lt $MAX_WAIT ]; then
  echo -e "${GREEN}  ✅ Identity Service is ready!${NC}"
fi
echo ""

########################################################
# 4. FRONTEND
########################################################
echo -e "${YELLOW}━━━ [11/11] Starting Frontend (Next.js – port 3000) ━━━${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
echo -e "${GREEN}  ✅ Launched (PID $!) → log: logs/frontend.log${NC}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          🎉  ALL SERVICES LAUNCHED  🎉       ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}║  Database:    postgresql://localhost:5432/lera║${NC}"
echo -e "${CYAN}║  Identity:    http://localhost:8081           ║${NC}"
echo -e "${CYAN}║  Academy:     http://localhost:8082           ║${NC}"
echo -e "${CYAN}║  Payment:     http://localhost:8083           ║${NC}"
echo -e "${CYAN}║  Payroll:     http://localhost:8084           ║${NC}"
echo -e "${CYAN}║  Attendance:  http://localhost:8085           ║${NC}"
echo -e "${CYAN}║  Connect:     http://localhost:8086           ║${NC}"
echo -e "${CYAN}║  AI Gateway:  http://localhost:8087           ║${NC}"
echo -e "${CYAN}║  Rule Engine: http://localhost:8088           ║${NC}"
echo -e "${CYAN}║  Social:      http://localhost:8089           ║${NC}"
echo -e "${CYAN}║  Frontend:    http://localhost:3000           ║${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}║  Logs:        ./logs/*.log                   ║${NC}"
echo -e "${CYAN}║  Stop all:    ./stop-all.sh                  ║${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
