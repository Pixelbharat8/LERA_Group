#!/usr/bin/env bash
# Superseded interactive wizard (wrong default ports) lives in scripts/legacy/START_SERVICES_interactive.sh
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start-lera.sh" "$@"
