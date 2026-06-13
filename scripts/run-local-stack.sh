#!/usr/bin/env bash
# Run all LERA Spring Boot services + Next.js frontend against LOCAL PostgreSQL (no Docker).
# Prerequisites: Java 17+, Maven, Node/npm, Postgres with database lera (see ensure-local-db.sh).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/.lera-runtime"
mkdir -p "$RUNTIME/logs"

"$ROOT/scripts/ensure-local-db.sh"

rm -f "$RUNTIME/pids.txt"

start_java() {
  local log_name=$1 service_dir=$2
  echo "Starting $log_name..."
  (
    cd "$ROOT/backend/$service_dir"
    nohup mvn -q -DskipTests spring-boot:run >>"$RUNTIME/logs/${log_name}.log" 2>&1 &
    echo $! >>"$RUNTIME/pids.txt"
  )
}

# Spring Boot microservices — ports must match frontend/next.config.js rewrites
start_java "identity"       "identity_service"
start_java "academy"        "academy_service"
start_java "payment"        "payment_service"
start_java "payroll"        "payroll_service"
start_java "attendance"     "attendance_service"
start_java "connect"        "connect_service"
start_java "ai_gateway"     "ai_gateway"
start_java "rule_engine"    "rule_engine"
start_java "social_media"   "social_media_service"

echo "Starting frontend (Next.js)..."
(
  cd "$ROOT/frontend"
  nohup bash "$ROOT/scripts/with-clean-npm-env.sh" npm run dev >>"$RUNTIME/logs/frontend.log" 2>&1 &
  echo $! >>"$RUNTIME/pids.txt"
)

echo ""
echo "Waiting for services to come UP (up to 180s)..."

# Poll every JVM service's /actuator/health until UP, plus the Next.js port.
JVM_PORTS=(8081 8082 8083 8084 8085 8086 8087 8088 8089)
DEADLINE=$(( $(date +%s) + 180 ))
LAST_LINE=""
while :; do
  ok=1
  status_line=""
  for p in "${JVM_PORTS[@]}"; do
    body=$(curl -s --connect-timeout 1 "http://127.0.0.1:${p}/actuator/health" 2>/dev/null || true)
    if [[ "$body" == *'"status":"UP"'* ]]; then
      status_line+=" $p:UP"
    else
      status_line+=" $p:."
      ok=0
    fi
  done
  fe=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 "http://127.0.0.1:3000/" 2>/dev/null || echo 000)
  if [[ "$fe" != "200" ]]; then ok=0; fi
  status_line+=" 3000:$fe"

  if [[ "$status_line" != "$LAST_LINE" ]]; then
    printf '  %s\n' "$status_line"
    LAST_LINE="$status_line"
  fi

  if [[ "$ok" == "1" ]]; then break; fi
  if [[ $(date +%s) -ge $DEADLINE ]]; then
    echo "  Timed out waiting for everything to be UP. Showing current state:"
    "$ROOT/scripts/health.sh" || true
    echo "  See logs in $RUNTIME/logs/ for detail."
    exit 1
  fi
  sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "LERA local stack is READY (no Docker)."
echo "Logs: $RUNTIME/logs/*.log"
echo ""
echo "Services (9 JVM + frontend):"
echo "  8081 identity   8082 academy   8083 payment   8084 payroll   8085 attendance"
echo "  8086 connect     8087 ai_gateway  8088 rule_engine  8089 social_media  3000 frontend"
echo ""
echo "URLs:"
echo "  Frontend          http://localhost:3000"
echo "  Identity health   http://localhost:8081/api/auth/health"
echo "  Aggregated health http://localhost:8081/api/health"
echo "  AI Gateway        http://localhost:8087/api/ai/health  (needs Bearer token)"
echo ""
echo "PostgreSQL on 127.0.0.1:5432 — database lera, user lera."
echo "Health watch:    $ROOT/scripts/health.sh --watch"
echo "Stop everything: $ROOT/scripts/stop-local-stack.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
