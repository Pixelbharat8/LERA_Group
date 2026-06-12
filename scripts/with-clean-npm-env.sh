#!/usr/bin/env bash
# npm 10+ warns on unknown env keys; Homebrew/Cursor sometimes set npm_config_devdir.
unset npm_config_devdir NPM_CONFIG_DEVDIR 2>/dev/null || true
exec "$@"
