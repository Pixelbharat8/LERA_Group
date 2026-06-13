#!/usr/bin/env bash
# One-off: move noisy status / gap-analysis root *.md into docs/archive/2026-05/ (T3.2).
# Preserves: README.md, QUICKSTART.md, LOCAL_STARTUP_README.md
# Run from repo root: ./scripts/archive-status-markdown-at-root.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE="$ROOT/docs/archive/2026-05"
mkdir -p "$ARCHIVE"
keep='^(README|QUICKSTART|LOCAL_STARTUP_README)\.md$'
pattern='^(ALL_|COMPLETE_|FINAL_|FIX_|GAP_|IMPLEMENTATION_|PHASE_|QUICK_|START_|STATUS_|SYSTEM_|REAL_|VISUAL_|SESSION_|SUCCESS_|README_V|MASTER_|OVERNIGHT_|NEW_LOOPHOLES|FRONTEND_|DATABASE_|LEAVE_|PAYROLL_|CHAIRMAN_|ENTERPRISE_|PUBLIC_|ROLE_|SECURITY_|TEACHER_|TESTING_|USER_|V1_|V2_|V192_|WORK_|CASCADE_|CENTER_|CONNECTION_|CONNECT_|CONTROLLERS_|CRITICAL_|CURRENT_|DEPLOYMENT_|DISCONNECTED_|DOCUMENTATION_|DYNAMIC_|E2E_|ERRORS_|FOREIGN_|FULL_|INIT_|LERA_|LOGIN_|MANUAL_|NOTIFICATION_|OPTION1_|ORGANIZATIONAL_|PACKAGE_|PRIORITY_|PROJECT_|REPORTING_|REST_|RUN_|SCRIPTS_|SERVICES_|SERVICE_|SETUP_|STATIC_|STUDENT_|SUPERADMIN_|URGENT_|VSCODE_|BROWSER_|COMPILATION_|COMPREHENSIVE_|AI_|APPROVAL_|ADMIN_|00_|ACTUAL_)'
moved=0
shopt -s nullglob
for f in "$ROOT"/*.md; do
  base="$(basename "$f")"
  [[ "$base" =~ $keep ]] && continue
  [[ "$base" =~ $pattern ]] || continue
  mv "$f" "$ARCHIVE/"
  moved=$((moved + 1))
done
echo "Moved $moved file(s) to $ARCHIVE"
