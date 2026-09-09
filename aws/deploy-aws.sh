#!/usr/bin/env bash
#
# Deploy the LERA platform to AWS (CloudFormation + ECS Fargate).
#
# Secrets come from the environment — nothing is hard-coded here. Export these
# before running:
#
#   export DB_PASSWORD='…'              # RDS master password (min 8 chars)
#   export JWT_SECRET='…'               # min 32 chars: openssl rand -base64 48
#   export LERA_INTERNAL_API_KEY='…'    # min 16 chars: openssl rand -base64 24
#   export IMAGE_REGISTRY='…'           # Docker Hub namespace CI pushes to
#
# Optional: ENVIRONMENT (prod), IMAGE_TAG (latest), DESIRED_COUNT (1),
#           DB_NAME (postgres), REGION (us-east-1).
#
# FIRST DEPLOY ON AN EMPTY DATABASE runs in two phases automatically. No
# migration in this repo creates the base tables — all 56 are overlays on a
# schema Hibernate builds — so a first boot with Flyway enabled dies on
#   ERROR: relation "course_programs" does not exist
# Phase 1 therefore runs with Flyway off so ddl-auto=update can build the shared
# schema; phase 2 turns Flyway on to apply the overlays. See
# docs/GO_LIVE_CHECKLIST.md §3a. Subsequent deploys skip phase 1.
#
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-prod}"
STACK_NAME="${STACK_NAME:-lera-${ENVIRONMENT}}"
# WAFv2 WebACL is Scope=CLOUDFRONT, which AWS only allows in us-east-1.
REGION="${REGION:-us-east-1}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DESIRED_COUNT="${DESIRED_COUNT:-1}"
DB_NAME="${DB_NAME:-postgres}"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; NC=$'\033[0m'
say()  { printf '%s\n' "${YELLOW}$*${NC}"; }
ok()   { printf '%s\n' "${GREEN}✓ $*${NC}"; }
die()  { printf '%s\n' "${RED}✗ $*${NC}" >&2; exit 1; }

BACKEND_SERVICES=(identity_service academy_service payment_service payroll_service
                  attendance_service connect_service ai_gateway rule_engine
                  social_media_service)
ALL_SERVICES=("${BACKEND_SERVICES[@]}" frontend gateway)

# ---------------------------------------------------------------- preflight --
command -v aws >/dev/null 2>&1 || die "AWS CLI not found. Install it, then re-run."

for var in DB_PASSWORD JWT_SECRET LERA_INTERNAL_API_KEY IMAGE_REGISTRY; do
  [[ -n "${!var:-}" ]] || die "$var is not set. See the header of this script."
done
(( ${#JWT_SECRET} >= 32 )) || die "JWT_SECRET must be at least 32 characters."
(( ${#LERA_INTERNAL_API_KEY} >= 16 )) || die "LERA_INTERNAL_API_KEY must be at least 16 characters."

aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1 \
  || die "AWS credentials are not configured for region $REGION."
ok "Preflight passed (stack $STACK_NAME, region $REGION)"

# --------------------------------------------------------------- deploy fn ---
deploy_stack() {
  local flyway_enabled=$1
  aws cloudformation deploy \
    --template-file aws/cloudformation-template.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --region "$REGION" \
    --parameter-overrides \
      Environment="$ENVIRONMENT" \
      DBPassword="$DB_PASSWORD" \
      JWTSecret="$JWT_SECRET" \
      LeraInternalApiKey="$LERA_INTERNAL_API_KEY" \
      ImageRegistry="$IMAGE_REGISTRY" \
      ImageTag="$IMAGE_TAG" \
      ServiceDesiredCount="$DESIRED_COUNT" \
      DBName="$DB_NAME" \
      FlywayEnabled="$flyway_enabled"
}

stack_output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

wait_for() {   # wait_for <service…> — ECS allows at most 10 per call
  local cluster=$1; shift
  local batch=()
  for svc in "$@"; do
    batch+=("$svc")
    if (( ${#batch[@]} == 10 )); then
      aws ecs wait services-stable --cluster "$cluster" --services "${batch[@]}" --region "$REGION"
      batch=()
    fi
  done
  # `if` rather than `(( … )) && …`: when the service count is an exact multiple
  # of 10 the trailing batch is empty, `(( 0 ))` returns non-zero, and under
  # `set -e` that would abort the deploy just as it finished waiting.
  if (( ${#batch[@]} )); then
    aws ecs wait services-stable --cluster "$cluster" --services "${batch[@]}" --region "$REGION"
  fi
}

# ------------------------------------------------------------------ deploy ---
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
  FIRST_DEPLOY=false
  say "Stack $STACK_NAME exists — incremental deploy (Flyway on)."
else
  FIRST_DEPLOY=true
  say "Stack $STACK_NAME does not exist — first deploy, running the two-phase bootstrap."
fi

if [[ "$FIRST_DEPLOY" == true ]]; then
  say "Phase 1/2 — creating the stack with Flyway DISABLED so Hibernate can build the base schema…"
  deploy_stack false
  CLUSTER=$(stack_output EcsClusterName)
  say "Waiting for the 9 backend services to report stable (this builds the shared schema)…"
  wait_for "$CLUSTER" "${BACKEND_SERVICES[@]}"
  ok "Phase 1 complete — base schema built."

  say "Phase 2/2 — re-deploying with Flyway ENABLED to apply the migration overlays…"
  deploy_stack true
else
  deploy_stack true
fi

CLUSTER=$(stack_output EcsClusterName)

# `cloudformation deploy` is a no-op when only the :latest image content changed,
# so force a fresh task set per service.
say "Rolling all services onto ${IMAGE_REGISTRY}/*:${IMAGE_TAG}…"
for svc in "${ALL_SERVICES[@]}"; do
  aws ecs update-service --cluster "$CLUSTER" --service "$svc" \
    --force-new-deployment --region "$REGION" --no-cli-pager >/dev/null
  printf '  rolling %s\n' "$svc"
done

say "Waiting for every service to stabilise…"
wait_for "$CLUSTER" "${ALL_SERVICES[@]}"

ok "Deployment complete"
printf '  Public URL : %s\n' "$(stack_output FrontendURL)"
printf '  ALB        : %s\n' "$(stack_output LoadBalancerDNS)"
printf '  Database   : %s\n' "$(stack_output DatabaseEndpoint)"
printf '  ECS cluster: %s\n' "$CLUSTER"

if [[ "$FIRST_DEPLOY" == true ]]; then
  printf '\n%s\n' "${YELLOW}First deploy: seed accounts were created with passwords from LERA_SEED_* (or"
  printf '%s\n' "randomly generated and logged once — check CloudWatch). Sign in and change them.${NC}"
fi
