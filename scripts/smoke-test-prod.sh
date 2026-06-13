#!/usr/bin/env bash
# Post-deploy smoke test against a DEPLOYED LERA stack (single gateway host, HTTPS).
#
# Unlike scripts/smoke-test.sh (which hits each service on its own localhost port),
# this targets the production topology: one base URL where the gateway routes every
# /api/* path to the right service. Use it right after a deploy, before opening the
# doors.
#
#   LERA_BASE_URL=https://app.your-domain.com \
#   LERA_TEST_EMAIL=chairman@your-domain.com \
#   LERA_TEST_PASSWORD='...' \
#     scripts/smoke-test-prod.sh
#
# Read-only: it logs in and GETs. No mutations. Exit 0 only if every check passes.

set -u

BASE="${LERA_BASE_URL:-}"
EMAIL="${LERA_TEST_EMAIL:-}"
PASSWORD="${LERA_TEST_PASSWORD:-}"

if [[ -z "$BASE" || -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "!! Set LERA_BASE_URL, LERA_TEST_EMAIL and LERA_TEST_PASSWORD." >&2
  echo "   (No insecure defaults — prod seed passwords are random/configured.)" >&2
  exit 2
fi
BASE="${BASE%/}"  # strip trailing slash

pass=0; fail=0
check() { # check <label> <method> <path> <expected-codes-csv> [auth]
  local label="$1" method="$2" path="$3" expect="$4" auth="${5:-}"
  local hdr=(); [[ -n "$auth" ]] && hdr=(-H "Authorization: Bearer ${auth}")
  local code
  code=$(curl -s -o /tmp/lera_smoke.out -w "%{http_code}" -X "$method" \
    "${hdr[@]}" "${BASE}${path}" --connect-timeout 5 --max-time 20 2>/dev/null)
  if [[ ",$expect," == *",$code,"* ]]; then
    printf "  ✅ %-34s %s\n" "$label" "$code"; pass=$((pass+1))
  else
    printf "  ❌ %-34s %s (expected %s)\n" "$label" "$code" "$expect"; fail=$((fail+1))
  fi
}

echo "=== LERA prod smoke test → ${BASE} ==="

echo "[1] Reachability (unauthenticated public surface)"
check "frontend root"          GET "/"                       "200,301,302,304"
check "public centres"         GET "/api/centers/active"     "200"

echo "[2] Auth"
LOGIN=$(curl -s -X POST "${BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" --max-time 20)
TOKEN=$(printf '%s' "$LOGIN" | python3 -c '
import sys, json
try: d = json.load(sys.stdin)
except Exception: print(""); sys.exit(0)
for src in (d, d.get("data") or {}):
    for k in ("token","accessToken"):
        if src.get(k): print(src[k]); sys.exit(0)
print("")' 2>/dev/null)
if [[ -z "$TOKEN" ]]; then
  echo "  ❌ login failed — no token. Response:"; echo "$LOGIN" | head -c 300; echo
  echo "=== FAILED (auth) ==="; exit 1
fi
echo "  ✅ login ok (token len ${#TOKEN})"; pass=$((pass+1))

echo "[3] Authenticated reads across all 9 services (gateway-routed)"
check "identity: users"        GET "/api/users"                      "200" "$TOKEN"
check "identity: my settings"  GET "/api/users/me/settings"          "200" "$TOKEN"
check "academy: students"      GET "/api/students"                   "200" "$TOKEN"
check "academy: classes"       GET "/api/classes"                    "200" "$TOKEN"
check "academy: teachers"      GET "/api/teachers"                   "200" "$TOKEN"
check "payment: payments"      GET "/api/payments"                   "200" "$TOKEN"
check "payment: invoices"      GET "/api/invoices"                   "200" "$TOKEN"
check "payment: finance sum"   GET "/api/finance/dashboard/summary"  "200,404" "$TOKEN"
check "payroll: payroll"       GET "/api/payroll"                    "200" "$TOKEN"
check "attendance: records"    GET "/api/attendance"                 "200" "$TOKEN"
check "connect: leads"         GET "/api/leads"                      "200" "$TOKEN"
check "connect: notifications" GET "/api/notifications"              "200,204" "$TOKEN"
check "connect: chat convos"   GET "/api/chat/conversations"         "200" "$TOKEN"
check "rule_engine: rules"     GET "/api/rules"                      "200" "$TOKEN"
check "social: posts"          GET "/api/social-media/posts"         "200" "$TOKEN"

echo "[4] Security posture (internal metrics must NOT be public)"
check "prometheus is gated"    GET "/actuator/prometheus"            "401,403,404" ""

echo
echo "=== ${pass} passed / ${fail} failed ==="
[[ $fail -eq 0 ]]
