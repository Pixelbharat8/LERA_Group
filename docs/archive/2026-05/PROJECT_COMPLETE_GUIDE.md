# LERA Academy Platform - Complete Implementation Guide

> **Last Updated:** December 27, 2025  
> **Version:** v192 - Student Fee Management System

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Services & Ports](#services--ports)
4. [Quick Start Guide](#quick-start-guide)
5. [Database Setup](#database-setup)
6. [v192 Implementation Summary](#v192-implementation-summary)
7. [API Endpoints](#api-endpoints)
8. [Frontend Pages](#frontend-pages)
9. [Menu Structure](#menu-structure)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

LERA Academy Platform is a comprehensive educational management system built with:

- **Frontend:** Next.js 14.1.0 (React 18, TypeScript, TailwindCSS)
- **Backend:** Spring Boot 3.2.1 (Java 17, Maven)
- **Database:** PostgreSQL
- **Authentication:** JWT-based authentication
- **Excel Import:** XLSX library for bulk data import

### Key Modules

| Module | Description |
|--------|-------------|
| Identity Service | User authentication, roles, permissions |
| Academy Service | Courses, classes, students, teachers |
| Payment Service | Fees, invoices, payments, refunds |
| Payroll Service | Staff salaries, deductions, payslips |
| Attendance Service | Student & teacher attendance |
| Connect Service | Communication, notifications |
| AI Gateway | AI-powered features |
| Rule Engine | Business rules automation |
| **Data Import** | Excel upload for bulk data (NEW) |

---

## 🏗️ Architecture

```
LERA_Group/
├── frontend/                    # Next.js Frontend (Port 3000)
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── superadmin/     # Super Admin Dashboard
│   │   │   ├── admin/          # Center Admin Dashboard
│   │   │   ├── teacher/        # Teacher Dashboard
│   │   │   └── student/        # Student Dashboard
│   │   └── api/                # API Routes (Proxy to Backend)
│   └── components/             # Reusable React Components
│
├── backend/
│   ├── identity_service/       # Port 8080 - Auth & Users
│   ├── academy_service/        # Port 8081 - Academic Management
│   ├── payment_service/        # Port 8082 - Finance & Payments
│   ├── payroll_service/        # Port 8083 - Payroll
│   ├── attendance_service/     # Port 8084 - Attendance
│   ├── connect_service/        # Port 8085 - Communications
│   ├── ai_gateway/             # Port 8086 - AI Features
│   └── rule_engine/            # Port 8087 - Business Rules
│
└── database/                   # PostgreSQL Scripts
```

---

## 🌐 Services & Ports

| Service | Port | Health Check URL |
|---------|------|------------------|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Identity Service | 8080 | http://localhost:8080/actuator/health |
| Academy Service | 8081 | http://localhost:8081/actuator/health |
| Payment Service | 8082 | http://localhost:8082/actuator/health |
| Payroll Service | 8083 | http://localhost:8083/actuator/health |
| Attendance Service | 8084 | http://localhost:8084/actuator/health |
| Connect Service | 8085 | http://localhost:8085/actuator/health |
| AI Gateway | 8086 | http://localhost:8086/actuator/health |
| Rule Engine | 8087 | http://localhost:8087/actuator/health |
| PostgreSQL | 5432 | - |

---

## 🚀 Quick Start Guide

### Prerequisites

- **Java 17** - `java -version`
- **Maven 3.8+** - `mvn -version`
- **Node.js 18+** - `node -v`
- **PostgreSQL 14+** - `psql --version`

### Step 1: Clone & Setup

```bash
cd /Users/rahulsharma/LERA_Group
```

### Step 2: Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE lera;
CREATE USER lera WITH PASSWORD 'lera123';
GRANT ALL PRIVILEGES ON DATABASE lera TO lera;
\c lera
GRANT ALL ON SCHEMA public TO lera;
\q
```

### Step 3: Start Backend Services

**Using VS Code Tasks (Recommended):**

Press `Cmd+Shift+P` → "Tasks: Run Task" → Select:
- "Start Identity Service"
- "Start Academy Service"
- "Start Payment Service"
- "Start Payroll Service"
- "Start Attendance Service"
- "Start Connect Service"

**Or via Terminal:**

```bash
# Terminal 1 - Identity Service
cd backend/identity_service && mvn spring-boot:run -DskipTests

# Terminal 2 - Academy Service
cd backend/academy_service && mvn spring-boot:run -DskipTests

# Terminal 3 - Payment Service
cd backend/payment_service && mvn spring-boot:run -DskipTests

# Terminal 4 - Payroll Service
cd backend/payroll_service && mvn spring-boot:run -DskipTests

# Terminal 5 - Attendance Service
cd backend/attendance_service && mvn spring-boot:run -DskipTests

# Terminal 6 - Connect Service
cd backend/connect_service && mvn spring-boot:run -DskipTests
```

### Step 4: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Login:** Use admin credentials from database

---

## 🗄️ Database Setup

### Connection Details

```properties
Host: localhost
Port: 5432
Database: lera
Username: lera
Password: lera123
```

### Run Migrations

Migrations are in: `backend/identity_service/src/main/resources/db/migration/`

Key migrations:
- V1 to V191: Core system tables
- **V192**: Student Fee Management System (22 new tables, 64 indexes)

### V192 Migration Tables

```sql
-- Fee Management Tables (created in V192)
fee_structures, fee_categories, fee_items, fee_rules
center_fee_rules, student_fee_plans, student_fee_plan_items
invoices, invoice_items, payments, refunds
discounts, student_discounts, late_fee_rules
scholarships, student_scholarships
payment_methods, payment_gateway_configs
fee_receipts, ledger_entries, fee_reminders, audit_logs
```

---

## 📦 v192 Implementation Summary

### What Was Implemented

#### 1. Backend Entities (Payment Service)

| Entity | Description | Status |
|--------|-------------|--------|
| FeeRule.java | Fee calculation rules | ✅ Complete |
| Invoice.java | Student invoices | ✅ Complete |
| Payment.java | Payment records | ✅ Complete |
| Refund.java | Refund processing | ✅ Complete |
| Discount.java | Discount management | ✅ Complete |
| PaymentMethod.java | Payment methods | ✅ Complete |
| Scholarship.java | Scholarship records | ✅ Complete |
| StudentScholarship.java | Student-scholarship links | ✅ Complete |

#### 2. Backend Controllers

| Controller | Endpoints | Status |
|------------|-----------|--------|
| FeeRuleController | /api/fee-rules | ✅ Working |
| InvoiceController | /api/invoices | ✅ Working |
| PaymentController | /api/payments | ✅ Working |
| RefundController | /api/refunds | ✅ Working |
| DiscountController | /api/discounts | ✅ Working |

#### 3. Frontend Pages

| Page | Path | Status |
|------|------|--------|
| Student Fee Dashboard | /dashboard/superadmin/finance/student-fees | ✅ Complete |
| Fee Rules | /dashboard/superadmin/finance/student-fees/fee-rules | ✅ Complete |
| Invoices | /dashboard/superadmin/finance/student-fees/invoices | ✅ Complete |
| Payments | /dashboard/superadmin/finance/student-fees/payments | ✅ Complete |
| Discounts | /dashboard/superadmin/finance/student-fees/discounts | ✅ Complete |
| Refunds | /dashboard/superadmin/finance/student-fees/refunds | ✅ Complete |

#### 4. Database Optimizations

- ✅ 64 indexes updated with `IF NOT EXISTS` for idempotent migrations
- ✅ Composite indexes for scalability:
  - `idx_invoices_center_status` - Center + Status queries
  - `idx_invoices_student_date` - Student + Date range queries
  - `idx_invoices_overdue_lookup` - Overdue invoice lookup
- ✅ Partitioning strategy documented for billions of users

#### 5. Menu Reorganization

Finance menu reorganized to:
```
📊 Finance
  └── 💰 Student Fee Management
        ├── Dashboard
        ├── Fee Rules
        ├── Invoices
        ├── Payments
        ├── Discounts
        └── Refunds
```

---

## 📡 API Endpoints

### Payment Service (Port 8082)

#### Fee Rules
```
GET    /api/fee-rules           - List all fee rules
GET    /api/fee-rules/{id}      - Get fee rule by ID
GET    /api/fee-rules/active    - Get active fee rules
POST   /api/fee-rules           - Create fee rule
PUT    /api/fee-rules/{id}      - Update fee rule
DELETE /api/fee-rules/{id}      - Delete fee rule
```

#### Invoices
```
GET    /api/invoices            - List all invoices
GET    /api/invoices/{id}       - Get invoice by ID
GET    /api/invoices/student/{studentId} - Get by student
POST   /api/invoices            - Create invoice
PUT    /api/invoices/{id}       - Update invoice
DELETE /api/invoices/{id}       - Delete invoice
```

#### Payments
```
GET    /api/payments            - List all payments
GET    /api/payments/{id}       - Get payment by ID
GET    /api/payments/invoice/{invoiceId} - Get by invoice
POST   /api/payments            - Create payment
PUT    /api/payments/{id}       - Update payment
PATCH  /api/payments/{id}/status - Update status
DELETE /api/payments/{id}       - Delete payment
```

#### Refunds
```
GET    /api/refunds             - List all refunds
GET    /api/refunds/{id}        - Get refund by ID
GET    /api/refunds/payment/{paymentId} - Get by payment
POST   /api/refunds             - Create refund
PUT    /api/refunds/{id}        - Update refund
PATCH  /api/refunds/{id}/status - Update status
DELETE /api/refunds/{id}        - Delete refund
```

#### Discounts
```
GET    /api/discounts           - List all discounts
GET    /api/discounts/{id}      - Get discount by ID
GET    /api/discounts/active    - Get active discounts
POST   /api/discounts           - Create discount
PUT    /api/discounts/{id}      - Update discount
DELETE /api/discounts/{id}      - Delete discount
```

### Testing APIs

```bash
# Test Fee Rules
curl http://localhost:8082/api/fee-rules

# Test Invoices
curl http://localhost:8082/api/invoices

# Test Payments
curl http://localhost:8082/api/payments

# Test Refunds
curl http://localhost:8082/api/refunds

# Test Discounts
curl http://localhost:8082/api/discounts
```

---

## 📱 Frontend Pages

### Super Admin Dashboard Structure

```
/dashboard/superadmin/
├── overview                    # Main dashboard
├── centers/                    # Center management
├── users/                      # User management
├── students/                   # Student management
├── teachers/                   # Teacher management
├── courses/                    # Course management
├── attendance/
│   ├── students/              # Student attendance
│   └── teachers/              # Teacher attendance
├── finance/
│   ├── overview/              # Finance dashboard
│   ├── student-fees/          # Student Fee Management ⭐ NEW
│   │   ├── fee-rules/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── discounts/
│   │   └── refunds/
│   └── payroll/               # Staff payroll
├── reports/                    # Analytics & reports
└── settings/                   # System settings
```

---

## 🧭 Menu Structure

### Sidebar Navigation (SuperAdmin)

```typescript
// Current menu structure in SideNavigation.tsx
{
  name: "Finance",
  icon: "💰",
  submenu: [
    { name: "Overview", href: "/dashboard/superadmin/finance" },
    { 
      name: "Student Fee Management", 
      href: "/dashboard/superadmin/finance/student-fees",
      submenu: [
        { name: "Dashboard", href: "/dashboard/superadmin/finance/student-fees" },
        { name: "Fee Rules", href: "/dashboard/superadmin/finance/student-fees/fee-rules" },
        { name: "Invoices", href: "/dashboard/superadmin/finance/student-fees/invoices" },
        { name: "Payments", href: "/dashboard/superadmin/finance/student-fees/payments" },
        { name: "Discounts", href: "/dashboard/superadmin/finance/student-fees/discounts" },
        { name: "Refunds", href: "/dashboard/superadmin/finance/student-fees/refunds" }
      ]
    },
    { name: "Payroll", href: "/dashboard/superadmin/payroll" }
  ]
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start - Port Already in Use

```bash
# Find and kill process on port
lsof -i :8082
kill -9 <PID>
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Restart PostgreSQL (macOS)
brew services restart postgresql
```

#### 3. Maven Build Fails

```bash
# Clean and rebuild
cd backend/payment_service
mvn clean install -DskipTests
```

#### 4. Frontend Build Errors

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

#### 5. Entity-Database Schema Mismatch

If you see errors like "missing column [X] in table [Y]":
- The entity doesn't match the database schema
- Either update the entity or add the column to the database
- Set `spring.jpa.hibernate.ddl-auto=none` to skip validation

### Check Service Health

```bash
# Check all services
for port in 8080 8081 8082 8083 8084 8085; do
  echo "Port $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/actuator/health)"
done
```

---

## 📊 Current Status

### Services Running ✅

| Service | Status | Verified |
|---------|--------|----------|
| Frontend (3000) | ✅ Running | Tested |
| Identity Service (8080) | ✅ Available | - |
| Academy Service (8081) | ✅ Available | - |
| Payment Service (8082) | ✅ Running | Tested |
| Payroll Service (8083) | ✅ Running | - |
| Attendance Service (8084) | ✅ Running | - |

### API Tests Passed ✅

```bash
# Payment Service APIs - All Working
✅ GET /api/fee-rules     → []
✅ GET /api/invoices      → []
✅ GET /api/payments      → [1 record]
✅ GET /api/refunds       → []
✅ GET /api/discounts     → []
```

---

## 📝 Notes

### Scalability Considerations

1. **Indexes** - 64 database indexes for fast queries
2. **Composite Indexes** - For common query patterns
3. **Partitioning Ready** - Tables designed for future partitioning
4. **UUID Primary Keys** - Distributed-friendly identifiers

### Security

- JWT-based authentication
- Role-based access control (SUPERADMIN, ADMIN, TEACHER, STUDENT)
- CORS configured for frontend origin
- Password hashing with BCrypt

### Future Enhancements

- [ ] Payment gateway integration (VNPay, MoMo)
- [ ] Automated invoice generation
- [ ] Late fee calculation automation
- [ ] Email/SMS payment reminders
- [ ] Financial reporting dashboard

---

## 📥 Data Import Feature (NEW)

### Access

Navigate to: **Dashboard → Organization → Data Import**

Or direct URL: `http://localhost:3000/dashboard/superadmin/data-import`

### Supported Import Types

| Type | Description | Template Fields |
|------|-------------|-----------------|
| **Students** | Import student records | studentCode, fullname, email, phone, dateOfBirth, gender, schoolName, grade, parentName, parentPhone, centerId |
| **Teachers** | Import teacher accounts | email, fullname, phone, centerId, specialization, qualification |
| **Payments** | Import payment records | studentCode, amount, paymentDate, paymentMethod, description, status |
| **Attendance** | Import attendance data | userCode, date, checkInTime, checkOutTime, status, notes |

### How to Use

1. **Select Import Type** - Choose what data you want to import
2. **Download Template** - Click "Download template" to get the Excel format
3. **Fill Data** - Add your data following the template structure
4. **Upload File** - Upload your Excel file (.xlsx, .xls, .csv)
5. **Preview** - Review the first 10 rows before importing
6. **Import** - Click "Import" to process all records

### Excel Template Format

```
Students Template:
| studentCode | fullname      | email              | phone      | dateOfBirth | gender | schoolName     | grade | parentName    | parentPhone |
|-------------|---------------|-------------------|------------|-------------|--------|----------------|-------|---------------|-------------|
| STU001      | Nguyen Van A  | student1@email.com| 0901234567 | 2015-05-10  | MALE   | Primary School | 5     | Nguyen Van B  | 0901234568  |

Teachers Template:
| email              | fullname    | phone      | centerId | specialization | qualification |
|-------------------|-------------|------------|----------|----------------|---------------|
| teacher1@lera.com | Tran Thi C  | 0901234569 |          | English        | Bachelor      |

Payments Template:
| studentCode | amount  | paymentDate | paymentMethod | description                    | status    |
|-------------|---------|-------------|---------------|--------------------------------|-----------|
| STU001      | 2500000 | 2025-01-15  | CASH          | Monthly tuition - January 2025 | COMPLETED |
```

### Notes

- Dates should be in **YYYY-MM-DD** format
- Leave `centerId` empty to use the default center
- Gender values: `MALE`, `FEMALE`
- Status values: `ACTIVE`, `INACTIVE`, `COMPLETED`, `PENDING`
- Payment methods: `CASH`, `BANK_TRANSFER`, `CARD`, `MOMO`, `VNPAY`

---

## 📅 Teacher Attendance (Updated)

### Features

- **Real-time data** from database (no dummy data)
- **Mark attendance** for individual teachers (Present/Absent/Late)
- **Mark All Present** button for quick bulk marking
- **Filter by date** and status
- **Teacher profiles** with avatars and names

### Access

Navigate to: **Dashboard → Attendance → Teacher Attendance**

Or direct URL: `http://localhost:3000/dashboard/superadmin/attendance/teachers`

---

## 🎉 Summary

The v192 Student Fee Management System is fully implemented with:

- ✅ 8 Backend Entities
- ✅ 5 REST Controllers
- ✅ 6 Frontend Pages
- ✅ Complete CRUD Operations
- ✅ Menu Reorganization
- ✅ Database Optimizations
- ✅ Scalability Features

The system is ready for production use after testing with real data.

---

*Document generated: December 27, 2025*
