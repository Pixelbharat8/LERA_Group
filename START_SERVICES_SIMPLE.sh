#!/usr/bin/env bash
# Deprecated alias — canonical launcher is ./start-lera.sh (pair with ./STOP_ALL_SERVICES.sh).
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start-lera.sh" "$@"
