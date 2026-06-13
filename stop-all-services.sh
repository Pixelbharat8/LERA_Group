#!/usr/bin/env bash
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/STOP_ALL_SERVICES.sh" "$@"
