#!/bin/bash
# AWS Deployment Script for LERA Platform
# Run this script from the project root

set -e

echo "🚀 LERA Platform - AWS Deployment Script"
echo "=========================================="

# ─────────────────────────────────────────────────────────────────────────────
# Configuration — every secret comes from the environment. Nothing is defaulted
# here: this file is committed, so a default IS a published credential. It used to
# ship a placeholder DB password and a literal JWT signing secret, either of which
# would have gone straight to production for anyone who ran it as-is.
#
# Export these before running, e.g. from a password manager or `aws secretsmanager
# get-secret-value`:
#
#   export DB_PASSWORD=...              # >= 8 chars
#   export JWT_SECRET=...               # >= 32 chars, valid Base64 (HS256 decodes it)
#   export LERA_INTERNAL_API_KEY=...    # >= 16 chars; openssl rand -base64 24
#   export IMAGE_REGISTRY=...           # Docker Hub namespace CI pushes to
#
# Optional but the platform is crippled without them — see aws/AWS_DEPLOYMENT_GUIDE.md:
#   LERA_SEED_CHAIRMAN_PASSWORD, LERA_SEED_CEO_PASSWORD, LERA_SEED_ADMIN_PASSWORD
#   MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENABLED
#   VNPAY_TMN_CODE, VNPAY_HASH_SECRET
#   ANTHROPIC_API_KEY
# ─────────────────────────────────────────────────────────────────────────────
REGION="${AWS_REGION:-us-east-1}"   # The template's WAFv2 WebACL is Scope=CLOUDFRONT,
                                    # which AWS only accepts in us-east-1.
ENVIRONMENT="${ENVIRONMENT:-prod}"

require() {
    local name="$1" min="$2"
    local value="${!name:-}"
    if [ -z "$value" ]; then
        echo -e "\033[0;31m$name is not set.\033[0m See the header of this script." >&2
        exit 1
    fi
    if [ -n "$min" ] && [ "${#value}" -lt "$min" ]; then
        echo -e "\033[0;31m$name is shorter than $min characters (the template rejects it).\033[0m" >&2
        exit 1
    fi
}

require DB_PASSWORD 8
require JWT_SECRET 32
require LERA_INTERNAL_API_KEY 16
require IMAGE_REGISTRY ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking AWS CLI...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Installing...${NC}"
    brew install awscli
fi

echo -e "${YELLOW}Step 2: Checking EB CLI...${NC}"
if ! command -v eb &> /dev/null; then
    echo -e "${RED}EB CLI not found. Installing...${NC}"
    pip install awsebcli
fi

echo -e "${GREEN}✓ Prerequisites installed${NC}"

# Deploy CloudFormation Stack
echo -e "${YELLOW}Step 3: Deploying AWS Infrastructure...${NC}"
aws cloudformation deploy \
    --template-file aws/cloudformation-template.yaml \
    --stack-name lera-platform-${ENVIRONMENT} \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
        DBPassword="${DB_PASSWORD}" \
        JWTSecret="${JWT_SECRET}" \
        LeraInternalApiKey="${LERA_INTERNAL_API_KEY}" \
        ImageRegistry="${IMAGE_REGISTRY}" \
        ImageTag="${IMAGE_TAG:-latest}" \
        SeedChairmanPassword="${LERA_SEED_CHAIRMAN_PASSWORD:-}" \
        SeedCeoPassword="${LERA_SEED_CEO_PASSWORD:-}" \
        SeedAdminPassword="${LERA_SEED_ADMIN_PASSWORD:-}" \
        MailEnabled="${MAIL_ENABLED:-false}" \
        MailUsername="${MAIL_USERNAME:-}" \
        MailPassword="${MAIL_PASSWORD:-}" \
        VnpayTmnCode="${VNPAY_TMN_CODE:-}" \
        VnpayHashSecret="${VNPAY_HASH_SECRET:-}" \
        AnthropicApiKey="${ANTHROPIC_API_KEY:-}" \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# The seeded Chairman/CEO/admin passwords only take effect on the FIRST boot of an
# empty database. DataLoader skips those accounts once they exist, so setting them
# after the fact does nothing — you would need a password reset instead.
if [ -z "${LERA_SEED_CHAIRMAN_PASSWORD:-}" ]; then
    echo -e "${YELLOW}WARNING: LERA_SEED_CHAIRMAN_PASSWORD is unset. On a fresh database the"
    echo -e "         Chairman password will be randomly generated and written to the logs"
    echo -e "         exactly once. If you miss it, that account is unreachable.${NC}"
fi

# Get outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name lera-platform-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name lera-platform-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text \
    --region ${REGION})

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name lera-platform-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' \
    --output text \
    --region ${REGION})

echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo "  Database: ${DB_ENDPOINT}"
echo "  S3 Bucket: ${S3_BUCKET}"
echo "  CloudFront: ${CLOUDFRONT_URL}"

# ─────────────────────────────────────────────────────────────────────────────
# The CloudFormation stack above IS the deployment. It runs all nine services and
# the frontend as ECS Fargate tasks; once it finishes, the platform is up.
#
# Steps 4-8 used to live here: build identity_service, push it to Elastic Beanstalk
# on the java-17 platform, then `npm run export` the frontend to S3 + CloudFront.
# They were removed rather than left commented, because they cannot work:
#
#   * the frontend is a Next.js SERVER build. next.config.js defines rewrites() and
#     the app ships middleware.ts, and static export supports neither — `next export`
#     refuses to run. There is no bundle of files for S3 to serve.
#   * the services are Java 25; the Beanstalk platform named there was java-17.
#   * running them alongside the stack gave two identity services on different
#     hostnames sharing one database.
#
# If LERA ever does want a second, Beanstalk-based deployment, it needs writing
# against the current architecture — not restoring from here.
# ─────────────────────────────────────────────────────────────────────────────


echo ""
echo -e "${GREEN}=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "==========================================${NC}"
echo ""
echo "Public URL:  https://${CLOUDFRONT_URL}   (CloudFront -> ALB -> nginx gateway)"
echo "Database:    ${DB_ENDPOINT}"
echo ""
echo "The API is reached through the same host, under /api — there is no separate"
echo "backend URL. All nine services and the frontend run as ECS tasks behind the"
echo "gateway; the stack finishing IS the deployment."
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update DNS to point to CloudFront"
echo "2. Add SSL certificate via AWS Certificate Manager"
echo "3. Smoke-test: curl -sS https://${CLOUDFRONT_URL}/api/auth/health"
echo "4. FIRST DEPLOY ONLY: redeploy with FlywayEnabled=true once all 9 services are RUNNING"
echo ""
