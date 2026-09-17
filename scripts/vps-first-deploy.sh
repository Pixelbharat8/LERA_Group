#!/usr/bin/env bash
#
# First deploy of the LERA platform onto a VPS (the Vietnam / data-localisation
# path: docker-compose.yml + docker-compose.https.yml, Caddy terminating TLS).
#
# Run from the repository root:
#
#   export DOMAIN=app.your-domain.vn
#   export DB_PASSWORD=…            # openssl rand -base64 24
#   export JWT_SECRET=…             # openssl rand -base64 48   (min 32 chars)
#   export LERA_INTERNAL_API_KEY=…  # openssl rand -base64 24
#   export MINIO_ROOT_USER=… MINIO_ROOT_PASSWORD=… PGADMIN_PASSWORD=…
#   export LERA_SEED_CHAIRMAN_PASSWORD=… LERA_SEED_CEO_PASSWORD=… LERA_SEED_ADMIN_PASSWORD=…
#   ./scripts/vps-first-deploy.sh
#
# WHY TWO PHASES. No migration in this repo creates the base tables — all 56 are
# overlays on a schema Hibernate builds via ddl-auto=update, and every
# V1__baseline.sql says so. Flyway runs BEFORE Hibernate, so a first boot with
# Flyway enabled against an empty database dies on:
#     ERROR: relation "course_programs" does not exist
# Phase 1 therefore starts the backends with Flyway off so the shared schema gets
# built; phase 2 restarts them with Flyway on to apply the overlays. All nine
# share one database and the migrations reach across service boundaries, so this
# cannot be done one service at a time. See docs/GO_LIVE_CHECKLIST.md §3a.
#
# Re-running this script on an ALREADY-INITIALISED database is safe: it detects
# an existing schema and skips phase 1.
#
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.https.yml)
BACKENDS=(identity_service academy_service payment_service payroll_service
          attendance_service connect_service ai_gateway rule_engine
          social_media_service)

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; NC=$'\033[0m'
say() { printf '%s\n' "${YELLOW}$*${NC}"; }
ok()  { printf '%s\n' "${GREEN}✓ $*${NC}"; }
die() { printf '%s\n' "${RED}✗ $*${NC}" >&2; exit 1; }

for v in DOMAIN DB_PASSWORD JWT_SECRET LERA_INTERNAL_API_KEY \
         MINIO_ROOT_USER MINIO_ROOT_PASSWORD PGADMIN_PASSWORD; do
  [[ -n "${!v:-}" ]] || die "$v is not set — see the header of this script."
done
(( ${#JWT_SECRET} >= 32 )) || die "JWT_SECRET must be at least 32 characters."
docker info >/dev/null 2>&1 || die "Docker is not running."

if [[ -z "${LERA_SEED_CHAIRMAN_PASSWORD:-}" ]]; then
  say "note: LERA_SEED_* not set — seed accounts get random passwords, logged ONCE at startup."
  say "      Capture them from 'docker compose logs identity_service' or you will be locked out."
fi

# Wait for the backends to report healthy (compose healthchecks hit /actuator/health).
wait_healthy() {
  local deadline=$(( SECONDS + ${1:-600} ))
  while (( SECONDS < deadline )); do
    local pending=0
    for svc in "${BACKENDS[@]}"; do
      local cid state
      cid=$("${COMPOSE[@]}" ps -q "$svc" 2>/dev/null || true)
      if [[ -z "$cid" ]]; then pending=$(( pending + 1 )); continue; fi
      state=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo starting)
      [[ "$state" == "healthy" || "$state" == "running" ]] || pending=$(( pending + 1 ))
    done
    (( pending == 0 )) && return 0
    printf '  %d/%d still starting…\n' "$pending" "${#BACKENDS[@]}"
    sleep 10
  done
  return 1
}

# Is the shared schema already built? `users` is created by identity's ddl-auto.
schema_exists() {
  "${COMPOSE[@]}" up -d postgres >/dev/null 2>&1
  for _ in $(seq 1 30); do
    if "${COMPOSE[@]}" exec -T postgres pg_isready -U lera -d lera >/dev/null 2>&1; then break; fi
    sleep 2
  done
  "${COMPOSE[@]}" exec -T postgres psql -U lera -d lera -tAc \
    "SELECT to_regclass('public.users') IS NOT NULL;" 2>/dev/null | tr -d '[:space:]' | grep -qi '^t$'
}

if schema_exists; then
  ok "Base schema already present — skipping phase 1."
  say "Starting the full stack (Flyway on)…"
  "${COMPOSE[@]}" up -d --build
else
  say "Empty database detected — running the two-phase bootstrap."
  say "Phase 1/2 — backends with Flyway DISABLED so ddl-auto can build the base schema…"
  SPRING_FLYWAY_ENABLED=false "${COMPOSE[@]}" up -d --build "${BACKENDS[@]}"
  wait_healthy 900 || die "Phase 1: services did not become healthy. Check 'docker compose logs'."
  ok "Phase 1 complete — base schema built."

  say "Phase 2/2 — restarting with Flyway ENABLED to apply the migration overlays…"
  "${COMPOSE[@]}" up -d --force-recreate "${BACKENDS[@]}"
  wait_healthy 900 || die "Phase 2: services did not become healthy — a migration probably failed. Check the logs."
  ok "Phase 2 complete — migrations applied."

  say "Starting the frontend, gateway and Caddy…"
  "${COMPOSE[@]}" up -d --build
fi

wait_healthy 600 || die "Some services are still unhealthy. Check 'docker compose ps'."

ok "Deployment complete — https://${DOMAIN}"
printf '\n%s\n' "${YELLOW}Reminders:${NC}"
printf '  • Only 80/443 are published. Postgres, pgAdmin and MinIO are internal —\n'
printf '    reach them over SSH, e.g. ssh -L 5050:localhost:5050 user@server\n'
printf '  • Caddy needs :80 reachable and %s pointing at this host for ACME.\n' "$DOMAIN"
printf '  • Change the seeded Chairman/CEO/Admin passwords at first sign-in.\n'
printf '  • Set up automated Postgres backups + a restore test (GO_LIVE §6 Layer 2).\n'
