#!/usr/bin/env bash
# Stop processes bound to LERA local dev ports (Spring defaults + Next.js).

set -euo pipefail

PORTS=(3000 8081 8082 8083 8084 8085 8086 8087 8088 8089)

for p in "${PORTS[@]}"; do
  pids=$(lsof -nP -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "${pids:-}" ]]; then
    echo "Stopping PID(s) on port $p: $pids"
    kill $pids 2>/dev/null || true
  fi
done

sleep 1

for p in "${PORTS[@]}"; do
  pids=$(lsof -nP -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "${pids:-}" ]]; then
    echo "Force kill on port $p: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "Done. (PostgreSQL on 5432 was not stopped — only app ports.)"
