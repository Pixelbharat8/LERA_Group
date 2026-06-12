#!/usr/bin/env bash
# Verify local PostgreSQL is running and the LERA app user/db exist.
# Uses the same credentials as Spring Boot defaults: user lera, password lera123, DB lera.

set -euo pipefail

HOST="${DB_HOST:-127.0.0.1}"
PORT="${DB_PORT:-5432}"
USER_NAME="${DB_USER:-lera}"
DB_NAME="${DB_NAME:-lera}"
export PGPASSWORD="${DB_PASSWORD:-lera123}"

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found. Install PostgreSQL (e.g. brew install postgresql@15)."
  exit 1
fi

if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: Nothing is listening on port $PORT."
  echo "Start PostgreSQL locally, for example:"
  echo "  brew services start postgresql@15"
  echo "  # or"
  echo "  pg_ctl -D /opt/homebrew/var/postgresql@15 start"
  exit 1
fi

if psql -h "$HOST" -p "$PORT" -U "$USER_NAME" -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
  echo "OK: PostgreSQL at $HOST:$PORT — database '$DB_NAME' as user '$USER_NAME'."
  exit 0
fi

echo "ERROR: Cannot connect with: psql -h $HOST -p $PORT -U $USER_NAME -d $DB_NAME"
echo "Create role and database once (connect as your superuser, often your macOS user):"
echo "  psql postgres -c \"CREATE USER lera WITH PASSWORD 'lera123';\"  # ignore error if exists"
echo "  psql postgres -c \"ALTER USER lera WITH PASSWORD 'lera123';\""
echo "  psql postgres -c \"CREATE DATABASE lera OWNER lera;\"  # ignore error if exists"
exit 1
