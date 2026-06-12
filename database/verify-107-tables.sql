-- ===========================================================
-- LERA Academy - Verify 107 Tables
-- ===========================================================
-- This script verifies that all 107 expected tables exist
-- ===========================================================

-- Count total tables
SELECT 
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 107 THEN '✅ All 107 tables present'
        WHEN COUNT(*) < 107 THEN '⚠️ Missing ' || (107 - COUNT(*)) || ' tables'
        ELSE '⚠️ Extra ' || (COUNT(*) - 107) || ' tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all existing tables alphabetically
\echo ''
\echo '📋 All Tables in Database:'
\echo '================================='
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected 107 tables by module:
\echo ''
\echo '📊 Expected Tables by Module:'
\echo '================================='
\echo 'A. Multi-tenant + Auth + RBAC: 9 tables'
\echo '   tenants, tenant_settings, center_settings, user_roles'
\echo '   impersonation_logs, activity_logs, login_history, system_settings, feature_flags'
\echo ''
\echo 'B. Students & Parents: 5 tables'
\echo '   student_parents, parent_profiles, student_documents, student_skill_levels'
\echo '   (+ students from base schema)'
\echo ''
\echo 'C. Teachers: 3 tables'
\echo '   teacher_documents, teacher_skill_levels'
\echo '   (+ teachers from base schema)'
\echo ''
\echo 'D. Courses: 3 tables'
\echo '   course_modules, course_lessons, course_materials'
\echo ''
\echo 'E. Classes & Attendance: 3 tables'
\echo '   class_schedules, attendance_exceptions'
\echo '   (+ attendance_records from base schema)'
\echo ''
\echo 'F. Assignments & Exams: 2 tables'
\echo '   class_assignments, assignment_submissions'
\echo ''
\echo 'G. Certificates: 2 tables'
\echo '   certificate_templates, certificates'
\echo ''
\echo 'H. CRM Extensions: 13 tables'
\echo '   lead_statuses, lead_notes, lead_tags, lead_tag_assignments'
\echo '   lead_activities, lead_assignments, chat_messages, call_logs'
\echo '   email_logs, crm_automations, crm_automation_rules, crm_triggers'
\echo '   marketing_campaigns, campaign_leads'
\echo ''
\echo 'I. Payments: 3 tables'
\echo '   payment_methods, scholarships, student_scholarships'
\echo ''
\echo 'J. Payroll: 6 tables'
\echo '   payroll_cycles, teacher_salaries, salary_components'
\echo '   salary_payouts, tax_settings, teacher_overtime'
\echo ''
\echo 'K. AI Gateway: 6 tables'
\echo '   ai_exam_requests, ai_generated_exams, ai_content_summaries'
\echo '   ai_chat_sessions, ai_chat_messages, ai_embeddings'
\echo ''
\echo 'L. Website: 4 tables'
\echo '   website_pages, website_sections, website_home_sections, website_contacts'
\echo ''
\echo 'M. Sports/PlayCircle: 6 tables'
\echo '   sports_programs, sports_teams, sports_coaches, sports_matches'
\echo '   sports_training_sessions, sports_player_stats'
\echo ''
\echo 'N. Notifications: 1 table'
\echo '   notification_preferences'
\echo ''
\echo 'O. Storage/Media: 1 table'
\echo '   files'
\echo ''
\echo 'P. Transport & Bookstore: 4 tables'
\echo '   transport_routes, transport_students, bookstore_products, bookstore_orders'
\echo ''
\echo 'Q. Internal Ops: 5 tables'
\echo '   feature_flags, email_templates, sms_templates, api_keys, background_jobs'
\echo ''
\echo 'Base Schema (from init.sql): ~31 tables'
\echo '   centers, roles, permissions, role_permissions, users, user_sessions'
\echo '   audit_logs, course_programs, course_levels, classes, students, teachers'
\echo '   enrollments, class_sessions, attendance_records, exams, exam_questions'
\echo '   exam_results, assignments, assignment_results, leads, followups'
\echo '   invoices, invoice_items, payments, payment_history, payroll'
\echo '   payroll_items, notifications, website_banners, website_testimonials, faqs'
\echo ''
\echo 'TOTAL: 107 tables'
