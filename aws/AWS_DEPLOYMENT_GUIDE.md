# 🚀 LERA Platform - AWS Deployment Guide

## AWS Services Used

| Service | Purpose | Free Tier | Paid |
|---------|---------|-----------|------|
| **RDS PostgreSQL** | Database | 12 months free (db.t3.micro) | ~$15/mo |
| **Elastic Beanstalk** | Backend hosting | 12 months free (t3.micro) | ~$10/mo per service |
| **S3** | Frontend static files | 5GB free | ~$1/mo |
| **CloudFront** | CDN | 1TB/month free | ~$5/mo |
| **Route 53** | DNS | - | $0.50/mo |
| **ACM** | SSL Certificates | ✅ Free | Free |
| **Total** | | **~$0 for 12 months** | **~$50-80/mo** |

---

## Quick Deploy (One Command)

```bash
# Make script executable and run
chmod +x aws/deploy-aws.sh
./aws/deploy-aws.sh
```

---

## Manual Step-by-Step Deployment

### Prerequisites

1. **AWS Account** with billing enabled
2. **AWS CLI** installed and configured
3. **EB CLI** installed

```bash
# Install AWS CLI
brew install awscli

# Configure with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region

# Install EB CLI
pip install awsebcli
```

### Step 1: Create RDS Database

**Option A: Via AWS Console (Easier)**
1. Go to AWS Console → RDS → Create Database
2. Choose PostgreSQL 15
3. Select Free tier (db.t3.micro)
4. Set:
   - DB Instance ID: `lera-db`
   - Master Username: `lera`
   - Master Password: `YourSecurePassword`
5. Enable public access (for initial setup)
6. Create database

**Option B: Via CLI**
```bash
aws rds create-db-instance \
    --db-instance-identifier lera-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15 \
    --master-username lera \
    --master-user-password YourSecurePassword123! \
    --allocated-storage 20 \
    --publicly-accessible
```

### Step 2: Run Database Migrations

```bash
# Get RDS endpoint
aws rds describe-db-instances \
    --db-instance-identifier lera-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text

# Connect and run migrations
psql -h <rds-endpoint> -U lera -d postgres -f database/init/init.sql
```

### Step 3: Deploy Backend to Elastic Beanstalk

```bash
cd backend/identity_service

# Build
mvn clean package -DskipTests

# Initialize EB
eb init lera-identity \
    --platform "Corretto 17 running on 64bit Amazon Linux 2023" \
    --region ap-south-1

# Create environment
eb create lera-identity-prod --single

# Set environment variables
eb setenv \
    SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/postgres \
    SPRING_DATASOURCE_USERNAME=lera \
    SPRING_DATASOURCE_PASSWORD=YourSecurePassword123! \
    JWT_SECRET=your-256-bit-secret-key \
    SPRING_PROFILES_ACTIVE=prod

# Deploy
eb deploy
```

### Step 4: Deploy Frontend to S3 + CloudFront

```bash
cd frontend

# Create S3 bucket
aws s3 mb s3://lera-frontend-prod

# Enable static website hosting
aws s3 website s3://lera-frontend-prod \
    --index-document index.html \
    --error-document 404.html

# Build frontend
npm run build

# Upload to S3
aws s3 sync out/ s3://lera-frontend-prod --acl public-read

# Create CloudFront distribution (via Console is easier)
```

### Step 5: Configure Custom Domain

1. **Register domain** in Route 53 or transfer existing
2. **Create SSL Certificate** in ACM (us-east-1 for CloudFront)
3. **Add domain to CloudFront** distribution
4. **Create Route 53 records**:
   - `lera.yourdomain.com` → CloudFront
   - `api.lera.yourdomain.com` → Elastic Beanstalk

---

## Architecture Diagram

```
                    ┌─────────────────┐
                    │    Route 53     │
                    │  (DNS)          │
                    └────────┬────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐
│   CloudFront    │                   │  Application    │
│   (CDN)         │                   │  Load Balancer  │
└────────┬────────┘                   └────────┬────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│      S3         │                   │ Elastic         │
│   (Frontend)    │                   │ Beanstalk       │
│   Next.js       │                   │ (Spring Boot)   │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │      RDS        │
                                      │   PostgreSQL    │
                                      └─────────────────┘
```

---

## Security Best Practices

1. **Don't expose RDS publicly** - Use VPC private subnets
2. **Use IAM roles** instead of access keys
3. **Enable RDS encryption** at rest
4. **Use Secrets Manager** for passwords
5. **Enable CloudTrail** for audit logging
6. **Set up CloudWatch alarms** for monitoring

---

## Monitoring & Logs

```bash
# View EB logs
eb logs

# View RDS logs
aws rds describe-db-log-files --db-instance-identifier lera-db

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name CPUUtilization \
    --dimensions Name=DBInstanceIdentifier,Value=lera-db \
    --start-time 2026-01-01T00:00:00Z \
    --end-time 2026-01-12T00:00:00Z \
    --period 3600 \
    --statistics Average
```

---

## Scaling for Production

When you need more capacity:

1. **RDS**: Upgrade to db.t3.small or db.t3.medium
2. **Elastic Beanstalk**: Enable auto-scaling (2-4 instances)
3. **CloudFront**: Already auto-scales globally
4. **Add Read Replicas** for database if needed

---

## Cost Optimization Tips

1. Use **Reserved Instances** for RDS (save 30-60%)
2. Use **Spot Instances** for non-critical workloads
3. Enable **S3 Intelligent Tiering**
4. Set up **AWS Budgets** alerts
5. Use **Compute Savings Plans**

---

## Troubleshooting

### EB Deployment Failed
```bash
eb logs
eb ssh  # SSH into instance to debug
```

### RDS Connection Issues
```bash
# Check security groups allow traffic from EB
# Check RDS is in same VPC or publicly accessible
```

### CloudFront 403 Errors
```bash
# Check S3 bucket policy allows public read
# Check CloudFront origin settings
```
