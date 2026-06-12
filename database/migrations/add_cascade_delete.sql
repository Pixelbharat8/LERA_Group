-- =====================================================
-- CASCADE DELETE CONFIGURATION
-- =====================================================
-- This script updates foreign key constraints to enable
-- cascade deletion when a user is deleted.
--
-- IMPORTANT: This will allow deletion of users to 
-- automatically delete ALL related records.
-- Use with caution!
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- PHASE 1: Update teachers table foreign key
-- =====================================================
ALTER TABLE teachers 
DROP CONSTRAINT IF EXISTS teachers_user_id_fkey,
ADD CONSTRAINT teachers_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- =====================================================
-- PHASE 2: Update teacher-related tables
-- =====================================================

-- Teacher Documents
ALTER TABLE teacher_documents 
DROP CONSTRAINT IF EXISTS teacher_documents_teacher_id_fkey,
ADD CONSTRAINT teacher_documents_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

ALTER TABLE teacher_documents 
DROP CONSTRAINT IF EXISTS teacher_documents_verified_by_fkey,
ADD CONSTRAINT teacher_documents_verified_by_fkey 
  FOREIGN KEY (verified_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Teacher Skill Levels
ALTER TABLE teacher_skill_levels 
DROP CONSTRAINT IF EXISTS teacher_skill_levels_teacher_id_fkey,
ADD CONSTRAINT teacher_skill_levels_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

-- Teacher Salaries
ALTER TABLE teacher_salaries 
DROP CONSTRAINT IF EXISTS teacher_salaries_teacher_id_fkey,
ADD CONSTRAINT teacher_salaries_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

-- Teacher Overtime
ALTER TABLE teacher_overtime 
DROP CONSTRAINT IF EXISTS teacher_overtime_teacher_id_fkey,
ADD CONSTRAINT teacher_overtime_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

ALTER TABLE teacher_overtime 
DROP CONSTRAINT IF EXISTS teacher_overtime_approved_by_fkey,
ADD CONSTRAINT teacher_overtime_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- AI Exam Requests
ALTER TABLE ai_exam_requests 
DROP CONSTRAINT IF EXISTS ai_exam_requests_teacher_id_fkey,
ADD CONSTRAINT ai_exam_requests_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

-- Lesson Plans
ALTER TABLE lesson_plans 
DROP CONSTRAINT IF EXISTS lesson_plans_teacher_id_fkey,
ADD CONSTRAINT lesson_plans_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

-- Teacher Assignments
ALTER TABLE teacher_assignments 
DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_fkey,
ADD CONSTRAINT teacher_assignments_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

-- =====================================================
-- PHASE 3: Update other user-related tables
-- (Set to SET NULL or CASCADE based on business logic)
-- =====================================================

-- Students
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_user_id_fkey,
ADD CONSTRAINT students_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_parent_id_fkey,
ADD CONSTRAINT students_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Staff
ALTER TABLE staff 
DROP CONSTRAINT IF EXISTS staff_user_id_fkey,
ADD CONSTRAINT staff_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Parents
ALTER TABLE parents 
DROP CONSTRAINT IF EXISTS parents_user_id_fkey,
ADD CONSTRAINT parents_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Employees
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_user_id_fkey,
ADD CONSTRAINT employees_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Sports Coaches
ALTER TABLE sports_coaches 
DROP CONSTRAINT IF EXISTS sports_coaches_user_id_fkey,
ADD CONSTRAINT sports_coaches_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Parent Profiles
ALTER TABLE parent_profiles 
DROP CONSTRAINT IF EXISTS parent_profiles_user_id_fkey,
ADD CONSTRAINT parent_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- User Profiles
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Profiles
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- User MFA
ALTER TABLE user_mfa 
DROP CONSTRAINT IF EXISTS user_mfa_user_id_fkey,
ADD CONSTRAINT user_mfa_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- User Sessions
ALTER TABLE user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey,
ADD CONSTRAINT user_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- User Roles
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- User Role Assignments
ALTER TABLE user_role_assignments 
DROP CONSTRAINT IF EXISTS user_role_assignments_user_id_fkey,
ADD CONSTRAINT user_role_assignments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Notification Preferences
ALTER TABLE notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Dashboard Widgets
ALTER TABLE dashboard_widgets 
DROP CONSTRAINT IF EXISTS dashboard_widgets_user_id_fkey,
ADD CONSTRAINT dashboard_widgets_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- API Keys
ALTER TABLE api_keys 
DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey,
ADD CONSTRAINT api_keys_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Identity Documents
ALTER TABLE identity_documents 
DROP CONSTRAINT IF EXISTS identity_documents_user_id_fkey,
ADD CONSTRAINT identity_documents_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- AI Chat Sessions
ALTER TABLE ai_chat_sessions 
DROP CONSTRAINT IF EXISTS ai_chat_sessions_user_id_fkey,
ADD CONSTRAINT ai_chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- =====================================================
-- PHASE 4: Update activity/log tables (SET NULL)
-- (Keep records for audit, but remove user reference)
-- =====================================================

-- Audit Logs
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Activity Logs
ALTER TABLE activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey,
ADD CONSTRAINT activity_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Login History
ALTER TABLE login_history 
DROP CONSTRAINT IF EXISTS login_history_user_id_fkey,
ADD CONSTRAINT login_history_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Notification Logs
ALTER TABLE notification_logs 
DROP CONSTRAINT IF EXISTS notification_logs_user_id_fkey,
ADD CONSTRAINT notification_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Notifications
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- =====================================================
-- PHASE 5: Update operational tables (SET NULL)
-- (Keep records but remove user reference)
-- =====================================================

-- Attendance (marked_by)
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey,
ADD CONSTRAINT attendance_marked_by_fkey 
  FOREIGN KEY (marked_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Attendance Records
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_marked_by_fkey,
ADD CONSTRAINT attendance_records_marked_by_fkey 
  FOREIGN KEY (marked_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Payroll (approved_by)
ALTER TABLE payroll 
DROP CONSTRAINT IF EXISTS payroll_approved_by_fkey,
ADD CONSTRAINT payroll_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Payments (processed_by)
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_processed_by_fkey,
ADD CONSTRAINT payments_processed_by_fkey 
  FOREIGN KEY (processed_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Invoices (created_by)
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_created_by_fkey,
ADD CONSTRAINT invoices_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the changes:
--
-- SELECT 
--   conname, 
--   conrelid::regclass AS table_name,
--   confdeltype AS delete_action
-- FROM pg_constraint 
-- WHERE confrelid IN ('users'::regclass, 'teachers'::regclass)
--   AND contype = 'f'
-- ORDER BY table_name;
--
-- Delete actions:
-- 'a' = NO ACTION
-- 'r' = RESTRICT  
-- 'c' = CASCADE
-- 'n' = SET NULL
-- 'd' = SET DEFAULT
-- =====================================================
