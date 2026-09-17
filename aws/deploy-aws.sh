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
# STOP — steps 4-8 below contradict the CloudFormation stack deployed above.
#
# The template runs all 9 backend services AND the frontend as ECS Fargate tasks
# behind service discovery; once `cloudformation deploy` returns, the platform is
# already running. The steps below then deploy a SECOND, separate copy of
# identity_service to Elastic Beanstalk (on the java-17 platform — the services
# are Java 25 now) and push a static export of the frontend to S3.
#
# Running them gives you two identity services on different hostnames sharing one
# database, and a static frontend that cannot serve the dashboard's API routes.
# Decide which deployment model LERA is using and delete the other half. Until
# then these steps are left in place rather than removed on our own judgement.
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}Steps 4-8 are stale (see the comment above). Skipping.${NC}"
echo -e "${GREEN}Stack deployed. Frontend: https://${CLOUDFRONT_URL}${NC}"
exit 0

# Build and deploy backend
echo -e "${YELLOW}Step 4: Building Identity Service...${NC}"
cd backend/identity_service
mvn clean package -DskipTests

echo -e "${YELLOW}Step 5: Deploying to Elastic Beanstalk...${NC}"
eb init lera-identity --platform java-17 --region ${REGION} || true
eb create lera-identity-${ENVIRONMENT} --single || eb deploy lera-identity-${ENVIRONMENT}

eb setenv \
    SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_ENDPOINT}:5432/postgres \
    SPRING_DATASOURCE_USERNAME=lera \
    SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD} \
    JWT_SECRET=${JWT_SECRET} \
    SPRING_PROFILES_ACTIVE=prod \
    FRONTEND_URL=https://${CLOUDFRONT_URL}

cd ../..

# Build and deploy frontend
echo -e "${YELLOW}Step 6: Building Frontend...${NC}"
cd frontend

# Update environment
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://lera-identity-${ENVIRONMENT}.${REGION}.elasticbeanstalk.com
NEXT_PUBLIC_IDENTITY_API=https://lera-identity-${ENVIRONMENT}.${REGION}.elasticbeanstalk.com
NEXT_PUBLIC_APP_URL=https://${CLOUDFRONT_URL}
EOF

npm run build
npm run export 2>/dev/null || npm run build

echo -e "${YELLOW}Step 7: Deploying to S3...${NC}"
aws s3 sync out/ s3://${S3_BUCKET} --delete --region ${REGION}

# Invalidate CloudFront cache
echo -e "${YELLOW}Step 8: Invalidating CloudFront cache...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='${S3_BUCKET}.s3.${REGION}.amazonaws.com'].Id" \
    --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id ${DISTRIBUTION_ID} \
        --paths "/*"
fi

cd ..

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "==========================================${NC}"
echo ""
echo "Frontend URL: https://${CLOUDFRONT_URL}"
echo "Backend URL:  https://lera-identity-${ENVIRONMENT}.${REGION}.elasticbeanstalk.com"
echo "Database:     ${DB_ENDPOINT}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update DNS to point to CloudFront"
echo "2. Add SSL certificate via AWS Certificate Manager"
echo "3. Test all endpoints"
echo ""
