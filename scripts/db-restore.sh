#!/usr/bin/env bash
#
# Restore a LERA Postgres backup taken by the `postgres-backup` service.
#
#   ./scripts/db-restore.sh --list
#   ./scripts/db-restore.sh lera-20260909T031500Z.dump
#   ./scripts/db-restore.sh --test lera-20260909T031500Z.dump
#
# --test restores into a THROWAWAY database (lera_restore_test) and reports the
# row counts, without touching production. A backup you have never restored is
# not a backup; run this before launch and after any change to the backup job.
#
# A plain restore overwrites the LIVE database and requires typing RESTORE.
#
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.https.yml)
DB_USER="${DB_USER:-lera}"
DB_NAME="${DB_NAME:-lera}"
TEST_DB="lera_restore_test"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; NC=$'\033[0m'
say() { printf '%s\n' "${YELLOW}$*${NC}"; }
ok()  { printf '%s\n' "${GREEN}✓ $*${NC}"; }
die() { printf '%s\n' "${RED}✗ $*${NC}" >&2; exit 1; }

psql_run() { "${COMPOSE[@]}" exec -T postgres psql -U "$DB_USER" "$@"; }

if [[ "${1:-}" == "--list" || $# -eq 0 ]]; then
  say "Available backups:"
  "${COMPOSE[@]}" exec -T postgres-backup sh -c 'ls -lh /backups/lera-*.dump 2>/dev/null' \
    || die "No backups found (is the postgres-backup service running?)"
  exit 0
fi

TEST_MODE=false
if [[ "${1:-}" == "--test" ]]; then TEST_MODE=true; shift; fi
DUMP="${1:?usage: db-restore.sh [--test] <dump-file> | --list}"

"${COMPOSE[@]}" exec -T postgres-backup test -f "/backups/$DUMP" \
  || die "/backups/$DUMP not found — run --list to see what exists."

if [[ "$TEST_MODE" == true ]]; then
  say "Restore TEST into $TEST_DB (production untouched)…"
  psql_run -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" >/dev/null
  psql_run -d postgres -c "CREATE DATABASE $TEST_DB;" >/dev/null
  # Stream the dump from the backup container into pg_restore in the db container.
  "${COMPOSE[@]}" exec -T postgres-backup cat "/backups/$DUMP" \
    | "${COMPOSE[@]}" exec -T postgres pg_restore -U "$DB_USER" -d "$TEST_DB" --no-owner --no-privileges \
    || say "pg_restore reported errors — review them; some are benign (missing roles/extensions)."

  say "Row counts in the restored copy:"
  psql_run -d "$TEST_DB" -tAc "
    SELECT relname || ' = ' || n_live_tup
    FROM pg_stat_user_tables
    WHERE n_live_tup > 0
    ORDER BY n_live_tup DESC
    LIMIT 15;"
  tables=$(psql_run -d "$TEST_DB" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d '[:space:]')
  psql_run -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" >/dev/null
  [[ "${tables:-0}" -gt 0 ]] || die "Restored copy had 0 tables — this backup is NOT usable."
  ok "Restore test passed — $tables tables. Throwaway database dropped."
  exit 0
fi

printf '%s\n' "${RED}This OVERWRITES the live database '$DB_NAME'.${NC}"
read -r -p "Type RESTORE to continue: " confirm
[[ "$confirm" == "RESTORE" ]] || die "Aborted."

say "Stopping application services (leaving Postgres up)…"
"${COMPOSE[@]}" stop identity_service academy_service payment_service payroll_service \
  attendance_service connect_service ai_gateway rule_engine social_media_service frontend gateway >/dev/null

say "Restoring $DUMP into $DB_NAME…"
"${COMPOSE[@]}" exec -T postgres-backup cat "/backups/$DUMP" \
  | "${COMPOSE[@]}" exec -T postgres pg_restore -U "$DB_USER" -d "$DB_NAME" \
      --clean --if-exists --no-owner --no-privileges \
  || say "pg_restore reported errors — review before starting the app."

say "Restarting services…"
"${COMPOSE[@]}" up -d
ok "Restore complete. Check 'docker compose ps' and sign in to verify."
