# ✅ LERA Academy - Database Setup Checklist

## Pre-Setup Verification
- [ ] You are on macOS
- [ ] You have terminal access
- [ ] You are in the LERA_Group directory

## Setup Steps

### 1. Initial Setup
```bash
cd /Users/rahulsharma/LERA_Group
./setup-local-postgres.sh
```

**Expected Result:**
```
✅ PostgreSQL is now running locally on localhost!

📊 Database Status:
   Tables: 107/107
   Status: ✅ All 107 tables created successfully!
```

- [ ] PostgreSQL 15 is installed
- [ ] PostgreSQL service is running
- [ ] Database 'lera' exists
- [ ] User 'lera' exists with password 'lera123'
- [ ] init.sql ran successfully
- [ ] Migration V2 ran successfully
- [ ] **107 tables are present** ✅

### 2. Verify Schema
```bash
./verify-schema.sh
```

**Expected Result:**
```
✅ SUCCESS! All 107 tables are present!
```

- [ ] Verification script runs without errors
- [ ] Table count shows 107/107
- [ ] All modules are listed correctly

### 3. Test Database Connection
```bash
psql -h localhost -U lera -d lera
```

**In psql, run:**
```sql
-- Should return 107
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Should list all tables
\dt

-- Test a few key tables
SELECT * FROM tenants LIMIT 1;
SELECT * FROM centers LIMIT 5;
SELECT * FROM users LIMIT 5;

-- Exit
\q
```

- [ ] psql connects successfully
- [ ] Table count query returns 107
- [ ] `\dt` shows all tables
- [ ] Can query tenants table
- [ ] Can query centers table
- [ ] Can query users table

### 4. Update Spring Boot Services

For each microservice (identity_service, academy_service, etc.):

1. Open `application.yml` or `application.properties`
2. Update database connection:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/lera
    username: lera
    password: lera123
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # Important: use validate, not create or update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
```

**Check each service:**
- [ ] identity_service - Updated
- [ ] academy_service - Updated
- [ ] connect_service - Updated
- [ ] payment_service - Updated
- [ ] payroll_service - Updated
- [ ] attendance_service - Updated
- [ ] ai_gateway - Updated

### 5. Test Service Startup

Start each service and verify it connects to the database:

```bash
# Example for identity_service
cd backend/identity_service
mvn spring-boot:run
```

**Look for in logs:**
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

**Services to test:**
- [ ] identity_service starts and connects
- [ ] academy_service starts and connects
- [ ] connect_service starts and connects
- [ ] payment_service starts and connects
- [ ] payroll_service starts and connects
- [ ] attendance_service starts and connects

### 6. Test Basic CRUD Operations

Test that each service can read/write to its tables:

**Identity Service:**
```bash
# Register a new user
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lera.com","password":"test123","fullname":"Test User"}'
```
- [ ] User registration works

**Academy Service:**
```bash
# List courses
curl http://localhost:8082/api/courses
```
- [ ] Can fetch courses

**Connect Service (CRM):**
```bash
# List leads
curl http://localhost:8083/api/leads
```
- [ ] Can fetch leads

## Troubleshooting Checklist

### PostgreSQL Issues
- [ ] Run `brew services list` - postgresql@15 shows "started"
- [ ] Run `lsof -i :5432` - shows postgres listening
- [ ] Check logs: `tail -f /opt/homebrew/var/log/postgresql@15.log`

### Connection Issues
- [ ] Verify credentials: `psql -h localhost -U lera -d lera`
- [ ] Check pg_hba.conf allows local connections
- [ ] Try restarting: `brew services restart postgresql@15`

### Missing Tables
- [ ] Re-run setup: `./setup-local-postgres.sh`
- [ ] Manually run migrations:
  ```bash
  PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/init/init.sql
  PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/migrations/V2__add_missing_66_tables.sql
  ```
- [ ] Verify with: `./verify-schema.sh`

### Spring Boot Service Issues
- [ ] Check application.yml has correct connection details
- [ ] Verify PostgreSQL JDBC driver is in pom.xml
- [ ] Set `hibernate.ddl-auto: validate` (not create/update)
- [ ] Check service logs for connection errors

## Final Verification

### Database Level
- [ ] ✅ 107 tables exist
- [ ] ✅ All extensions installed (uuid-ossp)
- [ ] ✅ Seed data present (tenants, lead_statuses, payment_methods)
- [ ] ✅ All indexes created
- [ ] ✅ Foreign keys working

### Application Level
- [ ] ✅ All services connect to localhost:5432
- [ ] ✅ No "table doesn't exist" errors
- [ ] ✅ Can perform basic CRUD operations
- [ ] ✅ Multi-tenant support working (tenant_id columns)

### Development Workflow
- [ ] ✅ Can start/stop PostgreSQL easily
- [ ] ✅ Can connect via psql for debugging
- [ ] ✅ Can backup/restore database
- [ ] ✅ All documentation accessible

## Success Criteria

✅ **You have successfully completed the database setup when:**

1. Running `./verify-schema.sh` shows **"Tables: 107/107"**
2. All Spring Boot services start without database errors
3. You can perform CRUD operations through each service API
4. `psql -h localhost -U lera -d lera` connects successfully

## Quick Reference

**Connect to database:**
```bash
psql -h localhost -U lera -d lera
```

**Count tables:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**List all tables:**
```sql
\dt
```

**Check a specific module (example - tenants):**
```sql
SELECT * FROM tenants;
SELECT * FROM tenant_settings;
```

**Exit psql:**
```sql
\q
```

---

## 🎉 Congratulations!

If all checkboxes are complete, you now have:
- ✅ PostgreSQL 15 running on localhost
- ✅ Complete LERA Academy schema (107 tables)
- ✅ All microservices connected to local database
- ✅ Ready for local development

**Happy coding! 🚀**
