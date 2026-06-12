# 🚀 LERA Academy Database - Setup Complete Guide

## What the Setup Script Does

When you run `./setup-local-postgres.sh`, it performs these steps:

### Step 1: Install PostgreSQL 15 ✅
- Checks if Homebrew is installed (installs if needed)
- Installs PostgreSQL 15 via Homebrew (if not already installed)
- Adds PostgreSQL to your PATH

### Step 2: Create Database ✅
- Starts PostgreSQL service
- Creates user `lera` with password `lera123`
- Creates database `lera`

### Step 3: Run Base Schema ✅
- Runs `database/init/init.sql`
- Creates ~41 base tables:
  - Identity & Access (centers, users, roles, permissions)
  - Academy (courses, classes, students, teachers, enrollments)
  - Attendance (class_sessions, attendance_records)
  - Exams (exams, exam_questions, exam_results)
  - Assignments
  - CRM (leads, followups)
  - Payments (invoices, invoice_items, payments)
  - Payroll
  - Website (banners, testimonials, FAQs)

### Step 4: Run Migration ✅
- Runs `database/migrations/V2__add_missing_66_tables.sql`
- Adds 66 additional tables across 17 modules:
  - Multi-tenant (9 tables)
  - Students & Parents (5 tables)
  - Teachers (3 tables)
  - Courses (3 tables)
  - Classes & Attendance (3 tables)
  - Assignments & Exams (2 tables)
  - Certificates (2 tables)
  - CRM Extensions (14 tables)
  - Payments (3 tables)
  - Payroll (6 tables)
  - AI Gateway (6 tables)
  - Website (4 tables)
  - Sports/PlayCircle (6 tables)
  - Notifications (2 tables)
  - Storage/Media (1 table)
  - Transport & Bookstore (4 tables)
  - Internal Ops (5 tables)

### Step 5: Verify ✅
- Counts all tables in the database
- Confirms 107 tables exist
- Displays connection details

## Expected Output

```
🚀 LERA Academy - Local PostgreSQL Setup
=========================================

📦 Installing PostgreSQL...
🔄 Starting PostgreSQL service...
📊 Creating LERA database and user...

🗄️  Running database schema initialization...
   → Applying init.sql...
   ✓ Base schema applied
   → Applying V2 migration (66 missing tables)...
   ✓ Migration applied

📊 Verifying database schema...

✅ PostgreSQL is now running locally on localhost!

📋 Connection Details:
   Host: localhost
   Port: 5432
   Database: lera
   Username: lera
   Password: lera123

📊 Database Status:
   Tables: 107/107
   Status: ✅ All 107 tables created successfully!

🔧 Useful Commands:
   Connect: psql -h localhost -U lera -d lera
   Stop:    brew services stop postgresql@15
   Start:   brew services start postgresql@15
   Status:  brew services list
   Tables:  psql -h localhost -U lera -d lera -c '\dt'
```

## How to Verify

### Option 1: Run the verification script
```bash
./verify-schema.sh
```

### Option 2: Run the test script
```bash
./test-database.sh
```

### Option 3: Manual verification
```bash
# Connect to database
psql -h localhost -U lera -d lera

# Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return: 107

# List all tables
\dt

# Exit
\q
```

## Connection Details

Use these credentials to connect from your applications:

```yaml
# Spring Boot (application.yml)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/lera
    username: lera
    password: lera123
    driver-class-name: org.postgresql.Driver
```

```bash
# psql command line
psql -h localhost -U lera -d lera
# Password: lera123

# Connection string
postgresql://lera:lera123@localhost:5432/lera
```

## Troubleshooting

### If setup fails:
1. Check if PostgreSQL is running: `brew services list`
2. Start if needed: `brew services start postgresql@15`
3. Re-run setup: `./setup-local-postgres.sh`

### If wrong number of tables:
1. Drop database: `dropdb lera`
2. Re-run setup: `./setup-local-postgres.sh`

### If connection fails:
1. Check PostgreSQL logs: `tail -f /opt/homebrew/var/log/postgresql@15.log`
2. Verify port 5432 is listening: `lsof -i :5432`
3. Restart service: `brew services restart postgresql@15`

## Next Steps

Once setup is complete:

1. ✅ Verify 107 tables exist
2. ✅ Update Spring Boot services to use `localhost:5432`
3. ✅ Test your application
4. ✅ Start developing!

## Files

- `setup-local-postgres.sh` - Main setup script
- `verify-schema.sh` - Verification script
- `test-database.sh` - Quick test script
- `database/init/init.sql` - Base schema (41 tables)
- `database/migrations/V2__add_missing_66_tables.sql` - Migration (66 tables)
- `database/verify-107-tables.sql` - Detailed verification

## Documentation

- Complete guide: `DATABASE_LOCALHOST_SETUP.md`
- Quick reference: `QUICK_START_DATABASE.txt`
- Visual guide: `VISUAL_SETUP_GUIDE.txt`
- Checklist: `DATABASE_SETUP_CHECKLIST.md`
- Index: `DOCUMENTATION_INDEX.md`

---

**Status**: ✅ Ready to use!
**Total Tables**: 107
**Location**: localhost:5432
**Database**: lera
