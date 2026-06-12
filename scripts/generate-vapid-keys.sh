#!/usr/bin/env bash
# Emit a fresh VAPID key pair for Web Push (RFC 8292).
#
# Usage:
#   ./scripts/generate-vapid-keys.sh
#
# Wire-up:
#   Frontend (.env.local):  NEXT_PUBLIC_VAPID_PUBLIC_KEY="<Public Key line>"
#   Backend / connect_service env:
#       WEB_PUSH_VAPID_PUBLIC_KEY="<same public>"
#       WEB_PUSH_VAPID_PRIVATE_KEY="<Private Key line>"
#
# The `web-push` CLI prints exactly two lines — public first, private second.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found — install Node.js" >&2
  exit 1
fi

echo "=== VAPID keys (keep private key secret; never commit it) ===" >&2
npx --yes web-push generate-vapid-keys
