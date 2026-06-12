# 📚 LERA System - Complete Architecture Guide

## Overview

LERA is a **Multi-Tenant Educational Management System** built with:
- **Backend**: Spring Boot 3.2.1 (Java 17) Microservices
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn-ui
- **Database**: PostgreSQL 15 with 107+ tables

---

## 🗄️ DATABASE ARCHITECTURE

### Connection Details
```
Host: localhost
Port: 5432
Database: lera
User: lera
Password: lera123
```

### Database Schema Sections (107 Tables)

#### Section A: Multi-Tenant System
| Table | Purpose |
|-------|---------|
| `tenants` | Organizations/Educational brands (SaaS customers) |
| `tenant_settings` | Theme, logo, features per tenant |
| `centers` | Learning centers under each tenant |
| `center_settings` | Operating hours, holidays, locale |
| `roles` | Role definitions (Admin, Teacher, Student, etc.) |
| `permissions` | Granular permissions (CRUD operations) |
| `role_permissions` | Role-to-permission mapping |
| `users` | All users (email, password hash, status) |
| `user_roles` | User-to-role assignments |
| `departments` | Organizational departments |

#### Section B: Identity & Access
| Table | Purpose |
|-------|---------|
| `login_history` | Track user logins |
| `audit_logs` | System audit trail |
| `activity_logs` | User activity tracking |
| `impersonation_logs` | Admin impersonation records |
| `feature_flags` | Feature toggles |
| `system_settings` | Global system configuration |

#### Section C: Academy/LMS
| Table | Purpose |
|-------|---------|
| `students` | Student profiles |
| `teachers` | Teacher profiles |
| `courses` | Course definitions |
| `classes` | Class groups |
| `class_schedules` | Weekly schedule |
| `class_sessions` | Individual sessions |
| `enrollments` | Student-class assignments |
| `assignments` | Homework/assignments |
| `exams` | Exam definitions |
| `exam_results` | Scores and grades |
| `certificates` | Student certifications |
| `curriculum` | Course curriculum |

#### Section D: Attendance
| Table | Purpose |
|-------|---------|
| `attendance_records` | Daily attendance |
| `attendance_exceptions` | Late/excused absences |
| `teacher_sessions` | Teacher session logs |
| `teacher_staff_leave` | Leave requests |
| `leave_balance_accruals` | Leave balance tracking |

#### Section E: Payments & Finance
| Table | Purpose |
|-------|---------|
| `invoices` | Student invoices |
| `payments` | Payment transactions |
| `refunds` | Refund records |
| `fee_rules` | Fee calculation rules |
| `discounts` | Discount definitions |
| `scholarships` | Scholarship programs |
| `ledger_entries` | Accounting entries |
| `payment_methods` | Cash, Card, E-Wallet |

#### Section F: Payroll
| Table | Purpose |
|-------|---------|
| `teacher_salary` | Salary structures |
| `payroll_cycles` | Monthly cycles |
| `payroll_records` | Payslips |
| `bonuses` | Bonus payments |
| `deductions` | Salary deductions |
| `tax_settings` | Tax configuration |

#### Section G: CRM/Connect
| Table | Purpose |
|-------|---------|
| `leads` | Sales leads |
| `lead_activities` | Lead interactions |
| `marketing_campaigns` | Marketing campaigns |
| `followups` | Follow-up tasks |
| `notifications` | System notifications |
| `chat_messages` | Internal messaging |

#### Section H: AI/Tutor
| Table | Purpose |
|-------|---------|
| `ai_conversations` | AI chat history |
| `ai_assessments` | AI-generated assessments |
| `ai_recommendations` | Learning recommendations |
| `learning_paths` | Personalized paths |

#### Section I: Content/CMS
| Table | Purpose |
|-------|---------|
| `blog_posts` | Blog content |
| `banners` | Homepage banners |
| `testimonials` | Student testimonials |
| `faqs` | FAQ content |
| `cms_pages` | Static pages |
| `media_gallery` | Images/videos |

---

## 🔧 BACKEND SERVICES

### Service Architecture (Ports)

| Service | Port | Description |
|---------|------|-------------|
| **identity_service** | 8081 | Authentication, Users, Roles, Permissions |
| **academy_service** | 8082 | Students, Teachers, Courses, Classes, Exams |
| **payment_service** | 8083 | Invoices, Payments, Refunds, Discounts |
| **payroll_service** | 8084 | Salaries, Payroll, Bonuses, Deductions |
| **attendance_service** | 8085 | Attendance, Leave Management |
| **connect_service** | 8086 | CRM, Chat, Notifications, Leads |
| **ai_gateway** | 8087 | AI Tutor, Recommendations, Assessments |
| **rule_engine** | 8088 | Business Rules, Automation |

### Service Structure (Each Service)
```
service_name/
├── src/main/java/com/lera/service_name/
│   ├── controller/     # REST API endpoints
│   ├── entity/         # JPA entities (database models)
│   ├── repository/     # Data access layer
│   ├── service/        # Business logic (optional)
│   ├── dto/            # Data transfer objects (optional)
│   └── config/         # Configuration classes
├── src/main/resources/
│   └── application.properties  # Service config
└── pom.xml             # Maven dependencies
```

### Starting Services
```bash
# Start individual service
cd backend/identity_service && mvn spring-boot:run -DskipTests

# Or use VS Code tasks (Ctrl+Shift+P → Tasks: Run Task)
```

---

## 🎯 IDENTITY SERVICE (Port 8081)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| AuthController | `/api/auth/*` | Login, Register, Logout |
| UserController | `/api/users/*` | User CRUD |
| RoleController | `/api/roles/*` | Role management |
| TenantController | `/api/tenants/*` | Tenant management |
| CenterController | `/api/centers/*` | Center management |
| DepartmentController | `/api/departments/*` | Departments |
| FeatureFlagController | `/api/feature-flags/*` | Feature toggles |

### Key Entities
```java
User {
    id, email, passwordHash, firstName, lastName, 
    phone, status, tenantId, centerId
}

Role {
    id, name, displayName, level, scope, tenantId
}

Tenant {
    id, code, name, slug, domain, status, 
    subscriptionPlan, maxCenters, maxStudents
}
```

---

## 📚 ACADEMY SERVICE (Port 8082)

### Controllers (42+ Controllers)
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| StudentController | `/api/students/*` | Student management |
| TeacherController | `/api/teachers/*` | Teacher management |
| CourseController | `/api/courses/*` | Course definitions |
| ClassController | `/api/classes/*` | Class groups |
| ClassScheduleController | `/api/class-schedules/*` | Weekly schedules |
| ClassSessionController | `/api/class-sessions/*` | Individual sessions |
| EnrollmentController | `/api/enrollments/*` | Student enrollments |
| ExamController | `/api/exams/*` | Exam management |
| ExamResultController | `/api/exam-results/*` | Scores/grades |
| AssignmentController | `/api/assignments/*` | Homework |
| CertificateController | `/api/certificates/*` | Certificates |
| BlogPostController | `/api/blog-posts/*` | Blog content |
| BannerController | `/api/banners/*` | Homepage banners |
| CmsPageController | `/api/cms-pages/*` | Static pages |

### Key Entities
```java
Student {
    id, studentCode, userId, dateOfBirth, grade, 
    enrollmentDate, status, parentId
}

Teacher {
    id, teacherCode, userId, specialization, 
    qualifications, hireDate, status
}

ClassEntity {
    id, className, courseId, teacherId, 
    maxStudents, startDate, endDate, status
}

ClassSchedule {
    id, classId, dayOfWeek, startTime, endTime, 
    roomNumber, roomName
}
```

---

## 💰 PAYMENT SERVICE (Port 8083)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| InvoiceController | `/api/invoices/*` | Invoice management |
| PaymentController | `/api/payments/*` | Payment processing |
| RefundController | `/api/refunds/*` | Refund handling |
| DiscountController | `/api/discounts/*` | Discounts |
| ScholarshipController | `/api/scholarships/*` | Scholarships |
| FeeRuleController | `/api/fee-rules/*` | Fee rules |
| PaymentMethodController | `/api/payment-methods/*` | Payment methods |

### Key Entities
```java
Invoice {
    id, studentId, invoiceNumber, totalAmount, 
    dueDate, status, paidAmount
}

Payment {
    id, invoiceId, amount, paymentMethod, 
    transactionId, status, paidAt
}
```

---

## 💼 PAYROLL SERVICE (Port 8084)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| PayrollController | `/api/payroll/*` | Payroll processing |
| TeacherSalaryController | `/api/teacher-salaries/*` | Salary structures |
| PayrollCycleController | `/api/payroll-cycles/*` | Monthly cycles |
| BonusController | `/api/bonuses/*` | Bonus payments |
| DeductionController | `/api/deductions/*` | Deductions |
| TaxSettingsController | `/api/tax-settings/*` | Tax config |

---

## 📋 ATTENDANCE SERVICE (Port 8085)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| AttendanceController | `/api/attendance/*` | Daily attendance |
| AttendanceExceptionController | `/api/attendance-exceptions/*` | Exceptions |
| TeacherSessionController | `/api/teacher-sessions/*` | Teacher sessions |
| TeacherStaffLeaveController | `/api/teacher-leaves/*` | Leave requests |

---

## 💬 CONNECT SERVICE (Port 8086)

### Controllers (30+ Controllers)
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| LeadController | `/api/leads/*` | Sales leads |
| MarketingCampaignController | `/api/marketing-campaigns/*` | Campaigns |
| FollowupController | `/api/followups/*` | Follow-ups |
| NotificationController | `/api/notifications/*` | Notifications |
| ChatController | `/api/chat/*` | Internal chat |
| ParentTeacherMeetingController | `/api/parent-teacher-meetings/*` | PTM |

---

## 🤖 AI GATEWAY (Port 8087)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| AiController | `/api/ai/*` | AI chat interface |
| AiConversationController | `/api/ai-conversations/*` | Chat history |
| AiAssessmentController | `/api/ai-assessments/*` | AI assessments |
| AiRecommendationController | `/api/ai-recommendations/*` | Recommendations |
| LearningPathController | `/api/learning-paths/*` | Learning paths |

---

## ⚙️ RULE ENGINE (Port 8088)

### Controllers
| Controller | Endpoint | Purpose |
|------------|----------|---------|
| RuleController | `/api/rules/*` | Business rules |

### Purpose
- Automate business logic
- Fee calculations
- Attendance rules
- Discount eligibility

---

## 🖥️ FRONTEND (Next.js 14)

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **HTTP Client**: Axios
- **State**: React Context

### Folder Structure
```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles
│   ├── auth/               # Login/Register pages
│   ├── dashboard/          # Role-based dashboards
│   │   ├── admin/          # Admin dashboard
│   │   ├── teacher/        # Teacher dashboard
│   │   ├── student/        # Student dashboard
│   │   ├── parent/         # Parent dashboard
│   │   ├── superadmin/     # Super admin
│   │   ├── academy/        # Academy management
│   │   ├── finance/        # Finance dashboard
│   │   ├── payroll/        # Payroll management
│   │   ├── crm/            # CRM/Leads
│   │   ├── attendance/     # Attendance
│   │   └── connect/        # Communication
│   ├── courses/            # Public course pages
│   ├── about/              # About page
│   └── contact/            # Contact page
├── components/             # Reusable components
├── lib/                    # Utilities, API clients
└── public/                 # Static assets
```

### Dashboard Pages by Role

| Role | Path | Features |
|------|------|----------|
| SuperAdmin | `/dashboard/superadmin` | Tenant management, global settings |
| Admin | `/dashboard/admin` | Center management, users, reports |
| Teacher | `/dashboard/teacher` | Classes, attendance, grades |
| Student | `/dashboard/student` | Schedule, assignments, grades |
| Parent | `/dashboard/parent` | Child progress, payments |
| Finance | `/dashboard/finance` | Invoices, payments, reports |
| CRM | `/dashboard/crm` | Leads, campaigns, follow-ups |

### Starting Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## 🔗 API COMMUNICATION

### API Base URLs
```typescript
const API_URLS = {
  identity: 'http://localhost:8081/api',
  academy: 'http://localhost:8082/api',
  payment: 'http://localhost:8083/api',
  payroll: 'http://localhost:8084/api',
  attendance: 'http://localhost:8085/api',
  connect: 'http://localhost:8086/api',
  ai: 'http://localhost:8087/api',
  rules: 'http://localhost:8088/api'
};
```

### Example API Calls
```typescript
// Login
POST /api/auth/login
{ "email": "admin@lera.com", "password": "password" }

// Get Students
GET /api/students

// Create Class
POST /api/classes
{ "className": "Math 101", "courseId": "uuid", "teacherId": "uuid" }

// Record Attendance
POST /api/attendance
{ "studentId": "uuid", "classId": "uuid", "status": "PRESENT" }
```

---

## 🚀 QUICK START

### 1. Start Database
```bash
# Using Docker
docker-compose up -d postgres

# Or local PostgreSQL
psql -U postgres -c "CREATE DATABASE lera"
psql -U lera -d lera -f database/init/init.sql
```

### 2. Start Backend Services
```bash
# Identity Service (required first)
cd backend/identity_service && mvn spring-boot:run -DskipTests

# Other services (in separate terminals)
cd backend/academy_service && mvn spring-boot:run -DskipTests
cd backend/payment_service && mvn spring-boot:run -DskipTests
# ... etc
```

### 3. Start Frontend
```bash
cd frontend && npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:808X/swagger-ui.html (if enabled)

---

## 📊 ENTITY RELATIONSHIPS

```
Tenant (1) ──────────── (N) Center
   │                         │
   └── (N) User              └── (N) Class
           │                         │
           ├── Student               ├── Schedule
           ├── Teacher               ├── Session
           └── Parent                └── Enrollment
                                           │
                                           └── Student
```

---

## 🔐 AUTHENTICATION FLOW

1. User submits login credentials
2. Identity Service validates and returns JWT token
3. Frontend stores token in cookies/localStorage
4. All API requests include `Authorization: Bearer <token>`
5. Each service validates token with Identity Service

---

## 📁 KEY FILES TO UNDERSTAND

### Backend
- `application.properties` - Database, port, service config
- `*Controller.java` - REST API endpoints
- `*Entity.java` - Database table mappings
- `*Repository.java` - Data access methods

### Frontend
- `app/layout.tsx` - Root layout with auth context
- `lib/api.ts` - API client configuration
- `components/` - Reusable UI components
- `app/dashboard/[role]/page.tsx` - Role dashboards

### Database
- `database/init/init.sql` - Complete schema (107 tables)

---

Generated: January 2026
