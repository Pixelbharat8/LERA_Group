# 🗺️ LERA Academy - System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🌐 FRONTEND (Next.js - Port 3000)                   │
│                                                                              │
│  Pages: Dashboard, Students, Teachers, Classes, Payments, CRM, Reports      │
│  Auth: JWT Token Management, Role-based UI Components                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP REST API Calls
                                   │ Authorization: Bearer <JWT>
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                          🔀 API GATEWAY (Nginx)                             │
│                              Port 80/443                                     │
│                                                                              │
│  Routes:                                                                     │
│    /api/auth/* → Identity Service (8080)                                    │
│    /api/programs/* → Academy Service (8081)                                 │
│    /api/payments/* → Payment Service (8082)                                 │
│    /api/payroll/* → Payroll Service (8083)                                  │
│    /api/attendance/* → Attendance Service (8084)                            │
│    /api/leads/* → Connect Service (8085)                                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐    ┌────────────▼───────┐    ┌───────────▼─────────┐
│ 🔐 IDENTITY    │    │ 📚 ACADEMY         │    │ 💰 PAYMENT          │
│   SERVICE      │    │   SERVICE          │    │   SERVICE           │
│   Port 8080    │    │   Port 8081        │    │   Port 8082         │
│                │    │                    │    │                     │
│ Manages:       │    │ Manages:           │    │ Manages:            │
│ • users        │    │ • students         │    │ • payments          │
│ • roles        │    │ • teachers         │    │ • invoices (🔄)     │
│ • permissions  │    │ • classes          │    │ • fee_structures(🔄)│
│ • centers      │    │ • course_programs  │    │ • discounts (🔄)    │
│ • JWT Auth     │    │ • enrollments      │    │                     │
│                │    │ • blog_posts       │    │                     │
│                │    │ • testimonials     │    │                     │
│                │    │ • cms_settings     │    │                     │
│                │    │ • banners          │    │                     │
│                │    │ • points           │    │                     │
└────────┬───────┘    └────────┬───────────┘    └──────────┬──────────┘
         │                     │                           │
         │          ┌──────────┼──────────┐               │
         │          │          │          │               │
┌────────▼──────┐ ┌─▼──────────▼──┐ ┌────▼───────────┐ ┌─▼────────────┐
│ 📊 PAYROLL    │ │ ✅ ATTENDANCE │ │ 📞 CONNECT     │ │ 🤖 AI        │
│   SERVICE     │ │   SERVICE     │ │   SERVICE      │ │   GATEWAY    │
│   Port 8083   │ │   Port 8084   │ │   Port 8085    │ │   Port 8086  │
│               │ │               │ │                │ │              │
│ Manages:      │ │ Manages:      │ │ Manages:       │ │ Features:    │
│ • payroll     │ │ • attendance  │ │ • leads        │ │ • Course AI  │
│ • teacher pay │ │ • sessions(🔄)│ │ • followups    │ │ • Chatbot    │
│               │ │ • makeup (🔄) │ │ • trial (🔄)   │ │ • Analytics  │
└───────┬───────┘ └───────┬───────┘ └────────┬───────┘ └──────┬───────┘
        │                 │                  │                │
        │                 │                  │                │
        └─────────────────┼──────────────────┴────────────────┘
                          │
                          │ JDBC Connection
                          │ jdbc:postgresql://localhost:5432/lera
                          │ User: lera / Password: lera123
                          │
┌─────────────────────────▼─────────────────────────────────────────────────┐
│                  🐘 PostgreSQL Database (Port 5432)                        │
│                       Database: lera                                       │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 1: Identity & Access (7 tables)                 │           │
│  │  • centers, roles, permissions, role_permissions           │           │
│  │  • users, user_sessions, audit_logs                        │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 2: Academy (6 tables)                           │           │
│  │  • course_programs, course_levels                          │           │
│  │  • classes, students, teachers, enrollments                │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 3: Attendance (3 tables)                        │           │
│  │  • class_sessions, attendance, makeup_sessions             │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 4: Exams & Assessments (4 tables) 🔄            │           │
│  │  • exam_types, exams, exam_results, student_progress       │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 5: CRM (4 tables)                               │           │
│  │  • lead_sources, leads, lead_followups, trial_classes      │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 6: Payments & Invoicing (6 tables)              │           │
│  │  • fee_structures, discounts, invoices, invoice_items      │           │
│  │  • payments, payroll                                       │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 7: Website CMS (7 tables)                       │           │
│  │  • cms_settings, cms_pages, blog_posts, testimonials       │           │
│  │  • media, banners, faqs                                    │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 8: Gamification (4 tables) 🔄                   │           │
│  │  • badges, student_badges, points_transactions, leaderboard│           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────┐           │
│  │ 📦 SECTION 9: Notifications (1 table) 🔄                   │           │
│  │  • notifications                                           │           │
│  └────────────────────────────────────────────────────────────┘           │
│                                                                            │
│  📊 Total: 41 Tables | 21 Indexes | 50+ Foreign Keys                      │
│  ✅ Seed Data: 7 roles, 20 permissions, 6 programs, 1 admin user          │
└────────────────────────────────────────────────────────────────────────────┘

Legend:
  ✅ = Fully implemented and working
  🔄 = Pending implementation
  → = Data flow direction
  ═ = Strong connection
  ─ = Standard connection
```

---

## 📊 Data Flow Examples

### 1. User Login Flow
```
Frontend (Login Form)
    ↓ POST /api/auth/login {email, password}
Identity Service (Port 8080)
    ↓ Query: SELECT * FROM users WHERE email = ?
PostgreSQL Database (users table)
    ↑ Return: User data with role_id
Identity Service
    ↓ Query: SELECT * FROM roles WHERE id = ?
PostgreSQL Database (roles table)
    ↑ Return: Role with permissions
Identity Service
    ↓ Generate JWT token with user + role + permissions
Frontend
    ↑ Response: {token, user, role, permissions}
Frontend stores JWT in localStorage/cookies
```

### 2. Student Enrollment Flow
```
Frontend (Enrollment Form)
    ↓ POST /api/enrollments {studentId, classId}
    ↓ Header: Authorization: Bearer <JWT>
Academy Service (Port 8081)
    ↓ Verify JWT token
    ↓ Check permissions (enrollments.create)
    ↓ Query: SELECT * FROM students WHERE id = ?
    ↓ Query: SELECT * FROM classes WHERE id = ?
PostgreSQL Database
    ↑ Return: Student + Class data
Academy Service
    ↓ Validate enrollment (class capacity, conflicts)
    ↓ INSERT INTO enrollments (...)
PostgreSQL Database
    ↑ Return: New enrollment record
Academy Service
    ↑ Response: {enrollment, student, class}
Frontend
    ↑ Display success message
```

### 3. Payment Processing Flow
```
Frontend (Payment Form)
    ↓ POST /api/payments {invoiceId, amount, method}
Payment Service (Port 8082)
    ↓ Query: SELECT * FROM invoices WHERE id = ?
PostgreSQL Database
    ↑ Return: Invoice details
Payment Service
    ↓ Validate payment amount
    ↓ Process payment (gateway integration)
    ↓ INSERT INTO payments (...)
    ↓ UPDATE invoices SET status = 'PAID'
PostgreSQL Database
    ↑ Confirm transaction
Payment Service
    ↑ Response: {payment, invoice}
Frontend
    ↑ Show payment confirmation
```

### 4. Attendance Marking Flow
```
Frontend (Attendance Page)
    ↓ POST /api/attendance/mark {sessionId, students[]}
Attendance Service (Port 8084)
    ↓ Query: SELECT * FROM class_sessions WHERE id = ?
PostgreSQL Database
    ↑ Return: Session data
Attendance Service
    ↓ Loop through students
    ↓ INSERT INTO attendance (...) for each student
PostgreSQL Database
    ↑ Confirm inserts
Attendance Service
    ↓ Calculate attendance statistics
    ↑ Response: {session, attendance_records[]}
Frontend
    ↑ Update attendance grid
```

---

## 🔄 Cross-Service Communication

### Shared Data Access
Some tables are accessed by multiple services:

```
users table:
  Primary: Identity Service (CRUD)
  Read-Only: All other services (for user info in audit, created_by, etc.)

centers table:
  Primary: Identity Service (CRUD)
  Read-Only: Academy, Connect, Payment (for center-specific data)

students table:
  Primary: Academy Service (CRUD)
  Read-Only: Attendance, Payment, Connect (for student info)

teachers table:
  Primary: Academy Service (CRUD)
  Read-Only: Payroll, Attendance (for teacher info)

classes table:
  Primary: Academy Service (CRUD)
  Read-Only: Attendance, Connect (for class info)
```

---

## ⚡ Performance Optimizations

### Database Indexes (21 total)
```
Identity:
  • idx_users_email (unique lookups)
  • idx_users_role (role filtering)
  • idx_users_center (center filtering)

Academy:
  • idx_students_code (student lookups)
  • idx_students_center, idx_students_parent
  • idx_teachers_code, idx_teachers_center
  • idx_classes_center, idx_classes_program, idx_classes_teacher
  • idx_enrollments_student, idx_enrollments_class

Attendance:
  • idx_attendance_session, idx_attendance_student

CRM:
  • idx_leads_center, idx_leads_status, idx_leads_assigned

Payments:
  • idx_invoices_student, idx_invoices_status

Notifications:
  • idx_notifications_user
  • idx_notifications_unread (filtered index)
```

### Connection Pooling
All services use HikariCP (default in Spring Boot):
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User submits credentials → Identity Service
2. Identity Service validates → Database (users table)
3. Generate JWT with claims:
   - userId, email, roleId, roleName
   - permissions array
   - expiration (24 hours)
4. Return JWT to frontend
5. Frontend includes JWT in all subsequent requests
6. Each service validates JWT before processing
```

### Authorization Levels
```
SUPER_ADMIN (100): Full system access
ADMIN (90): Manage center operations
CENTER_MANAGER (80): Manage specific center
ACADEMIC_MANAGER (70): Academic operations
TEACHER (50): Class and student data
PARENT (20): View child's data only
STUDENT (10): View own data only
```

---

## 📈 Scalability Considerations

### Current Architecture
- ✅ Microservices: Easy to scale individual services
- ✅ Shared Database: Simplified for initial deployment
- ✅ Stateless Services: Can run multiple instances
- ✅ Load Balancing Ready: Nginx gateway

### Future Enhancements
- 🔄 Database Replication: Master-slave for read scaling
- 🔄 Service Mesh: Implement for complex inter-service communication
- 🔄 Caching Layer: Redis for session and frequently accessed data
- 🔄 Message Queue: RabbitMQ/Kafka for async operations
- 🔄 API Rate Limiting: Protect against abuse
- 🔄 Database Sharding: For very large datasets

---

**System Status:** 🟢 Fully Connected & Operational  
**Last Updated:** December 20, 2025
