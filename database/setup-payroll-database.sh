#!/bin/bash

# =====================================================
# COMPLETE DATABASE SETUP SCRIPT
# =====================================================
# Purpose: Run all database migrations in correct order
# Usage: ./setup-payroll-database.sh

set -e  # Exit on error

echo "🚀 Starting Payroll System Database Setup..."
echo ""

# Database credentials (change these to match your setup)
POSTGRES_USER="rahulsharma"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"

# All services use the same database
DB_NAME="lera"

echo "📊 Step 1: Creating teacher_sessions table..."
psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -f database/migrations/create_teacher_sessions.sql

if [ $? -eq 0 ]; then
  echo "✅ teacher_sessions table created successfully"
else
  echo "❌ Failed to create teacher_sessions table"
  exit 1
fi

echo ""
echo "💰 Step 2: Creating teacher_salary_config table..."
psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -f database/migrations/create_teacher_salary_config.sql

if [ $? -eq 0 ]; then
  echo "✅ teacher_salary_config table created successfully"
else
  echo "❌ Failed to create teacher_salary_config table"
  exit 1
fi

echo ""
echo "📝 Step 3: Updating payroll table with new columns..."
psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -f database/migrations/update_payroll_table.sql

if [ $? -eq 0 ]; then
  echo "✅ payroll table updated successfully"
else
  echo "❌ Failed to update payroll table"
  exit 1
fi

echo ""
echo "🔍 Step 4: Verifying data..."

# Count teacher sessions
SESSION_COUNT=$(psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -t -c "SELECT COUNT(*) FROM teacher_sessions;")
echo "   - Teacher sessions created: $SESSION_COUNT"

# Count salary configs
CONFIG_COUNT=$(psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -t -c "SELECT COUNT(*) FROM teacher_salary_config;")
echo "   - Salary configs created: $CONFIG_COUNT"

# Count payroll records with teacher names
PAYROLL_COUNT=$(psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $DB_NAME \
  -t -c "SELECT COUNT(*) FROM payroll WHERE teacher_name IS NOT NULL;")
echo "   - Payroll records with teacher names: $PAYROLL_COUNT"

echo ""
echo "✨ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Restart backend services:"
echo "   cd backend/attendance_service && mvn spring-boot:run"
echo "   cd backend/payroll_service && mvn spring-boot:run"
echo ""
echo "2. Login to admin panel:"
echo "   http://localhost:3000/auth/login"
echo ""
echo "3. Generate payroll:"
echo "   Navigate to Payroll → Click 'Generate Payroll for All Teachers'"
echo ""
echo "🎉 You should now see real teacher names and hours!"
