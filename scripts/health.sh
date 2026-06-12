#!/usr/bin/env bash
# Poll health for every LERA service. Uses /actuator/health if available, else port liveness.
# Usage:
#   scripts/health.sh                # one pass
#   scripts/health.sh --watch        # refresh every 3s
#   scripts/health.sh --json         # raw JSON per service

set -u

WATCH=0
JSON=0
for arg in "$@"; do
  case "$arg" in
    --watch) WATCH=1 ;;
    --json)  JSON=1 ;;
  esac
done

# name|port|extra-path-to-check (after actuator/health)
SERVICES=(
  "identity|8081|/api/auth/health"
  "academy|8082|"
  "payment|8083|"
  "payroll|8084|"
  "attendance|8085|"
  "connect|8086|"
  "ai_gateway|8087|"
  "rule_engine|8088|/api/rules/health"
  "social_media|8089|"
  "frontend|3000|/"
)

check_one() {
  local name=$1 port=$2 extra=$3
  local actuator="http://127.0.0.1:${port}/actuator/health"
  local body status

  if [[ "$name" == "frontend" ]]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:${port}/" 2>/dev/null || echo 000)
    if [[ "$JSON" == "1" ]]; then printf '{"service":"%s","port":%s,"http":%s}\n' "$name" "$port" "$status"
    else printf "  %-13s  port %-4s  %s\n" "$name" "$port" "$status"; fi
    return
  fi

  body=$(curl -s --connect-timeout 2 "$actuator" 2>/dev/null || true)
  status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$actuator" 2>/dev/null || echo 000)

  local up="?"
  if [[ "$body" == *'"status":"UP"'* ]]; then up="UP"
  elif [[ "$body" == *'"status":"DOWN"'* ]]; then up="DOWN"
  elif [[ "$status" == "200" ]]; then up="UP"
  elif [[ "$status" == "401" || "$status" == "403" ]]; then up="ALIVE(secured)"
  elif [[ "$status" == "404" ]]; then up="NO-ACTUATOR"
  elif [[ "$status" == "000" ]]; then up="DOWN"
  else up="HTTP-$status"; fi

  if [[ "$JSON" == "1" ]]; then
    printf '{"service":"%s","port":%s,"actuator":%s,"status":"%s"}\n' "$name" "$port" "$status" "$up"
  else
    printf "  %-13s  port %-4s  %-15s  %s\n" "$name" "$port" "$up" "$actuator"
  fi
}

run_pass() {
  if [[ "$JSON" == "0" ]]; then
    printf '\nLERA health  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
    printf -- '------------------------------------------------------------\n'
  fi
  for s in "${SERVICES[@]}"; do
    IFS='|' read -r name port extra <<<"$s"
    check_one "$name" "$port" "$extra"
  done
  if [[ "$JSON" == "0" ]]; then
    printf -- '------------------------------------------------------------\n'
    printf 'Legend: UP/DOWN from actuator JSON. ALIVE(secured)=service answers but actuator is gated. NO-ACTUATOR=service up but no /actuator/health.\n'
  fi
}

if [[ "$WATCH" == "1" ]]; then
  while true; do clear; run_pass; sleep 3; done
else
  run_pass
fi
