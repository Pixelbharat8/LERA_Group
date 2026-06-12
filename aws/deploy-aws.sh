#!/bin/bash
# AWS Deployment Script for LERA Platform
# Run this script from the project root

set -e

echo "🚀 LERA Platform - AWS Deployment Script"
echo "=========================================="

# Configuration
REGION="ap-south-1"  # Mumbai region, change as needed
ENVIRONMENT="prod"
DB_PASSWORD="YourSecurePassword123!"  # CHANGE THIS!
JWT_SECRET="your-super-secret-jwt-key-minimum-256-bits-long"  # CHANGE THIS!

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
        Environment=${ENVIRONMENT} \
        DBPassword=${DB_PASSWORD} \
        JWTSecret=${JWT_SECRET} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

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
