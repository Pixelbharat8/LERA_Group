-- ===========================================================
-- LERA ACADEMY - Database Tables Verification Script
-- ===========================================================
-- Run this script: psql -d lera -f check_tables.sql
-- ===========================================================

\echo '======================================'
\echo 'LERA ACADEMY DATABASE VERIFICATION'
\echo '======================================'
\echo ''

-- Check PostgreSQL version
\echo 'PostgreSQL Version:'
SELECT version();
\echo ''

-- List all tables
\echo '======================================'
\echo 'ALL TABLES (41 Expected)'
\echo '======================================'
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) AS size
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
\echo ''

-- Count total tables
\echo 'Total Tables Count:'
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
\echo ''

-- SECTION 1: Identity & Access Management (7 tables)
\echo '======================================'
\echo 'SECTION 1: IDENTITY & ACCESS (7 tables)'
\echo '======================================'
SELECT 'centers' as table_name, COUNT(*) as row_count FROM centers
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;
\echo ''

-- SECTION 2: Academy (6 tables)
\echo '======================================'
\echo 'SECTION 2: ACADEMY (6 tables)'
\echo '======================================'
SELECT 'course_programs' as table_name, COUNT(*) as row_count FROM course_programs
UNION ALL
SELECT 'course_levels', COUNT(*) FROM course_levels
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
ORDER BY table_name;
\echo ''

-- SECTION 3: Attendance (3 tables)
\echo '======================================'
\echo 'SECTION 3: ATTENDANCE (3 tables)'
\echo '======================================'
SELECT 'class_sessions' as table_name, COUNT(*) as row_count FROM class_sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'makeup_sessions', COUNT(*) FROM makeup_sessions
ORDER BY table_name;
\echo ''

-- SECTION 4: Exams & Assessments (4 tables)
\echo '======================================'
\echo 'SECTION 4: EXAMS & ASSESSMENTS (4 tables)'
\echo '======================================'
SELECT 'exam_types' as table_name, COUNT(*) as row_count FROM exam_types
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'exam_results', COUNT(*) FROM exam_results
UNION ALL
SELECT 'student_progress', COUNT(*) FROM student_progress
ORDER BY table_name;
\echo ''

-- SECTION 5: CRM (4 tables)
\echo '======================================'
\echo 'SECTION 5: CRM (4 tables)'
\echo '======================================'
SELECT 'lead_sources' as table_name, COUNT(*) as row_count FROM lead_sources
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'lead_followups', COUNT(*) FROM lead_followups
UNION ALL
SELECT 'trial_classes', COUNT(*) FROM trial_classes
ORDER BY table_name;
\echo ''

-- SECTION 6: Payments & Invoicing (6 tables)
\echo '======================================'
\echo 'SECTION 6: PAYMENTS & INVOICING (6 tables)'
\echo '======================================'
SELECT 'fee_structures' as table_name, COUNT(*) as row_count FROM fee_structures
UNION ALL
SELECT 'discounts', COUNT(*) FROM discounts
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'payroll', COUNT(*) FROM payroll
ORDER BY table_name;
\echo ''

-- SECTION 7: Website CMS (7 tables)
\echo '======================================'
\echo 'SECTION 7: WEBSITE CMS (7 tables)'
\echo '======================================'
SELECT 'cms_settings' as table_name, COUNT(*) as row_count FROM cms_settings
UNION ALL
SELECT 'cms_pages', COUNT(*) FROM cms_pages
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials
UNION ALL
SELECT 'media', COUNT(*) FROM media
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'faqs', COUNT(*) FROM faqs
ORDER BY table_name;
\echo ''

-- SECTION 8: Gamification (4 tables)
\echo '======================================'
\echo 'SECTION 8: GAMIFICATION (4 tables)'
\echo '======================================'
SELECT 'badges' as table_name, COUNT(*) as row_count FROM badges
UNION ALL
SELECT 'student_badges', COUNT(*) FROM student_badges
UNION ALL
SELECT 'points_transactions', COUNT(*) FROM points_transactions
UNION ALL
SELECT 'leaderboard', COUNT(*) FROM leaderboard
ORDER BY table_name;
\echo ''

-- SECTION 9: Notifications (1 table)
\echo '======================================'
\echo 'SECTION 9: NOTIFICATIONS (1 table)'
\echo '======================================'
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications;
\echo ''

-- Check Indexes
\echo '======================================'
\echo 'INDEXES (21 Expected)'
\echo '======================================'
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
\echo ''

-- Count total indexes
\echo 'Total Custom Indexes Count:'
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
\echo ''

-- Check Foreign Keys
\echo '======================================'
\echo 'FOREIGN KEY CONSTRAINTS'
\echo '======================================'
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
\echo ''

-- Verify Seed Data
\echo '======================================'
\echo 'SEED DATA VERIFICATION'
\echo '======================================'
\echo 'Roles (Expected: 7):'
SELECT name, display_name FROM roles ORDER BY level DESC;
\echo ''

\echo 'Course Programs (Expected: 6):'
SELECT code, name, age_from, age_to FROM course_programs ORDER BY display_order;
\echo ''

\echo 'Lead Sources (Expected: 7):'
SELECT code, name FROM lead_sources ORDER BY code;
\echo ''

\echo 'Exam Types (Expected: 5):'
SELECT code, name, weight FROM exam_types ORDER BY code;
\echo ''

\echo 'Badges (Expected: 5):'
SELECT code, name FROM badges ORDER BY code;
\echo ''

\echo 'Centers (Expected: 1):'
SELECT code, name, city FROM centers;
\echo ''

\echo 'CMS Settings (Expected: 12):'
SELECT setting_key, LEFT(setting_value, 50) as value FROM cms_settings ORDER BY setting_key;
\echo ''

\echo 'Users (Expected: 1 admin):'
SELECT email, fullname, r.name as role FROM users u
JOIN roles r ON u.role_id = r.id;
\echo ''

\echo '======================================'
\echo 'VERIFICATION COMPLETE!'
\echo '======================================'
\echo 'Database: lera'
\echo 'Expected: 41 tables, 21 indexes'
\echo 'Run: SELECT NOW() as verification_time;'
SELECT NOW() as verification_time;
