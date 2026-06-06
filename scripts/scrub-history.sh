#!/usr/bin/env bash
#
# scrub-history.sh — remove committed secrets from git history (Step 2 of
# docs/SECURITY_SECRET_ROTATION_RUNBOOK.md).
#
# DESTRUCTIVE: rewrites every commit and force-pushes. Do Step 1 (rotate the live
# values) FIRST — scrubbing history does not un-leak a secret that is still valid.
#
# Safety gates (all must pass before anything is rewritten):
#   1. Must be run inside a `--mirror` clone (a bare repo), never your working checkout.
#   2. Must pass CONFIRM=yes on the command line.
#   3. git-filter-repo must be installed.
#
# Usage:
#   git clone --mirror <repo-url> lera-scrub && cd lera-scrub
#   CONFIRM=yes /path/to/scripts/scrub-history.sh
#   # review the rewritten history, then:
#   git push --force --all && git push --force --tags
#   # finally: every collaborator deletes their clone and re-clones.
#
set -euo pipefail

RED=$'\033[0;31m'; GRN=$'\033[0;32m'; YEL=$'\033[0;33m'; NC=$'\033[0m'
die() { echo "${RED}✗ $*${NC}" >&2; exit 1; }

# --- Gate 1: git-filter-repo present ---------------------------------------
command -v git-filter-repo >/dev/null 2>&1 \
  || die "git-filter-repo not found. Install: 'pip install git-filter-repo' or 'brew install git-filter-repo'"

# --- Gate 2: must be a bare/mirror clone -----------------------------------
is_bare="$(git rev-parse --is-bare-repository 2>/dev/null || echo false)"
[ "$is_bare" = "true" ] \
  || die "Not a bare repo. Run inside a mirror clone: 'git clone --mirror <url> lera-scrub && cd lera-scrub'"

# --- Gate 3: explicit confirmation -----------------------------------------
[ "${CONFIRM:-}" = "yes" ] \
  || die "Refusing to rewrite history without CONFIRM=yes. Re-run as: CONFIRM=yes $0"

# --- Replacement rules: each compromised value -> redaction token -----------
# Keep this list in sync with the table in SECURITY_SECRET_ROTATION_RUNBOOK.md.
SECRETS_FILE="$(mktemp /tmp/lera-secrets.XXXXXX)"
trap 'rm -f "$SECRETS_FILE"' EXIT
cat > "$SECRETS_FILE" <<'EOF'
bGVyYUFjYWRlbXlTZWNyZXRLZXkyMDI0VmVyeUxvbmdTZWN1cmVLZXlGb3JKd3RUb2tlbkdlbmVyYXRpb24=
leraAcademySecretKey2024VeryLongSecureKeyForJwtTokenGeneration
mkYvtzRZH/1Y5gSL198znxPfoHTWjrmGa6kF4hoNDHbh8KB5De17hS7sd65jM2BP
LERA_INTERNAL_SVC_KEY_2024
dev-internal-key-do-not-use-in-prod
lera123456
lera123
admin123
chairman123
ceo123
password123
EOF

echo "${YEL}About to rewrite ALL history in this mirror, redacting $(grep -c . "$SECRETS_FILE") secret patterns.${NC}"
echo "${YEL}This cannot be undone in this clone. Press Ctrl-C within 5s to abort...${NC}"
sleep 5

git filter-repo --force --replace-text "$SECRETS_FILE"

echo "${GRN}✓ History rewritten.${NC}"
echo "Next steps (NOT done automatically):"
echo "  1. Inspect:  git log --oneline | head ; git grep -i lera123 \$(git rev-list --all) | head"
echo "  2. Publish:  git push --force --all && git push --force --tags"
echo "  3. Tell every collaborator to delete their local clone and re-clone."
echo "  4. Confirm the gitleaks CI job is green on main."
