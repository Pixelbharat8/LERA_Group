#!/bin/bash
#!/usr/bin/env bash
set -euo pipefail   # optional: exit on error, treat unset vars as errors, and fail pipelines
# ===========================================================
# LERA Academy - Local Development Setup for macOS
# ===========================================================
# This script sets up PostgreSQL locally on your Mac
# ===========================================================

# Ensure Homebrew is on PATH (Apple Silicon + Intel)
if [ -x "/opt/homebrew/bin/brew" ]; then
    export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
elif [ -x "/usr/local/bin/brew" ]; then
    export PATH="/usr/local/bin:/usr/local/sbin:$PATH"
fi

echo "🚀 LERA Academy - Local PostgreSQL Setup"
echo "========================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."

    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found on PATH even after setup."
        echo "   Try restarting Terminal, or run:"
        echo "   eval \"$(/opt/homebrew/bin/brew shellenv)\""
        exit 1
    fi

    brew install postgresql@15 || {
        echo "❌ Failed to install postgresql@15 via Homebrew."
        echo "   Try running: brew doctor"
        exit 1
    }

    # Add to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
fi

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
if ! brew services start postgresql@15; then
    echo "❌ Could not start postgresql@15 via brew services."
    echo "   Check status: brew services list"
    echo "   Check logs:   tail -n 200 /opt/homebrew/var/log/postgresql@15.log"
    exit 1
fi

# Wait for PostgreSQL to start
sleep 3

# Verify PostgreSQL is responding (use an existing role first)
# NOTE: Fresh Homebrew clusters often allow local connections for the current macOS user via peer auth.
BOOTSTRAP_USER="$(whoami)"
if ! psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    # fallback to default superuser role name on many installs
    if ! psql -h localhost -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "⚠️  PostgreSQL service started, but psql cannot connect on localhost:5432 yet."
        echo "   Try: brew services restart postgresql@15"
        echo "   Check port: lsof -nP -iTCP:5432 -sTCP:LISTEN"
        echo "   Check logs: tail -n 200 /opt/homebrew/var/log/postgresql@15.log"
        exit 1
    fi
    BOOTSTRAP_USER="postgres"
fi

# Create database and user
echo "📊 Creating LERA database and user..."
# Create role if missing (run via bootstrap user)
if ! psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='lera';" | grep -q 1; then
    psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -c "CREATE ROLE lera WITH LOGIN SUPERUSER;" >/dev/null
fi
psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -c "ALTER USER lera WITH PASSWORD 'lera123';" >/dev/null

# Create database if missing (run via bootstrap user)
if ! psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='lera';" | grep -q 1; then
    psql -h localhost -U "$BOOTSTRAP_USER" -d postgres -c "CREATE DATABASE lera OWNER lera;" >/dev/null
fi

# Run database initialization and migrations
echo ""
echo "🗄️  Running database schema initialization..."

# Run init.sql
if [ -f "database/init/init.sql" ]; then
    echo "   → Applying init.sql..."
    PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/init/init.sql -q 2>&1 | grep -v "NOTICE" || true
    echo "   ✓ Base schema applied"
else
    echo "   ⚠️  Warning: database/init/init.sql not found"
fi

# Run migration
if [ -f "database/migrations/V2__add_missing_66_tables.sql" ]; then
    echo "   → Applying V2 migration (66 missing tables)..."
    PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/migrations/V2__add_missing_66_tables.sql -q 2>&1 | grep -v "NOTICE" || true
    echo "   ✓ Migration applied"
else
    echo "   ⚠️  Warning: database/migrations/V2__add_missing_66_tables.sql not found"
fi

# Run migration V3 (107 required list compatibility)
if [ -f "database/migrations/V3__required_107_missing_tables.sql" ]; then
    echo "   → Applying V3 migration (required 107 missing tables)..."
    PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/migrations/V3__required_107_missing_tables.sql -q 2>&1 | grep -v "NOTICE" || true
    echo "   ✓ Migration V3 applied"
else
    echo "   ⚠️  Warning: database/migrations/V3__required_107_missing_tables.sql not found"
fi

# Count tables
echo ""
echo "📊 Verifying database schema..."

# Count ALL base tables (diagnostic)
ALL_TABLE_COUNT=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

# Count REQUIRED tables (authoritative list)
REQUIRED_TABLES=(
  activity_logs ai_chat_messages ai_chat_sessions ai_content_summaries ai_embeddings ai_exam_requests ai_generated_exams api_keys
  assignment_submissions attendance attendance_exceptions attendance_records audit_logs background_jobs badges banners blog_posts
  bookstore_order_items bookstore_orders call_logs campaign_leads center_settings centers certificate_templates certificates
  chat_messages chat_rooms class_sessions class_schedules classes client_communication_logs client_documents client_notes
  client_tasks communication_templates complaints contact_messages course_categories course_contents course_enrollments
  course_feedback courses crm_clients crm_deals crm_pipelines crm_stages crm_tasks curriculum curriculum_subjects
  curriculum_units dashboard_widgets deal_notes deal_stage_history deal_tasks departments discounts document_templates documents
  email_logs employee_documents employee_profiles employee_roles employee_salary_history employee_shifts employee_timesheets
  employees enrollments exam_attempts exam_questions exams expenses fee_components fee_payments fee_structures fee_types
  gateway_config grade_levels holiday_calendar identity_documents invoices job_applications job_postings lead_sources
  leave_requests lesson_plans meal_plans media_library menu_items messages notification_logs notifications parent_student_links
  parents payment_gateway_transactions payment_methods payment_plans payments payroll_batches payroll_items payroll_runs
  permissions policies profiles programs promotions query_logs receipts refunds report_templates roles rule_definitions
  rule_executions rule_logs salary_components salary_structures school_settings sections security_events settings staff
  student_attendance student_documents student_guardians student_health student_notes student_profiles students subject_grades
  subjects support_tickets syllabus system_config tax_rates teacher_assignments teachers tenant_settings tenants terms
  transactions user_mfa user_profiles user_role_assignments users website_pages website_settings workflows
)

REQUIRED_TOTAL=${#REQUIRED_TABLES[@]}
REQUIRED_COUNT=0
MISSING_TABLES=()
for t in "${REQUIRED_TABLES[@]}"; do
  if PGPASSWORD=lera123 psql -h localhost -U lera -d lera -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name='${t}';" 2>/dev/null | grep -q 1; then
    REQUIRED_COUNT=$((REQUIRED_COUNT+1))
  else
    MISSING_TABLES+=("$t")
  fi
done

echo ""
echo "✅ PostgreSQL is now running locally on localhost!"
echo ""
echo "📋 Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: lera"
echo "   Username: lera"
echo "   Password: lera123"
echo ""
echo "Database Status:"
echo "   Tables (required): ${REQUIRED_COUNT}/${REQUIRED_TOTAL}"
echo "   Tables (all):      ${ALL_TABLE_COUNT}/?"
if [ "$REQUIRED_COUNT" = "$REQUIRED_TOTAL" ]; then
    echo "   Status: All ${REQUIRED_TOTAL} required tables are present."
else
    MISSING_COUNT=${#MISSING_TABLES[@]}
    echo "   Status: Missing ${MISSING_COUNT} required tables."
    echo "   Missing (first 25): ${MISSING_TABLES[*]:0:25}"
fi
echo ""
echo "Useful Commands:"
echo "   Connect: psql -h localhost -U lera -d lera"
echo "   Stop:    brew services stop postgresql@15"
echo "   Start:   brew services start postgresql@15"
echo "   Status:  brew services list"
echo "   Tables:  psql -h localhost -U lera -d lera -c '\\dt'"
echo ""