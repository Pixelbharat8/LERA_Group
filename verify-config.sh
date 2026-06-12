#!/bin/bash
########################################################
#  LERA GROUP – Configuration Verifier
#  Checks ALL localhost URLs, ports, DB config, JWT secrets
########################################################

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

ok()   { PASS=$((PASS+1)); echo -e "  ${GREEN}✅ $1${NC}"; }
fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}❌ $1${NC}"; }
warn() { WARN=$((WARN+1)); echo -e "  ${YELLOW}⚠️  $1${NC}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    🔍 LERA CONFIG VERIFICATION REPORT 🔍     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

########################################################
# 1. CHECK DATABASE CONFIG (all 9 services)
########################################################
echo -e "${CYAN}━━━ [1] DATABASE CONFIG (application.properties) ━━━${NC}"

CORRECT_JWT="bGVyYUFjYWRlbXlTZWNyZXRLZXkyMDI0VmVyeUxvbmdTZWN1cmVLZXlGb3JKd3RUb2tlbkdlbmVyYXRpb24="

SERVICES=(
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

for entry in "${SERVICES[@]}"; do
  SVC="${entry%%:*}"
  PORT="${entry##*:}"
  PROPS="$ROOT_DIR/backend/$SVC/src/main/resources/application.properties"
  
  if [ ! -f "$PROPS" ]; then
    fail "$SVC: application.properties NOT FOUND"
    continue
  fi

  # Check port
  ACTUAL_PORT=$(grep "^server.port=" "$PROPS" | cut -d= -f2)
  if [ "$ACTUAL_PORT" = "$PORT" ]; then
    ok "$SVC: port = $PORT"
  else
    fail "$SVC: port = $ACTUAL_PORT (expected $PORT)"
  fi

  # Check DB URL
  DB_URL=$(grep "^spring.datasource.url=" "$PROPS" | head -1)
  if echo "$DB_URL" | grep -q "localhost.*5432.*lera"; then
    ok "$SVC: DB → localhost:5432/lera"
  else
    fail "$SVC: DB URL wrong → $DB_URL"
  fi

  # Check DB user
  DB_USER=$(grep "^spring.datasource.username=" "$PROPS" | head -1)
  if echo "$DB_USER" | grep -q "lera"; then
    ok "$SVC: DB user = lera"
  else
    fail "$SVC: DB user wrong → $DB_USER"
  fi

  # Check JWT secret
  JWT=$(grep "^jwt.secret=" "$PROPS" | cut -d= -f2)
  if [ "$JWT" = "$CORRECT_JWT" ]; then
    ok "$SVC: JWT secret ✓"
  else
    fail "$SVC: JWT secret MISMATCH (will cause auth failures)"
  fi
done

echo ""

########################################################
# 2. CHECK FRONTEND ENV
########################################################
echo -e "${CYAN}━━━ [2] FRONTEND .env.local ━━━${NC}"

ENV_FILE="$ROOT_DIR/frontend/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  fail ".env.local NOT FOUND"
else
  # Check each service URL mapping
  check_env() {
    local VAR=$1
    local EXPECTED=$2
    local ACTUAL=$(grep "^$VAR=" "$ENV_FILE" | cut -d= -f2)
    if [ "$ACTUAL" = "$EXPECTED" ]; then
      ok "$VAR = $EXPECTED"
    elif [ -z "$ACTUAL" ]; then
      fail "$VAR is MISSING"
    else
      fail "$VAR = $ACTUAL (expected $EXPECTED)"
    fi
  }

  check_env "IDENTITY_SERVICE_URL" "http://localhost:8081"
  check_env "ACADEMY_SERVICE_URL" "http://localhost:8082"
  check_env "PAYMENT_SERVICE_URL" "http://localhost:8083"
  check_env "PAYROLL_SERVICE_URL" "http://localhost:8084"
  check_env "ATTENDANCE_SERVICE_URL" "http://localhost:8085"
  check_env "CONNECT_SERVICE_URL" "http://localhost:8086"
  check_env "AI_GATEWAY_URL" "http://localhost:8087"
  check_env "RULE_ENGINE_URL" "http://localhost:8088"
  check_env "SOCIAL_MEDIA_SERVICE_URL" "http://localhost:8089"
fi

echo ""

########################################################
# 3. CHECK next.config.js FALLBACK PORTS
########################################################
echo -e "${CYAN}━━━ [3] NEXT.JS PROXY REWRITES (next.config.js) ━━━${NC}"

NEXT_CFG="$ROOT_DIR/frontend/next.config.js"
if [ ! -f "$NEXT_CFG" ]; then
  fail "next.config.js NOT FOUND"
else
  check_proxy() {
    local NAME=$1
    local PORT=$2
    if grep -q "localhost:${PORT}" "$NEXT_CFG"; then
      ok "$NAME → localhost:$PORT"
    else
      fail "$NAME: port $PORT NOT FOUND in next.config.js"
    fi
  }

  check_proxy "Identity" "8081"
  check_proxy "Academy" "8082"
  check_proxy "Payment" "8083"
  check_proxy "Payroll" "8084"
  check_proxy "Attendance" "8085"
  check_proxy "Connect" "8086"
  check_proxy "AI Gateway" "8087"
  check_proxy "Rule Engine" "8088"
  check_proxy "Social Media" "8089"
fi

echo ""

########################################################
# 4. CHECK DOCKER DATABASE CONFIG
########################################################
echo -e "${CYAN}━━━ [4] DOCKER DATABASE CONFIG ━━━${NC}"

DOCKER_FILE="$ROOT_DIR/database/docker-compose.yml"
if [ ! -f "$DOCKER_FILE" ]; then
  fail "database/docker-compose.yml NOT FOUND"
else
  if grep -q "POSTGRES_DB: lera" "$DOCKER_FILE"; then
    ok "Docker: POSTGRES_DB = lera"
  else
    fail "Docker: POSTGRES_DB incorrect"
  fi

  if grep -q "POSTGRES_USER: lera" "$DOCKER_FILE"; then
    ok "Docker: POSTGRES_USER = lera"
  else
    fail "Docker: POSTGRES_USER incorrect"
  fi

  if grep -q "POSTGRES_PASSWORD: lera123" "$DOCKER_FILE"; then
    ok "Docker: POSTGRES_PASSWORD = lera123"
  else
    fail "Docker: POSTGRES_PASSWORD incorrect"
  fi

  if grep -q '"5432:5432"' "$DOCKER_FILE"; then
    ok "Docker: Port mapping 5432:5432"
  else
    fail "Docker: Port mapping incorrect"
  fi
fi

echo ""

########################################################
# 5. CHECK INTER-SERVICE URLs
########################################################
echo -e "${CYAN}━━━ [5] INTER-SERVICE URLs (hardcoded in Java) ━━━${NC}"

# Check for any wrong hardcoded localhost ports
WRONG=$(grep -rn "localhost:8080" "$ROOT_DIR/backend/" --include="*.java" --include="*.properties" 2>/dev/null | grep -v "target/" | grep -v ".git/")
if [ -n "$WRONG" ]; then
  fail "Found localhost:8080 references (identity_service is on 8081):"
  echo "$WRONG" | head -5
else
  ok "No wrong localhost:8080 references"
fi

# Verify NotificationClient defaults are correct (should point to connect:8086)
NOTIFY_CLIENTS=$(grep -rn "localhost:8086" "$ROOT_DIR/backend/" --include="*.java" 2>/dev/null | grep -v "target/" | grep "NotificationClient\|ChatController" | wc -l)
if [ "$NOTIFY_CLIENTS" -gt 0 ]; then
  ok "NotificationClient/ChatController → localhost:8086 (connect_service)"
fi

echo ""

########################################################
# SUMMARY
########################################################
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            VERIFICATION SUMMARY              ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  ✅ PASSED:  $PASS                                ${NC}"
echo -e "${RED}║  ❌ FAILED:  $FAIL                                ${NC}"
echo -e "${YELLOW}║  ⚠️  WARNINGS: $WARN                              ${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 ALL CONFIGURATIONS ARE CORRECT! Ready to launch.${NC}"
  echo -e "${GREEN}   Run: ./start-all.sh${NC}"
else
  echo ""
  echo -e "${RED}⚠️  FIX THE FAILURES ABOVE BEFORE LAUNCHING!${NC}"
fi
echo ""
