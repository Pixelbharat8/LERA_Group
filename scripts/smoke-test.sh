#!/usr/bin/env bash
# End-to-end smoke test against the running LERA stack.
#   1) Login as Chairman to get a JWT.
#   2) GET sample endpoints across all 9 services with that token.
# No mutations are performed.

set -u

EMAIL="${LERA_TEST_EMAIL:-Chairman@Leraacademy.edu.vn}"
PASSWORD="${LERA_TEST_PASSWORD:-chairman123}"
HOST="${LERA_TEST_HOST:-127.0.0.1}"

echo "=== 1) LOGIN ($EMAIL) ==="
LOGIN=$(curl -s -X POST "http://${HOST}:8081/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "$LOGIN" | head -c 200; echo

TOKEN=$(printf '%s' "$LOGIN" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print("")
    sys.exit(0)
for key in ("token", "accessToken"):
    v = d.get(key)
    if v: print(v); sys.exit(0)
data = d.get("data") or {}
for key in ("token", "accessToken"):
    v = data.get(key)
    if v: print(v); sys.exit(0)
print("")
' 2>/dev/null)

if [[ -z "${TOKEN}" ]]; then
  echo "!! No token in login response. Stopping."
  exit 1
fi
echo "token length: ${#TOKEN}"
echo

CHECKS=(
  "identity|8081|/api/users"
  "identity|8081|/api/centers"
  "identity|8081|/api/users/me/settings"
  "academy|8082|/api/students"
  "academy|8082|/api/courses"
  "academy|8082|/api/teachers"
  "payment|8083|/api/payments"
  "payment|8083|/api/invoices"
  "payment|8083|/api/fee-rules"
  "payroll|8084|/api/payroll"
  "payroll|8084|/api/salary-config"
  "attendance|8085|/api/attendance"
  "attendance|8085|/api/leave-requests"
  "connect|8086|/api/leads"
  "connect|8086|/api/notifications"
  "academy|8082|/api/permission-slips"
  "academy|8082|/api/blog/audience/PARENT"
  "ai_gateway|8087|/api/ai/health"
  "rule_engine|8088|/api/rules/health"
  "rule_engine|8088|/api/rules"
  "social_media|8089|/api/social-media/posts"
  "social_media|8089|/api/social-media/events"
)

echo "=== 2) GET endpoints ==="
printf "%-12s %-5s %-30s %-7s %6s  %s\n" "service" "port" "path" "result" "bytes" "preview"
printf "%-12s %-5s %-30s %-7s %6s  %s\n" "-------" "----" "----" "------" "-----" "-------"

OK=0; FAIL=0
for line in "${CHECKS[@]}"; do
  IFS='|' read -r name port path <<<"$line"
  hc=$(curl -s -o /tmp/lera_resp.json -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    "http://${HOST}:${port}${path}" \
    --connect-timeout 3 --max-time 10 2>/dev/null)
  size=$(wc -c </tmp/lera_resp.json | tr -d ' ')
  preview=$(head -c 60 /tmp/lera_resp.json | tr '\n' ' ' | tr -d '\r')
  if [[ "$hc" == "200" || "$hc" == "204" ]]; then
    OK=$((OK+1)); mark="OK"
  else
    FAIL=$((FAIL+1)); mark="$hc"
  fi
  printf "%-12s %-5s %-30s %-7s %6s  %s\n" "$name" "$port" "$path" "$mark" "$size" "${preview:0:60}"
done

echo
echo "=== Summary: ${OK} passed / ${FAIL} failed ==="
[[ $FAIL -eq 0 ]]
