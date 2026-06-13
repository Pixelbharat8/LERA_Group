#!/usr/bin/env bash
set -euo pipefail

# Canonical local launcher (pair with ./STOP_ALL_SERVICES.sh).
# Identity 8081, Academy 8082, Payment 8083, Payroll 8084, Attendance 8085, Connect 8086, Next 3000
# Optional: ai_gateway 8087 + rule_engine 8088 — pass --include-ai (matches frontend defaults in next.config.js).
# Optional: social_media_service on 8089 — pass --include-social (off by default to save RAM / ports).

INCLUDE_AI=0
INCLUDE_SOCIAL=0
for arg in "$@"; do
  case "$arg" in
    -h|--help)
      cat <<'EOF'
Usage: ./start-lera.sh [options]

Starts core LERA backends (8081 identity, 8082 academy, 8083 payment,
8084 payroll, 8085 attendance, 8086 connect) and Next.js on port 3000.
Loads .env.development when present.

Options:
  --include-ai      Also start ai_gateway on 8087 and rule_engine on 8088
                    (matches AI_GATEWAY_URL / RULE_ENGINE_URL in frontend/next.config.js).
  --include-social  Also start social_media_service on 8089 for /api/social* rewrites.

Manual alternative: from backend/<service>, run Spring Boot on the same ports if you
prefer not to use this script.

Stop: ./STOP_ALL_SERVICES.sh
EOF
      exit 0
      ;;
    --include-ai) INCLUDE_AI=1 ;;
    --include-social) INCLUDE_SOCIAL=1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
RUNTIME_DIR="$PROJECT_ROOT/.lera-runtime"
LOG_DIR="$RUNTIME_DIR/logs"
mkdir -p "$LOG_DIR" "$RUNTIME_DIR"

# shellcheck disable=SC1091
set -a
if [ -f "$PROJECT_ROOT/.env.development" ]; then
  source "$PROJECT_ROOT/.env.development"
fi
set +a

export MAVEN_OPTS="-Xmx1024m"
export JAVA_OPTS="-Xmx1g -XX:+UseG1GC"

echo ""
echo "LERA — local dev stack (see README.md: start-lera.sh + STOP_ALL_SERVICES.sh)"
echo "Backends: 8081 identity, 8082 academy, 8083 payment, 8084 payroll, 8085 attendance, 8086 connect"
if [ "$INCLUDE_AI" -eq 1 ]; then
  echo "          + 8087 ai_gateway, 8088 rule_engine (included)"
else
  echo "          (AI 8087 / rule 8088 omitted — use: $0 --include-ai)"
fi
if [ "$INCLUDE_SOCIAL" -eq 1 ]; then
  echo "          + 8089 social (included)"
else
  echo "          (social 8089 omitted — use: $0 --include-social)"
fi
echo "Frontend: 3000 (Next may use 3001/3002 if 3000 is taken — run ./STOP_ALL_SERVICES.sh first)"
echo ""

# Truncate PID file, then append one PID per started process
: > "$RUNTIME_DIR/pids.txt"

# Free service ports and common Next fallbacks (no killall java)
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089 3000 3001 3002; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -n "${pids:-}" ]; then
    kill $pids 2>/dev/null || true
  fi
done
pkill -f "next-server" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

if command -v brew >/dev/null 2>&1; then
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
fi
sleep 2

wait_actuator() {
  local port=$1
  local name=$2
  local retries=${3:-45}
  # Cold mvn spring-boot:run can exceed ~90s on large modules (compile + Flyway + JPA).
  if curl -sf --connect-timeout 2 --retry "$retries" --retry-delay 2 --retry-connrefused "http://127.0.0.1:${port}/actuator/health" >/dev/null; then
    echo "  healthy: $name (:$port)"
  else
    echo "  WARN: $name (:$port) health check timed out — see $LOG_DIR/${name}.log"
  fi
}

start_svc() {
  local short=$1
  local dir=$2
  local port=$3
  local retries=${4:-45}
  echo "Starting $short (:$port)..."
  cd "$PROJECT_ROOT/backend/$dir"
  mvn spring-boot:run -DskipTests >"$LOG_DIR/${short}.log" 2>&1 &
  echo $! >> "$RUNTIME_DIR/pids.txt"
  cd "$PROJECT_ROOT"
  wait_actuator "$port" "$short" "$retries"
}

start_svc identity_service identity_service 8081
# Academy: largest module; allow up to ~3 minutes before health-timeout warning
start_svc academy_service academy_service 8082 90
start_svc payment_service payment_service 8083
start_svc payroll_service payroll_service 8084
start_svc attendance_service attendance_service 8085
start_svc connect_service connect_service 8086
if [ "$INCLUDE_AI" -eq 1 ]; then
  start_svc ai_gateway ai_gateway 8087
  start_svc rule_engine rule_engine 8088
fi
if [ "$INCLUDE_SOCIAL" -eq 1 ]; then
  start_svc social_media_service social_media_service 8089
fi

echo ""
echo "Starting frontend (Next.js)..."
cd "$PROJECT_ROOT/frontend"
npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
echo $! >> "$RUNTIME_DIR/pids.txt"
cd "$PROJECT_ROOT"

if curl -sf --retry 25 --retry-delay 2 --retry-connrefused "http://127.0.0.1:3000/" >/dev/null 2>&1; then
  echo "  frontend responding on :3000"
else
  echo "  WARN: frontend may still be compiling — see $LOG_DIR/frontend.log"
fi

echo ""
echo "PIDs: $RUNTIME_DIR/pids.txt"
echo "Logs: $LOG_DIR/"
echo "Stop: ./STOP_ALL_SERVICES.sh"
echo ""
