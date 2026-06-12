#!/usr/bin/env bash
# Canonical stop script is ./STOP_ALL_SERVICES.sh
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/STOP_ALL_SERVICES.sh" "$@"
