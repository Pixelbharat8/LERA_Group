#!/bin/bash
########################################################
#  LERA GROUP – Database Setup Script (No Docker Needed)
#  Installs PostgreSQL via Homebrew and initializes the DB
########################################################

DB_NAME="lera"
DB_USER="lera"
DB_PASS="lera123"
DB_PORT="5432"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="$ROOT_DIR/database"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🗄️  LERA GROUP – DATABASE SETUP  🗄️        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

########################################################
# 1. CHECK / INSTALL POSTGRESQL
########################################################
echo -e "${YELLOW}━━━ [1] Checking PostgreSQL Installation ━━━${NC}"

PSQL_BIN=""
PG_ISREADY=""

# Check if PostgreSQL is already installed
if command -v psql &>/dev/null; then
  PSQL_BIN="psql"
elif [ -x "/opt/homebrew/bin/psql" ]; then
  PSQL_BIN="/opt/homebrew/bin/psql"
  export PATH="/opt/homebrew/bin:$PATH"
elif [ -x "/usr/local/bin/psql" ]; then
  PSQL_BIN="/usr/local/bin/psql"
elif [ -x "/Applications/Postgres.app/Contents/Versions/latest/bin/psql" ]; then
  PSQL_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
fi

if [ -z "$PSQL_BIN" ]; then
  echo -e "${YELLOW}  PostgreSQL not found. Installing via Homebrew...${NC}"
  
  if ! command -v brew &>/dev/null; then
    echo -e "${RED}  ❌ Homebrew not found. Please install it first:${NC}"
    echo -e "${YELLOW}     /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${NC}"
    echo ""
    echo -e "${RED}  OR install PostgreSQL manually:${NC}"
    echo -e "${YELLOW}     Download from: https://postgresapp.com${NC}"
    exit 1
  fi
  
  echo -e "  Running: brew install postgresql@15 ..."
  brew install postgresql@15
  
  # Add to PATH
  if [ -d "/opt/homebrew/opt/postgresql@15/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
    PSQL_BIN="/opt/homebrew/opt/postgresql@15/bin/psql"
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    echo -e "${GREEN}  ✅ PostgreSQL 15 installed via Homebrew${NC}"
    echo -e "${YELLOW}  ℹ️  Added to PATH in ~/.zshrc${NC}"
  elif [ -d "/usr/local/opt/postgresql@15/bin" ]; then
    export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
    PSQL_BIN="/usr/local/opt/postgresql@15/bin/psql"
  fi
else
  echo -e "${GREEN}  ✅ PostgreSQL found: $($PSQL_BIN --version)${NC}"
fi

# Find pg_isready
PG_BIN_DIR="$(dirname "$PSQL_BIN")"
if [ -x "$PG_BIN_DIR/pg_isready" ]; then
  PG_ISREADY="$PG_BIN_DIR/pg_isready"
elif command -v pg_isready &>/dev/null; then
  PG_ISREADY="pg_isready"
fi
echo ""

########################################################
# 2. START POSTGRESQL SERVICE
########################################################
echo -e "${YELLOW}━━━ [2] Starting PostgreSQL Service ━━━${NC}"

if [ -n "$PG_ISREADY" ] && $PG_ISREADY -q 2>/dev/null; then
  echo -e "${GREEN}  ✅ PostgreSQL is already running${NC}"
else
  echo -e "  Starting PostgreSQL..."
  if command -v brew &>/dev/null; then
    brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 3
  elif [ -d "/Applications/Postgres.app" ]; then
    open -a Postgres 2>/dev/null
    sleep 5
  fi
  
  # Verify it started
  if [ -n "$PG_ISREADY" ] && $PG_ISREADY -q 2>/dev/null; then
    echo -e "${GREEN}  ✅ PostgreSQL started successfully${NC}"
  else
    echo -e "${RED}  ❌ Failed to start PostgreSQL. Try manually:${NC}"
    echo -e "${YELLOW}     brew services start postgresql@15${NC}"
    exit 1
  fi
fi
echo ""

########################################################
# 3. CREATE USER AND DATABASE
########################################################
echo -e "${YELLOW}━━━ [3] Setting Up Database '${DB_NAME}' ━━━${NC}"

# Find a superuser to connect with
SUPERUSER=""
for TRYUSER in "$(whoami)" "postgres"; do
  if $PSQL_BIN -U "$TRYUSER" -d postgres -c "SELECT 1" &>/dev/null; then
    SUPERUSER="$TRYUSER"
    break
  fi
done

if [ -z "$SUPERUSER" ]; then
  echo -e "${RED}  ❌ Cannot connect to PostgreSQL as any superuser.${NC}"
  echo -e "${YELLOW}  Try: $PSQL_BIN -U $(whoami) -d postgres${NC}"
  exit 1
fi

echo -e "  Connected as superuser: ${SUPERUSER}"

# Create user
if $PSQL_BIN -U "$SUPERUSER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null | grep -q 1; then
  echo -e "  User '${DB_USER}' already exists"
  # Update password just in case
  $PSQL_BIN -U "$SUPERUSER" -d postgres -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null
else
  $PSQL_BIN -U "$SUPERUSER" -d postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}' CREATEDB LOGIN;" 2>/dev/null
  echo -e "${GREEN}  ✅ Created user '${DB_USER}'${NC}"
fi

# Create database
if $PSQL_BIN -U "$SUPERUSER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1; then
  echo -e "  Database '${DB_NAME}' already exists"
else
  $PSQL_BIN -U "$SUPERUSER" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null
  echo -e "${GREEN}  ✅ Created database '${DB_NAME}'${NC}"
fi

# Grant privileges
$PSQL_BIN -U "$SUPERUSER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
$PSQL_BIN -U "$SUPERUSER" -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null
$PSQL_BIN -U "$SUPERUSER" -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};" 2>/dev/null
$PSQL_BIN -U "$SUPERUSER" -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};" 2>/dev/null
echo -e "${GREEN}  ✅ Privileges granted${NC}"
echo ""

########################################################
# 4. RUN INIT SQL SCRIPTS
########################################################
echo -e "${YELLOW}━━━ [4] Running Database Init Scripts ━━━${NC}"

SQL_FILES=(
  "$DB_DIR/init/init_v2_multi_tenant.sql"
  "$DB_DIR/init/rule_engine_tables.sql"
  "$DB_DIR/init/V5__ai_features.sql"
  "$DB_DIR/init/V6__chat_features.sql"
  "$DB_DIR/init/V7__library_management.sql"
  "$DB_DIR/init/V8__sports_management.sql"
  "$DB_DIR/init/V9__transport_management.sql"
  "$DB_DIR/init/V10__website_and_features.sql"
  "$DB_DIR/init/V11__fix_all_errors.sql"
)

for SQL_FILE in "${SQL_FILES[@]}"; do
  if [ -f "$SQL_FILE" ]; then
    FNAME=$(basename "$SQL_FILE")
    PGPASSWORD="${DB_PASS}" $PSQL_BIN -U "${DB_USER}" -d "${DB_NAME}" -h localhost -p ${DB_PORT} -f "$SQL_FILE" -q 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}  ✅ $FNAME${NC}"
    else
      echo -e "${YELLOW}  ⚠️  $FNAME (some statements may have been skipped)${NC}"
    fi
  else
    echo -e "${YELLOW}  ⚠️  Not found: $(basename "$SQL_FILE")${NC}"
  fi
done
echo ""

########################################################
# 5. VERIFY CONNECTION
########################################################
echo -e "${YELLOW}━━━ [5] Verifying Database Connection ━━━${NC}"

TABLE_COUNT=$(PGPASSWORD="${DB_PASS}" $PSQL_BIN -U "${DB_USER}" -d "${DB_NAME}" -h localhost -p ${DB_PORT} -tc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')

if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ] 2>/dev/null; then
  echo -e "${GREEN}  ✅ Database connection verified!${NC}"
  echo -e "${GREEN}  ✅ Tables in database: ${TABLE_COUNT}${NC}"
else
  echo -e "${RED}  ❌ Could not verify database. Check connection manually:${NC}"
  echo -e "${YELLOW}     PGPASSWORD=lera123 psql -U lera -d lera -h localhost -p 5432${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🎉  DATABASE SETUP COMPLETE  🎉        ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}║  Host:      localhost                        ║${NC}"
echo -e "${CYAN}║  Port:      ${DB_PORT}                            ║${NC}"
echo -e "${CYAN}║  Database:  ${DB_NAME}                            ║${NC}"
echo -e "${CYAN}║  User:      ${DB_USER}                            ║${NC}"
echo -e "${CYAN}║  Password:  ${DB_PASS}                         ║${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}║  JDBC URL:  jdbc:postgresql://localhost:5432/lera${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}║  Now run:   bash start-all.sh                ║${NC}"
echo -e "${CYAN}║                                              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
