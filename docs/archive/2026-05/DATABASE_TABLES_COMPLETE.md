# LERA ACADEMY - Complete Database Tables Overview

**Database Name:** `lera`  
**Total Tables:** 41  
**Total Indexes:** 21  
**PostgreSQL Version:** 15.15

---

## 📊 SECTION 1: IDENTITY & ACCESS MANAGEMENT (7 Tables)

### 1.1 `centers` - Learning Centers
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Store information about LERA Academy learning centers
- **Key Columns:**
  - `code`, `name`, `name_vi` (bilingual)
  - `address`, `city`, `district`
  - `phone`, `email`, `manager_id`
  - `logo_url`, `status`, `capacity`
- **Seed Data:** 1 center (LERA Academy Main Center)

### 1.2 `roles` - User Roles
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `name`
- **Purpose:** Define user roles and permissions hierarchy
- **Key Columns:**
  - `name`, `display_name`, `display_name_vi`
  - `level` (100=SUPER_ADMIN, 90=ADMIN, etc.)
  - `is_system_role`
- **Seed Data:** 7 roles
  - SUPER_ADMIN (100)
  - ADMIN (90)
  - CENTER_MANAGER (80)
  - ACADEMIC_MANAGER (70)
  - TEACHER (50)
  - PARENT (20)
  - STUDENT (10)

### 1.3 `permissions` - System Permissions
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Define granular permissions for different modules
- **Key Columns:**
  - `code` (e.g., 'users.view', 'students.create')
  - `name`, `module`, `description`
- **Seed Data:** 20 permissions across modules:
  - users (view, create, edit, delete)
  - students (view, create, edit, delete)
  - classes (view, create, edit, delete)
  - attendance (view, mark)
  - payments (view, create)
  - cms (view, edit)
  - reports (view, export)

### 1.4 `role_permissions` - Role-Permission Mapping
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `role_id` → roles, `permission_id` → permissions
- **Purpose:** Many-to-many relationship between roles and permissions
- **Unique Constraint:** `(role_id, permission_id)`

### 1.5 `users` - System Users
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `email`
- **Foreign Keys:** `role_id` → roles, `center_id` → centers
- **Purpose:** Store all system users (admins, teachers, parents, students)
- **Key Columns:**
  - `email`, `password_hash`, `fullname`, `fullname_vi`
  - `phone`, `avatar_url`
  - `status` (ACTIVE/INACTIVE), `email_verified`
  - `last_login`
- **Seed Data:** 1 admin user
  - Email: admin@lera.com
  - Password: admin123 (hashed)
  - Role: SUPER_ADMIN
- **Index:** `idx_users_email`, `idx_users_role`, `idx_users_center`

### 1.6 `user_sessions` - Authentication Sessions
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `user_id` → users
- **Purpose:** Track user login sessions and JWT tokens
- **Key Columns:**
  - `token_hash`, `refresh_token_hash`
  - `ip_address`, `user_agent`
  - `expires_at`

### 1.7 `audit_logs` - Activity Audit Trail
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `user_id` → users
- **Purpose:** Track all important system actions for compliance
- **Key Columns:**
  - `action`, `entity_type`, `entity_id`
  - `old_values`, `new_values` (JSONB)
  - `ip_address`, `user_agent`

---

## 📚 SECTION 2: ACADEMY (6 Tables)

### 2.1 `course_programs` - Course Programs
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Define main course programs offered by LERA
- **Key Columns:**
  - `code`, `name`, `name_vi`, `description`, `description_vi`
  - `age_from`, `age_to`, `category`, `level`
  - `price`, `image_url`, `color`
  - `is_featured`, `is_active`, `display_order`
- **Seed Data:** 6 programs
  - STARTERS (ages 4-6, kids/beginner)
  - EXPLORERS (ages 7-9, kids/elementary)
  - PRIMARY (ages 10-12, kids/intermediate)
  - TEENS (ages 13-17, teens/intermediate)
  - IELTS_SAT (ages 15-99, exam/advanced)
  - BUSINESS (ages 18-99, adult/all)

### 2.2 `course_levels` - Course Levels
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `program_id` → course_programs
- **Purpose:** Define levels within each course program
- **Key Columns:**
  - `name`, `name_vi`, `sequence`
  - `duration_months`, `total_lessons`
  - `description`

### 2.3 `classes` - Teaching Classes
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** 
  - `center_id` → centers
  - `program_id` → course_programs
  - `level_id` → course_levels
  - `teacher_id`, `assistant_teacher_id` → teachers
- **Purpose:** Actual teaching classes with schedules
- **Key Columns:**
  - `name`, `room`
  - `schedule_days`, `schedule_time_start`, `schedule_time_end`
  - `start_date`, `end_date`
  - `max_students`, `status` (OPEN/CLOSED/IN_PROGRESS)
- **Indexes:** `idx_classes_center`, `idx_classes_program`, `idx_classes_teacher`

### 2.4 `students` - Student Profiles
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `student_code`
- **Foreign Keys:**
  - `user_id` → users (optional, for student portal access)
  - `parent_id` → users
  - `center_id` → centers
- **Purpose:** Store detailed student information
- **Key Columns:**
  - `student_code`, `fullname`, `fullname_vi`
  - `date_of_birth`, `gender`, `avatar_url`
  - `school_name`, `grade`
  - `emergency_contact_name`, `emergency_contact_phone`
  - `medical_notes`, `learning_notes`
  - `status`, `enrollment_date`
- **Indexes:** `idx_students_code`, `idx_students_center`, `idx_students_parent`

### 2.5 `teachers` - Teacher Profiles
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `teacher_code`
- **Foreign Keys:**
  - `user_id` → users
  - `center_id` → centers
- **Purpose:** Store teacher information and qualifications
- **Key Columns:**
  - `teacher_code`, `specialization`, `qualification`
  - `years_of_experience`, `nationality`
  - `bio`, `bio_vi`
  - `hourly_rate`, `contract_type`
  - `is_native_speaker`, `is_featured`, `status`
- **Indexes:** `idx_teachers_code`, `idx_teachers_center`

### 2.6 `enrollments` - Student Class Enrollments
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `student_id` → students
  - `class_id` → classes
- **Purpose:** Track which students are enrolled in which classes
- **Key Columns:**
  - `enrollment_date`, `start_date`, `end_date`
  - `status` (ACTIVE/COMPLETED/DROPPED)
  - `notes`
- **Unique Constraint:** `(student_id, class_id)`
- **Indexes:** `idx_enrollments_student`, `idx_enrollments_class`

---

## ✅ SECTION 3: ATTENDANCE (3 Tables)

### 3.1 `class_sessions` - Class Sessions
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `class_id` → classes
- **Purpose:** Individual class sessions scheduled or completed
- **Key Columns:**
  - `session_date`, `start_time`, `end_time`
  - `topic`, `notes`
  - `status` (SCHEDULED/COMPLETED/CANCELLED)

### 3.2 `attendance` - Attendance Records
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `session_id` → class_sessions
  - `student_id` → students
  - `marked_by` → users
- **Purpose:** Track student attendance for each session
- **Key Columns:**
  - `status` (PRESENT/ABSENT/LATE/EXCUSED)
  - `check_in_time`, `check_out_time`
  - `notes`
- **Unique Constraint:** `(session_id, student_id)`
- **Indexes:** `idx_attendance_session`, `idx_attendance_student`

### 3.3 `makeup_sessions` - Makeup Classes
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `original_session_id` → class_sessions
  - `makeup_session_id` → class_sessions
  - `student_id` → students
  - `approved_by` → users
- **Purpose:** Track makeup sessions for missed classes
- **Key Columns:**
  - `reason`, `status` (PENDING/APPROVED/COMPLETED)

---

## 📝 SECTION 4: EXAMS & ASSESSMENTS (4 Tables)

### 4.1 `exam_types` - Exam Types
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Define types of exams and their weights
- **Key Columns:**
  - `code`, `name`, `name_vi`
  - `weight` (for grade calculation)
  - `description`
- **Seed Data:** 5 types
  - PLACEMENT (weight: 0)
  - MIDTERM (weight: 0.3)
  - FINAL (weight: 0.5)
  - QUIZ (weight: 0.1)
  - HOMEWORK (weight: 0.1)

### 4.2 `exams` - Exams
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `class_id` → classes
  - `exam_type_id` → exam_types
  - `created_by` → users
- **Purpose:** Create and schedule exams
- **Key Columns:**
  - `name`, `exam_date`
  - `max_score`, `passing_score`, `duration_minutes`
  - `description`

### 4.3 `exam_results` - Exam Results
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `exam_id` → exams
  - `student_id` → students
  - `graded_by` → users
- **Purpose:** Store student exam scores
- **Key Columns:**
  - `score`, `grade` (A/B/C/D/F)
  - `feedback`
  - `graded_at`
- **Unique Constraint:** `(exam_id, student_id)`

### 4.4 `student_progress` - Progress Reports
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `student_id` → students
  - `class_id` → classes
- **Purpose:** Comprehensive student progress tracking
- **Key Columns:**
  - `period` (MONTHLY/QUARTERLY/SEMESTER)
  - `overall_score`, `attendance_rate`, `homework_completion`
  - `teacher_notes`, `parent_notes`

---

## 📞 SECTION 5: CRM (4 Tables)

### 5.1 `lead_sources` - Lead Sources
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Track where leads come from
- **Seed Data:** 7 sources
  - WEBSITE, FACEBOOK, GOOGLE, REFERRAL, WALKIN, PHONE, EVENT

### 5.2 `leads` - Sales Leads
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `center_id` → centers
  - `source_id` → lead_sources
  - `interested_program_id` → course_programs
  - `assigned_to` → users
  - `converted_student_id` → students
- **Purpose:** Manage prospective students and inquiries
- **Key Columns:**
  - `parent_name`, `parent_phone`, `parent_email`
  - `student_name`, `student_age`
  - `preferred_schedule`, `notes`
  - `status` (NEW/CONTACTED/QUALIFIED/CONVERTED/LOST)
  - `conversion_date`
  - `utm_source`, `utm_medium`, `utm_campaign` (marketing tracking)
- **Indexes:** `idx_leads_center`, `idx_leads_status`, `idx_leads_assigned`

### 5.3 `lead_followups` - Lead Follow-ups
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `lead_id` → leads
  - `user_id` → users
- **Purpose:** Track all interactions with leads
- **Key Columns:**
  - `action_type` (CALL/EMAIL/SMS/MEETING/VISIT)
  - `notes`, `next_followup_date`, `outcome`

### 5.4 `trial_classes` - Trial Class Bookings
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `lead_id` → leads
  - `class_id` → classes
- **Purpose:** Schedule and track trial class experiences
- **Key Columns:**
  - `trial_date`, `feedback`, `rating`
  - `status` (SCHEDULED/COMPLETED/NO_SHOW)

---

## 💰 SECTION 6: PAYMENTS & INVOICING (6 Tables)

### 6.1 `fee_structures` - Fee Structures
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `program_id` → course_programs
  - `center_id` → centers
- **Purpose:** Define pricing for courses and services
- **Key Columns:**
  - `name`, `name_vi`, `fee_type`
  - `amount`, `currency` (VND)
  - `billing_cycle` (MONTHLY/QUARTERLY/YEARLY)
  - `valid_from`, `valid_to`, `is_active`

### 6.2 `discounts` - Discount Codes
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Manage discount codes and promotions
- **Key Columns:**
  - `code`, `name`, `name_vi`
  - `discount_type` (PERCENTAGE/FIXED)
  - `discount_value`
  - `max_uses`, `current_uses`, `min_purchase`
  - `valid_from`, `valid_to`, `is_active`

### 6.3 `invoices` - Student Invoices
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `invoice_number`
- **Foreign Keys:**
  - `student_id` → students
  - `center_id` → centers
  - `discount_id` → discounts
  - `created_by` → users
- **Purpose:** Generate invoices for tuition and fees
- **Key Columns:**
  - `invoice_number`, `subtotal`, `discount_amount`
  - `tax_amount`, `total_amount`, `currency`
  - `status` (PENDING/PAID/OVERDUE/CANCELLED)
  - `due_date`, `paid_at`, `notes`
- **Indexes:** `idx_invoices_student`, `idx_invoices_status`

### 6.4 `invoice_items` - Invoice Line Items
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `invoice_id` → invoices
  - `fee_structure_id` → fee_structures
  - `class_id` → classes
- **Purpose:** Detail each item on an invoice
- **Key Columns:**
  - `description`, `description_vi`
  - `quantity`, `unit_price`, `total_price`

### 6.5 `payments` - Payment Records
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `invoice_id` → invoices
  - `processed_by` → users
- **Purpose:** Track payment transactions
- **Key Columns:**
  - `payment_method` (CASH/CARD/BANK_TRANSFER/MOMO/VNPAY)
  - `amount`, `currency`
  - `transaction_id`, `payment_gateway`
  - `status` (PENDING/COMPLETED/FAILED/REFUNDED)
  - `paid_at`, `notes`

### 6.6 `payroll` - Teacher Payroll
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `teacher_id` → teachers
  - `approved_by` → users
- **Purpose:** Manage teacher salary and payments
- **Key Columns:**
  - `pay_period_start`, `pay_period_end`
  - `base_salary`, `teaching_hours`, `hourly_rate`
  - `teaching_amount`, `bonus`, `deductions`
  - `total_amount`, `currency`
  - `status` (PENDING/APPROVED/PAID)
  - `paid_at`, `notes`

---

## 🌐 SECTION 7: WEBSITE CMS (7 Tables)

### 7.1 `cms_settings` - CMS Settings
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `setting_key`
- **Purpose:** Store website configuration
- **Key Columns:**
  - `setting_key`, `setting_value`
  - `setting_type` (text/url/color/number)
  - `category` (general/contact/social/branding)
- **Seed Data:** 12 settings
  - site_name, site_tagline (bilingual)
  - contact_phone, contact_email, contact_address
  - facebook_url, instagram_url, youtube_url
  - primary_color, secondary_color

### 7.2 `cms_pages` - CMS Pages
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `slug`
- **Purpose:** Dynamic website pages
- **Key Columns:**
  - `slug`, `title`, `title_vi`
  - `content`, `content_vi`
  - `meta_title`, `meta_description`, `meta_keywords`
  - `is_published`, `published_at`

### 7.3 `blog_posts` - Blog Posts
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `slug`
- **Foreign Keys:** `author_id` → users
- **Purpose:** Blog/news articles
- **Key Columns:**
  - `slug`, `title`, `title_vi`
  - `excerpt`, `excerpt_vi`, `content`, `content_vi`
  - `featured_image`, `category`, `tags`
  - `is_featured`, `is_published`, `views`

### 7.4 `testimonials` - Parent Testimonials
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `program_id` → course_programs
  - `center_id` → centers
- **Purpose:** Student/parent success stories
- **Key Columns:**
  - `parent_name`, `parent_name_vi`
  - `student_name`, `student_age`
  - `rating` (1-5), `content`, `content_vi`
  - `avatar_url`
  - `is_featured`, `is_published`, `display_order`

### 7.5 `media` - Media Library
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `uploaded_by` → users
- **Purpose:** Store uploaded files and images
- **Key Columns:**
  - `filename`, `original_filename`
  - `file_path`, `file_url`
  - `file_type`, `file_size`, `mime_type`
  - `alt_text`, `caption`, `folder`

### 7.6 `banners` - Homepage Banners
- **Primary Key:** `id` (UUID)
- **Purpose:** Promotional banners/sliders
- **Key Columns:**
  - `title`, `title_vi`, `subtitle`, `subtitle_vi`
  - `image_url`, `image_url_mobile`, `link_url`
  - `button_text`, `button_text_vi`
  - `position` (homepage/courses/about)
  - `display_order`, `start_date`, `end_date`
  - `is_active`

### 7.7 `faqs` - FAQs
- **Primary Key:** `id` (UUID)
- **Purpose:** Frequently Asked Questions
- **Key Columns:**
  - `question`, `question_vi`
  - `answer`, `answer_vi`
  - `category`, `display_order`
  - `is_published`

---

## 🎮 SECTION 8: GAMIFICATION (4 Tables)

### 8.1 `badges` - Achievement Badges
- **Primary Key:** `id` (UUID)
- **Unique Keys:** `code`
- **Purpose:** Define achievement badges
- **Key Columns:**
  - `code`, `name`, `name_vi`
  - `description`, `description_vi`
  - `icon_url`, `points_required`
  - `category` (milestone/attendance/academic)
- **Seed Data:** 5 badges
  - FIRST_DAY (0 points)
  - PERFECT_ATTENDANCE (100 points)
  - HOMEWORK_HERO (100 points)
  - STAR_STUDENT (500 points)
  - LEVEL_UP (200 points)

### 8.2 `student_badges` - Earned Badges
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `student_id` → students
  - `badge_id` → badges
  - `awarded_by` → users
- **Purpose:** Track which students earned which badges
- **Unique Constraint:** `(student_id, badge_id)`

### 8.3 `points_transactions` - Points History
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `student_id` → students
  - `created_by` → users
- **Purpose:** Track all point additions/deductions
- **Key Columns:**
  - `points` (positive or negative)
  - `transaction_type` (EARNED/REDEEMED/BONUS/PENALTY)
  - `description`
  - `reference_type`, `reference_id` (link to attendance, exam, etc.)

### 8.4 `leaderboard` - Student Rankings
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `student_id` → students
  - `center_id` → centers
  - `class_id` → classes
- **Purpose:** Track student rankings by period
- **Key Columns:**
  - `period` (WEEKLY/MONTHLY/YEARLY)
  - `period_value` (e.g., '2024-01')
  - `total_points`, `rank`
- **Unique Constraint:** `(student_id, period, period_value)`

---

## 🔔 SECTION 9: NOTIFICATIONS (1 Table)

### 9.1 `notifications` - User Notifications
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `user_id` → users
- **Purpose:** In-app notifications for users
- **Key Columns:**
  - `title`, `title_vi`, `message`, `message_vi`
  - `type` (INFO/SUCCESS/WARNING/ERROR)
  - `reference_type`, `reference_id` (link to related entity)
  - `is_read`, `read_at`
- **Indexes:** 
  - `idx_notifications_user`
  - `idx_notifications_unread` (filtered index for unread)

---

## 📑 DATABASE INDEXES (21 Total)

### Identity & Access
1. `idx_users_email` - Fast user lookup by email
2. `idx_users_role` - Filter users by role
3. `idx_users_center` - Users by center

### Academy
4. `idx_students_code` - Unique student code lookup
5. `idx_students_center` - Students by center
6. `idx_students_parent` - Students by parent
7. `idx_teachers_code` - Teacher code lookup
8. `idx_teachers_center` - Teachers by center
9. `idx_classes_center` - Classes by center
10. `idx_classes_program` - Classes by program
11. `idx_classes_teacher` - Classes by teacher
12. `idx_enrollments_student` - Student's enrollments
13. `idx_enrollments_class` - Class enrollments

### Attendance
14. `idx_attendance_session` - Attendance by session
15. `idx_attendance_student` - Student attendance history

### CRM
16. `idx_leads_center` - Leads by center
17. `idx_leads_status` - Leads by status
18. `idx_leads_assigned` - Assigned leads

### Payments
19. `idx_invoices_student` - Student invoices
20. `idx_invoices_status` - Invoices by status

### Notifications
21. `idx_notifications_user` - User notifications
22. `idx_notifications_unread` - Unread notifications (filtered)

---

## 🔗 FOREIGN KEY RELATIONSHIPS

**Total Foreign Keys:** ~50+

### Key Relationships:
- **users** ← centers, roles
- **students** ← users (parent), centers, users (student account)
- **teachers** ← users, centers
- **classes** ← centers, course_programs, course_levels, teachers
- **enrollments** ← students, classes
- **attendance** ← class_sessions, students, users (marker)
- **leads** ← centers, lead_sources, course_programs, users (assignee), students (converted)
- **invoices** ← students, centers, discounts, users (creator)
- **payments** ← invoices, users (processor)
- **All tables** reference appropriate lookup/master tables

---

## ✅ VERIFICATION CHECKLIST

To verify your database is complete, run:

```bash
psql -d lera -f /Users/rahulsharma/LERA_Group/database/check_tables.sql
```

### Expected Results:
- ✅ 41 tables created
- ✅ 21 custom indexes (idx_*)
- ✅ ~50+ foreign key constraints
- ✅ uuid-ossp extension enabled
- ✅ Seed data loaded:
  - 7 roles
  - 20 permissions
  - 7 lead sources
  - 5 exam types
  - 6 course programs
  - 1 center
  - 12 CMS settings
  - 5 badges
  - 1 admin user

### Quick Verification Commands:

```sql
-- Count all tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 41

-- Count indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
-- Expected: 21

-- Verify admin user
SELECT email, fullname FROM users WHERE email = 'admin@lera.com';
-- Expected: admin@lera.com | Super Administrator

-- Check seed data counts
SELECT 
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM course_programs) as programs,
    (SELECT COUNT(*) FROM lead_sources) as sources,
    (SELECT COUNT(*) FROM exam_types) as exam_types,
    (SELECT COUNT(*) FROM badges) as badges,
    (SELECT COUNT(*) FROM centers) as centers,
    (SELECT COUNT(*) FROM cms_settings) as settings;
-- Expected: 7, 20, 6, 7, 5, 5, 1, 12
```

---

## 🎯 DATABASE STATUS: READY FOR PRODUCTION

**Schema Version:** v20 (Complete)  
**Last Updated:** December 20, 2025  
**Status:** ✅ Fully Initialized  
**Backend Services Ready:** YES (ports 8080-8085)  
**Frontend Ready:** YES (port 3000)

**Default Login:**
- Email: `admin@lera.com`
- Password: `admin123`
- Role: Super Administrator

---

*Generated from init.sql schema analysis*
