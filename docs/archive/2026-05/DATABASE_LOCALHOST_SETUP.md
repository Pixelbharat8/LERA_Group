# 🗄️ LERA Academy - Database Setup Guide

## Overview
This guide will help you set up the complete LERA Academy database schema with all **107 tables** running on **localhost PostgreSQL**.

## Prerequisites
- macOS
- Homebrew (will be installed automatically if missing)

## Quick Start

### 1. Run the Setup Script
```bash
./setup-local-postgres.sh
```

This script will:
- ✅ Install PostgreSQL 15 via Homebrew (if not already installed)
- ✅ Start PostgreSQL service
- ✅ Create database `lera` and user `lera`
- ✅ Run `database/init/init.sql` (base schema ~41 tables)
- ✅ Run `database/migrations/V2__add_missing_66_tables.sql` (66 additional tables)
- ✅ Verify all 107 tables are created
- ✅ Display connection details

### 2. Verify Schema (Optional)
```bash
./verify-schema.sh
```

This will verify all 107 tables exist and show detailed statistics.

## Connection Details
After running the setup script, you can connect to your local database:

```bash
Host:     localhost
Port:     5432
Database: lera
Username: lera
Password: lera123
```

### Connect via psql
```bash
psql -h localhost -U lera -d lera
```

### Connect from Spring Boot
Update your `application.yml` or `application.properties`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/lera
    username: lera
    password: lera123
    driver-class-name: org.postgresql.Driver
```

## Database Schema (107 Tables)

### Module Breakdown

#### **A. Multi-tenant + Auth + RBAC** (9 tables)
- `tenants` - Multi-tenant foundation
- `tenant_settings` - Tenant-specific settings
- `center_settings` - Center-specific settings
- `user_roles` - User-role assignments
- `impersonation_logs` - Admin impersonation tracking
- `activity_logs` - User activity tracking
- `login_history` - Login/logout history
- `system_settings` - System-wide settings
- `feature_flags` - Feature flag management

#### **B. Students & Parents** (5 tables)
- `students` (base)
- `student_parents` - Student-parent relationships
- `parent_profiles` - Extended parent information
- `student_documents` - Student document management
- `student_skill_levels` - Student skill tracking

#### **C. Teachers** (3 tables)
- `teachers` (base)
- `teacher_documents` - Teacher document management
- `teacher_skill_levels` - Teacher skill tracking

#### **D. Courses** (3 tables)
- `course_modules` - Course module structure
- `course_lessons` - Individual lessons
- `course_materials` - Lesson materials

#### **E. Classes & Attendance** (3 tables)
- `attendance_records` (base)
- `class_schedules` - Class scheduling
- `attendance_exceptions` - Attendance special cases

#### **F. Assignments & Exams** (2 tables)
- `class_assignments` - Assignment management
- `assignment_submissions` - Student submissions

#### **G. Certificates** (2 tables)
- `certificate_templates` - Certificate templates
- `certificates` - Issued certificates

#### **H. CRM Extensions** (14 tables)
- `leads` (base)
- `lead_statuses` - Lead status options
- `lead_notes` - Lead notes
- `lead_tags` - Tag definitions
- `lead_tag_assignments` - Lead-tag relationships
- `lead_activities` - Lead activity tracking
- `lead_assignments` - Lead assignment history
- `chat_messages` - CRM chat messages
- `call_logs` - Call tracking
- `email_logs` - Email tracking
- `crm_automations` - CRM automation rules
- `crm_automation_rules` - Automation rule details
- `crm_triggers` - Automation trigger logs
- `marketing_campaigns` - Marketing campaigns
- `campaign_leads` - Campaign-lead relationships

#### **I. Payments** (6 tables)
- `invoices` (base)
- `invoice_items` (base)
- `payments` (base)
- `payment_methods` - Payment method options
- `scholarships` - Scholarship programs
- `student_scholarships` - Student scholarship assignments

#### **J. Payroll** (7 tables)
- `payroll` (base)
- `payroll_cycles` - Payroll period management
- `teacher_salaries` - Teacher salary records
- `salary_components` - Salary component breakdown
- `salary_payouts` - Payout tracking
- `tax_settings` - Tax configuration
- `teacher_overtime` - Overtime tracking

#### **K. AI Gateway** (6 tables)
- `ai_exam_requests` - AI exam generation requests
- `ai_generated_exams` - Generated exam content
- `ai_content_summaries` - AI-generated summaries
- `ai_chat_sessions` - AI chat sessions
- `ai_chat_messages` - Chat messages
- `ai_embeddings` - Vector embeddings (JSONB or vector(1536))

#### **L. Website** (4 tables)
- `website_pages` - CMS pages
- `website_sections` - Page sections
- `website_home_sections` - Homepage sections
- `website_contacts` - Contact form submissions

#### **M. Sports/PlayCircle** (6 tables)
- `sports_programs` - Sports program definitions
- `sports_teams` - Team management
- `sports_coaches` - Coach profiles
- `sports_matches` - Match tracking
- `sports_training_sessions` - Training sessions
- `sports_player_stats` - Player statistics

#### **N. Notifications** (2 tables)
- `notifications` (base)
- `notification_preferences` - User notification preferences

#### **O. Storage/Media** (1 table)
- `files` - Generic file storage

#### **P. Transport & Bookstore** (4 tables)
- `transport_routes` - Transport route management
- `transport_students` - Student transport assignments
- `bookstore_products` - Bookstore inventory
- `bookstore_orders` - Bookstore orders

#### **Q. Internal Ops** (5 tables)
- `email_templates` - Email template management
- `sms_templates` - SMS template management
- `api_keys` - API key management
- `background_jobs` - Background job queue

#### **Base Schema** (~31 tables from init.sql)
- `centers`, `roles`, `permissions`, `role_permissions`, `users`, `user_sessions`
- `audit_logs`, `course_programs`, `course_levels`, `classes`, `enrollments`
- `class_sessions`, `exams`, `exam_questions`, `exam_results`, `assignments`
- `assignment_results`, `followups`, `payment_history`, `payroll_items`
- `website_banners`, `website_testimonials`, `faqs`, etc.

---

## Useful Commands

### Database Management
```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Check status
brew services list

# Connect to database
psql -h localhost -U lera -d lera

# List all tables
psql -h localhost -U lera -d lera -c '\dt'

# Count tables
psql -h localhost -U lera -d lera -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

### Reset Database
```bash
# Drop and recreate (WARNING: destroys all data)
dropdb lera
createdb -O lera lera
./setup-local-postgres.sh
```

### Backup & Restore
```bash
# Backup
pg_dump -h localhost -U lera lera > lera_backup.sql

# Restore
psql -h localhost -U lera -d lera < lera_backup.sql
```

## PostgreSQL Extensions

The schema automatically installs these extensions:

- **uuid-ossp** - UUID generation (required)
- **pgvector** - Vector embeddings for AI features (optional)

If pgvector is not installed, the `ai_embeddings.embedding_vector` column will use JSONB as a fallback.

## Troubleshooting

### PostgreSQL won't start
```bash
# Check if it's already running
brew services list

# Restart
brew services restart postgresql@15

# Check logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Connection refused
```bash
# Make sure PostgreSQL is listening on port 5432
lsof -i :5432

# Check pg_hba.conf allows local connections
cat /opt/homebrew/var/postgresql@15/pg_hba.conf
```

### Tables not created
```bash
# Re-run migrations manually
PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/init/init.sql
PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/migrations/V2__add_missing_66_tables.sql

# Verify
./verify-schema.sh
```

## Next Steps

1. ✅ Run `./setup-local-postgres.sh` to create all 107 tables
2. ✅ Verify with `./verify-schema.sh`
3. ✅ Update your microservices to use `localhost:5432`
4. ✅ Start developing!

## Support

For issues or questions, please check:
- PostgreSQL logs: `/opt/homebrew/var/log/postgresql@15.log`
- Schema verification: `./verify-schema.sh`
- Manual verification: `psql -h localhost -U lera -d lera -c '\dt'`
