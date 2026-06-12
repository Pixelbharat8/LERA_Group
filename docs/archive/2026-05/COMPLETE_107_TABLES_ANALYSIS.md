# 🔍 LERA Academy - Complete 107 Tables Schema

**Total Tables:** 107  
**Current Implementation:** 41 tables in init.sql  
**Gap:** 66 tables need to be added

---

## 📊 Complete Table Breakdown

### 🟦 A. MULTI-TENANT + AUTH + RBAC (15 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 1 | `tenants` | 🔴 Missing | Need to create | Identity |
| 2 | `tenant_settings` | 🔴 Missing | Need to create | Identity |
| 3 | `centers` | ✅ Exists | Center.java | Identity |
| 4 | `center_settings` | 🔴 Missing | Need to create | Identity |
| 5 | `users` | ✅ Exists | User.java | Identity |
| 6 | `roles` | ✅ Exists | Role.java | Identity |
| 7 | `permissions` | ✅ Exists | Permission.java | Identity |
| 8 | `user_roles` | 🔴 Missing | Need to create | Identity |
| 9 | `role_permissions` | ✅ Exists | (Join table) | Identity |
| 10 | `impersonation_logs` | 🔴 Missing | Need to create | Identity |
| 11 | `audit_logs` | ✅ Exists | Future | Identity |
| 12 | `activity_logs` | 🔴 Missing | Need to create | Identity |
| 13 | `login_history` | 🔴 Missing | Need to create | Identity |
| 14 | `system_settings` | 🔴 Missing | Need to create | Identity |
| 15 | `user_sessions` | ✅ Exists | JWT-based | Identity |

**Summary:** 6/15 exist ✅ | 9/15 missing 🔴

---

### 🟦 B. STUDENTS & PARENTS (7 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 16 | `students` | ✅ Exists | Student.java | Academy |
| 17 | `student_profiles` | 🔴 Missing | Merge with students | Academy |
| 18 | `student_parents` | 🔴 Missing | Need to create | Academy |
| 19 | `parent_profiles` | 🔴 Missing | Need to create | Academy |
| 20 | `student_documents` | 🔴 Missing | Need to create | Academy |
| 21 | `student_progress` | ✅ Exists | Future | Academy |
| 22 | `student_skill_levels` | 🔴 Missing | Need to create | Academy |

**Summary:** 2/7 exist ✅ | 5/7 missing 🔴

---

### 🟩 C. TEACHERS (4 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 23 | `teachers` | ✅ Exists | Teacher.java | Academy |
| 24 | `teacher_profiles` | 🔴 Missing | Merge with teachers | Academy |
| 25 | `teacher_documents` | 🔴 Missing | Need to create | Academy |
| 26 | `teacher_skill_levels` | 🔴 Missing | Need to create | Academy |

**Summary:** 1/4 exist ✅ | 3/4 missing 🔴

---

### 📘 D. COURSES (4 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 27 | `courses` | ✅ Exists (as course_programs) | CourseProgram.java | Academy |
| 28 | `course_modules` | 🔴 Missing | Need to create | Academy |
| 29 | `course_lessons` | 🔴 Missing | Need to create | Academy |
| 30 | `course_materials` | 🔴 Missing | Need to create | Academy |

**Summary:** 1/4 exist ✅ | 3/4 missing 🔴

---

### 🟨 E. CLASSES & ATTENDANCE (7 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 31 | `classes` | ✅ Exists | ClassEntity.java | Academy |
| 32 | `class_schedules` | 🔴 Missing | Need to create | Academy |
| 33 | `class_students` | ✅ Exists (as enrollments) | Enrollment.java | Academy |
| 34 | `class_attendance` | 🔴 Missing | Need to create | Attendance |
| 35 | `attendance_sessions` | ✅ Exists (as class_sessions) | Future | Attendance |
| 36 | `student_attendance` | ✅ Exists (as attendance) | AttendanceRecord.java | Attendance |
| 37 | `attendance_exceptions` | 🔴 Missing | Need to create | Attendance |

**Summary:** 4/7 exist ✅ | 3/7 missing 🔴

---

### 📝 F. ASSIGNMENTS & EXAMS (4 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 38 | `class_assignments` | 🔴 Missing | Need to create | Academy |
| 39 | `assignment_submissions` | 🔴 Missing | Need to create | Academy |
| 40 | `exams` | ✅ Exists | Future | Academy |
| 41 | `exam_results` | ✅ Exists | Future | Academy |

**Summary:** 2/4 exist ✅ | 2/4 missing 🔴

---

### 🎓 G. CERTIFICATES (2 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 42 | `certificates` | 🔴 Missing | Need to create | Academy |
| 43 | `certificate_templates` | 🔴 Missing | Need to create | Academy |

**Summary:** 0/2 exist ❌ | 2/2 missing 🔴

---

### 🟪 H. CRM — LEADS, SALES, CHAT, AUTOMATION (16 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 44 | `leads` | ✅ Exists | Lead.java | Connect |
| 45 | `lead_sources` | ✅ Exists | Future | Connect |
| 46 | `lead_statuses` | 🔴 Missing | Need to create | Connect |
| 47 | `lead_notes` | 🔴 Missing | Need to create | Connect |
| 48 | `lead_tags` | 🔴 Missing | Need to create | Connect |
| 49 | `lead_activities` | 🔴 Missing | Need to create | Connect |
| 50 | `lead_assignments` | 🔴 Missing | Need to create | Connect |
| 51 | `lead_followups` | ✅ Exists | Followup.java | Connect |
| 52 | `chat_messages` | 🔴 Missing | Need to create | Connect |
| 53 | `call_logs` | 🔴 Missing | Need to create | Connect |
| 54 | `email_logs` | 🔴 Missing | Need to create | Connect |
| 55 | `crm_automations` | 🔴 Missing | Need to create | Connect |
| 56 | `crm_automation_rules` | 🔴 Missing | Need to create | Connect |
| 57 | `crm_triggers` | 🔴 Missing | Need to create | Connect |
| 58 | `marketing_campaigns` | 🔴 Missing | Need to create | Connect |
| 59 | `campaign_leads` | 🔴 Missing | Need to create | Connect |

**Summary:** 3/16 exist ✅ | 13/16 missing 🔴

---

### 🟧 I. PAYMENTS & INVOICES (6 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 60 | `invoices` | ✅ Exists | Future | Payment |
| 61 | `invoice_items` | ✅ Exists | Future | Payment |
| 62 | `payments` | ✅ Exists | Payment.java | Payment |
| 63 | `payment_methods` | 🔴 Missing | Need to create | Payment |
| 64 | `discounts` | ✅ Exists | Future | Payment |
| 65 | `scholarships` | 🔴 Missing | Need to create | Payment |

**Summary:** 4/6 exist ✅ | 2/6 missing 🔴

---

### 💰 J. PAYROLL SYSTEM (6 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 66 | `payroll_cycles` | 🔴 Missing | Need to create | Payroll |
| 67 | `teacher_salaries` | ✅ Exists (as payroll) | PayrollRecord.java | Payroll |
| 68 | `salary_components` | 🔴 Missing | Need to create | Payroll |
| 69 | `salary_payouts` | 🔴 Missing | Need to create | Payroll |
| 70 | `tax_settings` | 🔴 Missing | Need to create | Payroll |
| 71 | `teacher_overtime` | 🔴 Missing | Need to create | Payroll |

**Summary:** 1/6 exist ✅ | 5/6 missing 🔴

---

### 🧠 K. AI GATEWAY (6 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 72 | `ai_exam_requests` | 🔴 Missing | Need to create | AI Gateway |
| 73 | `ai_generated_exams` | 🔴 Missing | Need to create | AI Gateway |
| 74 | `ai_content_summaries` | 🔴 Missing | Need to create | AI Gateway |
| 75 | `ai_chat_sessions` | 🔴 Missing | Need to create | AI Gateway |
| 76 | `ai_chat_messages` | 🔴 Missing | Need to create | AI Gateway |
| 77 | `ai_embeddings` | 🔴 Missing | Need to create | AI Gateway |

**Summary:** 0/6 exist ❌ | 6/6 missing 🔴

---

### 🌍 L. PUBLIC WEBSITE MANAGEMENT (7 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 78 | `website_pages` | ✅ Exists (as cms_pages) | Future | Academy |
| 79 | `website_sections` | 🔴 Missing | Need to create | Academy |
| 80 | `website_home_sections` | 🔴 Missing | Need to create | Academy |
| 81 | `website_courses` | 🔴 Missing | Use course_programs | Academy |
| 82 | `website_testimonials` | ✅ Exists (as testimonials) | Testimonial.java | Academy |
| 83 | `website_blog_posts` | ✅ Exists (as blog_posts) | BlogPost.java | Academy |
| 84 | `website_contacts` | 🔴 Missing | Need to create | Academy |

**Summary:** 3/7 exist ✅ | 4/7 missing 🔴

---

### 🟫 M. SPORTS (PLAYCIRCLE) (6 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 85 | `sports_programs` | 🔴 Missing | Need to create | Sports (new) |
| 86 | `sports_teams` | 🔴 Missing | Need to create | Sports (new) |
| 87 | `sports_coaches` | 🔴 Missing | Need to create | Sports (new) |
| 88 | `sports_matches` | 🔴 Missing | Need to create | Sports (new) |
| 89 | `sports_training_sessions` | 🔴 Missing | Need to create | Sports (new) |
| 90 | `sports_player_stats` | 🔴 Missing | Need to create | Sports (new) |

**Summary:** 0/6 exist ❌ | 6/6 missing 🔴

---

### 🔔 N. NOTIFICATIONS (2 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 91 | `notifications` | ✅ Exists | Future | Rule Engine |
| 92 | `notification_preferences` | 🔴 Missing | Need to create | Rule Engine |

**Summary:** 1/2 exist ✅ | 1/2 missing 🔴

---

### 🗂 O. STORAGE / MEDIA (2 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 93 | `files` | 🔴 Missing | Need to create | Academy |
| 94 | `media_library` | ✅ Exists (as media) | Future | Academy |

**Summary:** 1/2 exist ✅ | 1/2 missing 🔴

---

### 📊 P. MATERIALIZED VIEWS (5 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 95 | `mv_center_dashboard` | 🔴 Missing | Materialized View | Analytics |
| 96 | `mv_academy_performance` | 🔴 Missing | Materialized View | Analytics |
| 97 | `mv_connect_leads_analytics` | 🔴 Missing | Materialized View | Analytics |
| 98 | `mv_teacher_salary_summary` | 🔴 Missing | Materialized View | Analytics |
| 99 | `mv_payment_overview` | 🔴 Missing | Materialized View | Analytics |

**Summary:** 0/5 exist ❌ | 5/5 missing 🔴

---

### 🧩 Q. FUTURE EXPANSION (4 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 100 | `transport_routes` | 🔴 Missing | Need to create | Transport (new) |
| 101 | `transport_students` | 🔴 Missing | Need to create | Transport (new) |
| 102 | `bookstore_products` | 🔴 Missing | Need to create | Bookstore (new) |
| 103 | `bookstore_orders` | 🔴 Missing | Need to create | Bookstore (new) |

**Summary:** 0/4 exist ❌ | 4/4 missing 🔴

---

### 🟦 R. INTERNAL OPS (4 tables)

| # | Table Name | Status | Backend Entity | Service |
|---|------------|--------|----------------|---------|
| 104 | `feature_flags` | 🔴 Missing | Need to create | Identity |
| 105 | `email_templates` | 🔴 Missing | Need to create | Rule Engine |
| 106 | `sms_templates` | 🔴 Missing | Need to create | Rule Engine |
| 107 | `api_keys` | 🔴 Missing | Need to create | Identity |
| 108 | `background_jobs` | 🔴 Missing | Need to create | Rule Engine |

**Summary:** 0/5 exist ❌ | 5/5 missing 🔴

---

## 📊 OVERALL SUMMARY

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ **Exists in database** | 41 | 38% |
| 🔴 **Missing - Need to add** | 66 | 62% |
| **TOTAL** | **107** | **100%** |

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Critical (Multi-Tenant Foundation) - 15 tables
1. `tenants` - Multi-tenant core
2. `tenant_settings` - Tenant configuration
3. `center_settings` - Center-specific settings
4. `user_roles` - User role assignments
5. `login_history` - Security tracking
6. `activity_logs` - User activity
7. `system_settings` - System configuration
8. `student_parents` - Parent-student relationships
9. `parent_profiles` - Parent information
10. `class_schedules` - Class scheduling
11. `payment_methods` - Payment options
12. `payroll_cycles` - Payroll management
13. `email_templates` - Communication
14. `sms_templates` - SMS communication
15. `feature_flags` - Feature management

### Phase 2: Core Features - 20 tables
- Course modules and lessons
- Assignments and submissions
- Certificates
- Teacher/Student documents
- Lead management extensions
- Payment enhancements

### Phase 3: Advanced Features - 16 tables
- AI Gateway tables
- CRM Automation
- Marketing campaigns
- Analytics views

### Phase 4: Optional Modules - 15 tables
- Sports management
- Transport
- Bookstore
- Extended CRM

---

## 🚀 NEXT STEPS

1. **Create Complete Schema SQL**
   - Generate SQL for all 66 missing tables
   - Add proper foreign keys and indexes
   - Include seed data where needed

2. **Update Backend Entities**
   - Create Java entities for new tables
   - Add repositories
   - Implement services
   - Create controllers

3. **Update Frontend**
   - Add pages for new features
   - Update API calls
   - Add forms and validations

4. **Testing**
   - Test multi-tenant functionality
   - Test all new features
   - Performance testing

Would you like me to:
1. Create the complete 107-table SQL schema?
2. Update the backend entities for Phase 1 (critical tables)?
3. Create a migration script to add the missing tables?
