-- ===========================================================
-- LERA Academy - Complete Roles & Permissions Setup
-- ===========================================================
-- Created: January 9, 2026
-- Purpose: Complete seed data for roles, permissions, and role-permission mappings
-- ===========================================================

-- Create user_permissions table if not exists
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    dashboard_access BOOLEAN DEFAULT TRUE,
    centers_access BOOLEAN DEFAULT FALSE,
    users_access BOOLEAN DEFAULT FALSE,
    students_access BOOLEAN DEFAULT FALSE,
    teachers_access BOOLEAN DEFAULT FALSE,
    classes_access BOOLEAN DEFAULT FALSE,
    courses_access BOOLEAN DEFAULT FALSE,
    attendance_access BOOLEAN DEFAULT FALSE,
    payments_access BOOLEAN DEFAULT FALSE,
    payroll_access BOOLEAN DEFAULT FALSE,
    reports_access BOOLEAN DEFAULT FALSE,
    settings_access BOOLEAN DEFAULT FALSE,
    ai_assistant_access BOOLEAN DEFAULT FALSE,
    communication_access BOOLEAN DEFAULT FALSE,
    documents_access BOOLEAN DEFAULT FALSE,
    academy_service_enabled BOOLEAN DEFAULT TRUE,
    payment_service_enabled BOOLEAN DEFAULT TRUE,
    attendance_service_enabled BOOLEAN DEFAULT TRUE,
    payroll_service_enabled BOOLEAN DEFAULT TRUE,
    connect_service_enabled BOOLEAN DEFAULT TRUE,
    ai_gateway_enabled BOOLEAN DEFAULT TRUE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- ===========================================================
-- SECTION 1: SYSTEM ROLES
-- ===========================================================

-- Delete existing roles and recreate for clean setup
DELETE FROM role_permissions;

-- Insert all system roles
INSERT INTO roles (id, name, display_name, display_name_vi, description, level, is_system_role) VALUES
    (uuid_generate_v4(), 'SUPER_ADMIN', 'Super Admin', 'Quản trị viên tối cao', 'Full system access with all permissions', 100, true),
    (uuid_generate_v4(), 'CHAIRMAN', 'Chairman', 'Chủ tịch', 'Organization chairman with full access', 95, true),
    (uuid_generate_v4(), 'CEO', 'CEO', 'Giám đốc điều hành', 'Chief Executive Officer', 90, true),
    (uuid_generate_v4(), 'DIRECTOR', 'Director', 'Giám đốc', 'Regional/Center director', 80, true),
    (uuid_generate_v4(), 'CENTER_ADMIN', 'Center Admin', 'Quản lý trung tâm', 'Center administrator', 70, true),
    (uuid_generate_v4(), 'ACADEMIC_MANAGER', 'Academic Manager', 'Quản lý học thuật', 'Academic affairs manager', 65, true),
    (uuid_generate_v4(), 'HR_MANAGER', 'HR Manager', 'Quản lý nhân sự', 'Human resources manager', 60, true),
    (uuid_generate_v4(), 'FINANCE_MANAGER', 'Finance Manager', 'Quản lý tài chính', 'Finance manager', 60, true),
    (uuid_generate_v4(), 'MARKETING_MANAGER', 'Marketing Manager', 'Quản lý marketing', 'Marketing manager', 55, true),
    (uuid_generate_v4(), 'TEACHER', 'Teacher', 'Giáo viên', 'Teaching staff', 40, true),
    (uuid_generate_v4(), 'TEACHING_ASSISTANT', 'Teaching Assistant', 'Trợ giảng', 'Teaching assistant', 35, true),
    (uuid_generate_v4(), 'RECEPTIONIST', 'Receptionist', 'Lễ tân', 'Front desk staff', 30, true),
    (uuid_generate_v4(), 'ACCOUNTANT', 'Accountant', 'Kế toán', 'Accounting staff', 30, true),
    (uuid_generate_v4(), 'SALES', 'Sales', 'Nhân viên kinh doanh', 'Sales staff', 30, true),
    (uuid_generate_v4(), 'STAFF', 'Staff', 'Nhân viên', 'General staff', 20, true),
    (uuid_generate_v4(), 'STUDENT', 'Student', 'Học sinh', 'Student account', 10, true),
    (uuid_generate_v4(), 'PARENT', 'Parent', 'Phụ huynh', 'Parent/Guardian account', 10, true),
    (uuid_generate_v4(), 'GUEST', 'Guest', 'Khách', 'Guest access', 0, true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    display_name_vi = EXCLUDED.display_name_vi,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    is_system_role = EXCLUDED.is_system_role;

-- ===========================================================
-- SECTION 2: SYSTEM PERMISSIONS
-- ===========================================================

-- Clear existing permissions and recreate
TRUNCATE permissions CASCADE;

-- Dashboard & Core
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'dashboard.view', 'View Dashboard', 'dashboard', 'Access to view dashboard'),
    (uuid_generate_v4(), 'dashboard.analytics', 'View Analytics', 'dashboard', 'Access to analytics data'),
    (uuid_generate_v4(), 'dashboard.reports', 'View Reports', 'dashboard', 'Access to dashboard reports');

-- User Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'users.view', 'View Users', 'users', 'View user list'),
    (uuid_generate_v4(), 'users.create', 'Create Users', 'users', 'Create new users'),
    (uuid_generate_v4(), 'users.edit', 'Edit Users', 'users', 'Edit user details'),
    (uuid_generate_v4(), 'users.delete', 'Delete Users', 'users', 'Delete users'),
    (uuid_generate_v4(), 'users.impersonate', 'Impersonate Users', 'users', 'Login as another user'),
    (uuid_generate_v4(), 'users.permissions', 'Manage User Permissions', 'users', 'Manage user-level permissions');

-- Role Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'roles.view', 'View Roles', 'roles', 'View role list'),
    (uuid_generate_v4(), 'roles.create', 'Create Roles', 'roles', 'Create new roles'),
    (uuid_generate_v4(), 'roles.edit', 'Edit Roles', 'roles', 'Edit role details'),
    (uuid_generate_v4(), 'roles.delete', 'Delete Roles', 'roles', 'Delete roles'),
    (uuid_generate_v4(), 'roles.permissions', 'Manage Role Permissions', 'roles', 'Assign permissions to roles');

-- Center Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'centers.view', 'View Centers', 'centers', 'View center list'),
    (uuid_generate_v4(), 'centers.create', 'Create Centers', 'centers', 'Create new centers'),
    (uuid_generate_v4(), 'centers.edit', 'Edit Centers', 'centers', 'Edit center details'),
    (uuid_generate_v4(), 'centers.delete', 'Delete Centers', 'centers', 'Delete centers'),
    (uuid_generate_v4(), 'centers.settings', 'Manage Center Settings', 'centers', 'Manage center configuration');

-- Student Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'students.view', 'View Students', 'students', 'View student list'),
    (uuid_generate_v4(), 'students.create', 'Create Students', 'students', 'Create new students'),
    (uuid_generate_v4(), 'students.edit', 'Edit Students', 'students', 'Edit student details'),
    (uuid_generate_v4(), 'students.delete', 'Delete Students', 'students', 'Delete students'),
    (uuid_generate_v4(), 'students.progress', 'View Student Progress', 'students', 'View student academic progress'),
    (uuid_generate_v4(), 'students.documents', 'Manage Student Documents', 'students', 'Upload/manage student documents');

-- Teacher Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'teachers.view', 'View Teachers', 'teachers', 'View teacher list'),
    (uuid_generate_v4(), 'teachers.create', 'Create Teachers', 'teachers', 'Create new teachers'),
    (uuid_generate_v4(), 'teachers.edit', 'Edit Teachers', 'teachers', 'Edit teacher details'),
    (uuid_generate_v4(), 'teachers.delete', 'Delete Teachers', 'teachers', 'Delete teachers'),
    (uuid_generate_v4(), 'teachers.schedule', 'Manage Teacher Schedule', 'teachers', 'Manage teacher schedules');

-- Course Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'courses.view', 'View Courses', 'courses', 'View course list'),
    (uuid_generate_v4(), 'courses.create', 'Create Courses', 'courses', 'Create new courses'),
    (uuid_generate_v4(), 'courses.edit', 'Edit Courses', 'courses', 'Edit course details'),
    (uuid_generate_v4(), 'courses.delete', 'Delete Courses', 'courses', 'Delete courses'),
    (uuid_generate_v4(), 'courses.curriculum', 'Manage Curriculum', 'courses', 'Manage course curriculum');

-- Class Management
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'classes.view', 'View Classes', 'classes', 'View class list'),
    (uuid_generate_v4(), 'classes.create', 'Create Classes', 'classes', 'Create new classes'),
    (uuid_generate_v4(), 'classes.edit', 'Edit Classes', 'classes', 'Edit class details'),
    (uuid_generate_v4(), 'classes.delete', 'Delete Classes', 'classes', 'Delete classes'),
    (uuid_generate_v4(), 'classes.schedule', 'Manage Class Schedule', 'classes', 'Manage class schedules'),
    (uuid_generate_v4(), 'classes.enrollment', 'Manage Enrollment', 'classes', 'Manage student enrollment');

-- Attendance
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'attendance.view', 'View Attendance', 'attendance', 'View attendance records'),
    (uuid_generate_v4(), 'attendance.mark', 'Mark Attendance', 'attendance', 'Mark student attendance'),
    (uuid_generate_v4(), 'attendance.edit', 'Edit Attendance', 'attendance', 'Edit attendance records'),
    (uuid_generate_v4(), 'attendance.reports', 'Attendance Reports', 'attendance', 'View attendance reports');

-- Exams & Assessments
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'exams.view', 'View Exams', 'exams', 'View exam list'),
    (uuid_generate_v4(), 'exams.create', 'Create Exams', 'exams', 'Create new exams'),
    (uuid_generate_v4(), 'exams.edit', 'Edit Exams', 'exams', 'Edit exam details'),
    (uuid_generate_v4(), 'exams.grade', 'Grade Exams', 'exams', 'Grade student exams'),
    (uuid_generate_v4(), 'exams.results', 'View Exam Results', 'exams', 'View exam results');

-- Assignments
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'assignments.view', 'View Assignments', 'assignments', 'View assignment list'),
    (uuid_generate_v4(), 'assignments.create', 'Create Assignments', 'assignments', 'Create new assignments'),
    (uuid_generate_v4(), 'assignments.edit', 'Edit Assignments', 'assignments', 'Edit assignment details'),
    (uuid_generate_v4(), 'assignments.grade', 'Grade Assignments', 'assignments', 'Grade student assignments');

-- Payments & Finance
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'payments.view', 'View Payments', 'payments', 'View payment records'),
    (uuid_generate_v4(), 'payments.create', 'Create Payments', 'payments', 'Record new payments'),
    (uuid_generate_v4(), 'payments.refund', 'Process Refunds', 'payments', 'Process payment refunds'),
    (uuid_generate_v4(), 'invoices.view', 'View Invoices', 'payments', 'View invoices'),
    (uuid_generate_v4(), 'invoices.create', 'Create Invoices', 'payments', 'Create new invoices'),
    (uuid_generate_v4(), 'invoices.edit', 'Edit Invoices', 'payments', 'Edit invoices'),
    (uuid_generate_v4(), 'discounts.manage', 'Manage Discounts', 'payments', 'Manage discount codes');

-- Payroll
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'payroll.view', 'View Payroll', 'payroll', 'View payroll data'),
    (uuid_generate_v4(), 'payroll.process', 'Process Payroll', 'payroll', 'Process payroll cycles'),
    (uuid_generate_v4(), 'payroll.approve', 'Approve Payroll', 'payroll', 'Approve payroll payments'),
    (uuid_generate_v4(), 'salary.view', 'View Salaries', 'payroll', 'View salary information'),
    (uuid_generate_v4(), 'salary.manage', 'Manage Salaries', 'payroll', 'Manage salary configuration');

-- CRM / Leads
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'leads.view', 'View Leads', 'crm', 'View lead list'),
    (uuid_generate_v4(), 'leads.create', 'Create Leads', 'crm', 'Create new leads'),
    (uuid_generate_v4(), 'leads.edit', 'Edit Leads', 'crm', 'Edit lead details'),
    (uuid_generate_v4(), 'leads.delete', 'Delete Leads', 'crm', 'Delete leads'),
    (uuid_generate_v4(), 'leads.assign', 'Assign Leads', 'crm', 'Assign leads to staff'),
    (uuid_generate_v4(), 'leads.convert', 'Convert Leads', 'crm', 'Convert leads to students'),
    (uuid_generate_v4(), 'followups.manage', 'Manage Followups', 'crm', 'Manage lead followups');

-- Marketing
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'marketing.view', 'View Marketing', 'marketing', 'View marketing dashboard'),
    (uuid_generate_v4(), 'marketing.manage', 'Manage Marketing', 'marketing', 'Full marketing access'),
    (uuid_generate_v4(), 'campaigns.view', 'View Campaigns', 'marketing', 'View marketing campaigns'),
    (uuid_generate_v4(), 'campaigns.create', 'Create Campaigns', 'marketing', 'Create marketing campaigns'),
    (uuid_generate_v4(), 'campaigns.edit', 'Edit Campaigns', 'marketing', 'Edit marketing campaigns'),
    (uuid_generate_v4(), 'social_media.view', 'View Social Media', 'marketing', 'View social media'),
    (uuid_generate_v4(), 'social_media.manage', 'Manage Social Media', 'marketing', 'Manage social media'),
    (uuid_generate_v4(), 'social_media.publish', 'Publish to Social', 'marketing', 'Publish to social media');

-- CMS / Website
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'website.view', 'View Website Content', 'cms', 'View public website content'),
    (uuid_generate_v4(), 'website.edit', 'Edit Website Content', 'cms', 'Edit public website pages'),
    (uuid_generate_v4(), 'pages.create', 'Create Pages', 'cms', 'Create new website pages'),
    (uuid_generate_v4(), 'pages.delete', 'Delete Pages', 'cms', 'Delete website pages'),
    (uuid_generate_v4(), 'media.upload', 'Upload Media', 'cms', 'Upload images and files'),
    (uuid_generate_v4(), 'media.delete', 'Delete Media', 'cms', 'Delete uploaded media'),
    (uuid_generate_v4(), 'seo.manage', 'Manage SEO', 'cms', 'Manage SEO settings');

-- Communication
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'messages.view', 'View Messages', 'communication', 'View messages'),
    (uuid_generate_v4(), 'messages.send', 'Send Messages', 'communication', 'Send messages'),
    (uuid_generate_v4(), 'notifications.send', 'Send Notifications', 'communication', 'Send notifications'),
    (uuid_generate_v4(), 'announcements.create', 'Create Announcements', 'communication', 'Create announcements');

-- Reports & Analytics
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'reports.view', 'View Reports', 'reports', 'View all reports'),
    (uuid_generate_v4(), 'reports.financial', 'Financial Reports', 'reports', 'View financial reports'),
    (uuid_generate_v4(), 'reports.academic', 'Academic Reports', 'reports', 'View academic reports'),
    (uuid_generate_v4(), 'reports.export', 'Export Reports', 'reports', 'Export report data'),
    (uuid_generate_v4(), 'analytics.view', 'View Analytics', 'reports', 'View analytics dashboard');

-- AI Features
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'ai.use', 'Use AI Assistant', 'ai', 'Access AI-powered features'),
    (uuid_generate_v4(), 'ai.tutor', 'AI Tutor Access', 'ai', 'Access AI tutoring'),
    (uuid_generate_v4(), 'ai.content', 'AI Content Generation', 'ai', 'Use AI content generation'),
    (uuid_generate_v4(), 'ai.configure', 'Configure AI', 'ai', 'Configure AI settings');

-- System Settings
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'settings.view', 'View Settings', 'settings', 'View system settings'),
    (uuid_generate_v4(), 'settings.manage', 'Manage Settings', 'settings', 'Edit system settings'),
    (uuid_generate_v4(), 'settings.features', 'Manage Features', 'settings', 'Enable/disable features'),
    (uuid_generate_v4(), 'settings.integrations', 'Manage Integrations', 'settings', 'Manage third-party integrations');

-- Audit & Logs
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'audit.view', 'View Audit Logs', 'audit', 'View audit logs'),
    (uuid_generate_v4(), 'audit.export', 'Export Audit Logs', 'audit', 'Export audit log data'),
    (uuid_generate_v4(), 'activity.view', 'View Activity Logs', 'audit', 'View user activity');

-- Sports
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'sports.view', 'View Sports', 'sports', 'View sports programs'),
    (uuid_generate_v4(), 'sports.manage', 'Manage Sports', 'sports', 'Manage sports programs'),
    (uuid_generate_v4(), 'teams.manage', 'Manage Teams', 'sports', 'Manage sports teams'),
    (uuid_generate_v4(), 'matches.manage', 'Manage Matches', 'sports', 'Manage sports matches');

-- Library
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'library.view', 'View Library', 'library', 'View library catalog'),
    (uuid_generate_v4(), 'library.manage', 'Manage Library', 'library', 'Manage library books'),
    (uuid_generate_v4(), 'library.borrow', 'Borrow Books', 'library', 'Borrow library books');

-- Transport
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'transport.view', 'View Transport', 'transport', 'View transport routes'),
    (uuid_generate_v4(), 'transport.manage', 'Manage Transport', 'transport', 'Manage transport');

-- ===========================================================
-- SECTION 3: ROLE PERMISSION MAPPINGS
-- ===========================================================

-- Helper function to assign permissions
CREATE OR REPLACE FUNCTION assign_permission(role_name_param VARCHAR, permission_code_param VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = role_name_param;
    SELECT id INTO v_perm_id FROM permissions WHERE code = permission_code_param;
    
    IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
        INSERT INTO role_permissions (id, role_id, permission_id, permission_code)
        VALUES (uuid_generate_v4(), v_role_id, v_perm_id, permission_code_param)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- SUPER_ADMIN & CHAIRMAN get ALL permissions
DO $$
DECLARE
    v_perm RECORD;
BEGIN
    FOR v_perm IN SELECT code FROM permissions
    LOOP
        PERFORM assign_permission('SUPER_ADMIN', v_perm.code);
        PERFORM assign_permission('CHAIRMAN', v_perm.code);
        PERFORM assign_permission('CEO', v_perm.code);
    END LOOP;
END $$;

-- DIRECTOR permissions
SELECT assign_permission('DIRECTOR', 'dashboard.view');
SELECT assign_permission('DIRECTOR', 'dashboard.analytics');
SELECT assign_permission('DIRECTOR', 'dashboard.reports');
SELECT assign_permission('DIRECTOR', 'users.view');
SELECT assign_permission('DIRECTOR', 'users.create');
SELECT assign_permission('DIRECTOR', 'users.edit');
SELECT assign_permission('DIRECTOR', 'roles.view');
SELECT assign_permission('DIRECTOR', 'centers.view');
SELECT assign_permission('DIRECTOR', 'centers.edit');
SELECT assign_permission('DIRECTOR', 'students.view');
SELECT assign_permission('DIRECTOR', 'students.create');
SELECT assign_permission('DIRECTOR', 'students.edit');
SELECT assign_permission('DIRECTOR', 'students.progress');
SELECT assign_permission('DIRECTOR', 'teachers.view');
SELECT assign_permission('DIRECTOR', 'teachers.create');
SELECT assign_permission('DIRECTOR', 'teachers.edit');
SELECT assign_permission('DIRECTOR', 'teachers.schedule');
SELECT assign_permission('DIRECTOR', 'courses.view');
SELECT assign_permission('DIRECTOR', 'courses.create');
SELECT assign_permission('DIRECTOR', 'courses.edit');
SELECT assign_permission('DIRECTOR', 'classes.view');
SELECT assign_permission('DIRECTOR', 'classes.create');
SELECT assign_permission('DIRECTOR', 'classes.edit');
SELECT assign_permission('DIRECTOR', 'classes.schedule');
SELECT assign_permission('DIRECTOR', 'classes.enrollment');
SELECT assign_permission('DIRECTOR', 'attendance.view');
SELECT assign_permission('DIRECTOR', 'attendance.reports');
SELECT assign_permission('DIRECTOR', 'exams.view');
SELECT assign_permission('DIRECTOR', 'exams.results');
SELECT assign_permission('DIRECTOR', 'payments.view');
SELECT assign_permission('DIRECTOR', 'invoices.view');
SELECT assign_permission('DIRECTOR', 'payroll.view');
SELECT assign_permission('DIRECTOR', 'leads.view');
SELECT assign_permission('DIRECTOR', 'leads.assign');
SELECT assign_permission('DIRECTOR', 'marketing.view');
SELECT assign_permission('DIRECTOR', 'campaigns.view');
SELECT assign_permission('DIRECTOR', 'reports.view');
SELECT assign_permission('DIRECTOR', 'reports.financial');
SELECT assign_permission('DIRECTOR', 'reports.academic');
SELECT assign_permission('DIRECTOR', 'reports.export');
SELECT assign_permission('DIRECTOR', 'analytics.view');
SELECT assign_permission('DIRECTOR', 'messages.view');
SELECT assign_permission('DIRECTOR', 'messages.send');
SELECT assign_permission('DIRECTOR', 'announcements.create');
SELECT assign_permission('DIRECTOR', 'ai.use');

-- CENTER_ADMIN permissions
SELECT assign_permission('CENTER_ADMIN', 'dashboard.view');
SELECT assign_permission('CENTER_ADMIN', 'dashboard.analytics');
SELECT assign_permission('CENTER_ADMIN', 'users.view');
SELECT assign_permission('CENTER_ADMIN', 'users.create');
SELECT assign_permission('CENTER_ADMIN', 'users.edit');
SELECT assign_permission('CENTER_ADMIN', 'students.view');
SELECT assign_permission('CENTER_ADMIN', 'students.create');
SELECT assign_permission('CENTER_ADMIN', 'students.edit');
SELECT assign_permission('CENTER_ADMIN', 'students.delete');
SELECT assign_permission('CENTER_ADMIN', 'students.progress');
SELECT assign_permission('CENTER_ADMIN', 'students.documents');
SELECT assign_permission('CENTER_ADMIN', 'teachers.view');
SELECT assign_permission('CENTER_ADMIN', 'teachers.create');
SELECT assign_permission('CENTER_ADMIN', 'teachers.edit');
SELECT assign_permission('CENTER_ADMIN', 'teachers.schedule');
SELECT assign_permission('CENTER_ADMIN', 'courses.view');
SELECT assign_permission('CENTER_ADMIN', 'courses.create');
SELECT assign_permission('CENTER_ADMIN', 'courses.edit');
SELECT assign_permission('CENTER_ADMIN', 'classes.view');
SELECT assign_permission('CENTER_ADMIN', 'classes.create');
SELECT assign_permission('CENTER_ADMIN', 'classes.edit');
SELECT assign_permission('CENTER_ADMIN', 'classes.delete');
SELECT assign_permission('CENTER_ADMIN', 'classes.schedule');
SELECT assign_permission('CENTER_ADMIN', 'classes.enrollment');
SELECT assign_permission('CENTER_ADMIN', 'attendance.view');
SELECT assign_permission('CENTER_ADMIN', 'attendance.mark');
SELECT assign_permission('CENTER_ADMIN', 'attendance.edit');
SELECT assign_permission('CENTER_ADMIN', 'attendance.reports');
SELECT assign_permission('CENTER_ADMIN', 'exams.view');
SELECT assign_permission('CENTER_ADMIN', 'exams.create');
SELECT assign_permission('CENTER_ADMIN', 'exams.edit');
SELECT assign_permission('CENTER_ADMIN', 'exams.grade');
SELECT assign_permission('CENTER_ADMIN', 'exams.results');
SELECT assign_permission('CENTER_ADMIN', 'assignments.view');
SELECT assign_permission('CENTER_ADMIN', 'assignments.create');
SELECT assign_permission('CENTER_ADMIN', 'assignments.edit');
SELECT assign_permission('CENTER_ADMIN', 'payments.view');
SELECT assign_permission('CENTER_ADMIN', 'payments.create');
SELECT assign_permission('CENTER_ADMIN', 'invoices.view');
SELECT assign_permission('CENTER_ADMIN', 'invoices.create');
SELECT assign_permission('CENTER_ADMIN', 'leads.view');
SELECT assign_permission('CENTER_ADMIN', 'leads.create');
SELECT assign_permission('CENTER_ADMIN', 'leads.edit');
SELECT assign_permission('CENTER_ADMIN', 'followups.manage');
SELECT assign_permission('CENTER_ADMIN', 'messages.view');
SELECT assign_permission('CENTER_ADMIN', 'messages.send');
SELECT assign_permission('CENTER_ADMIN', 'notifications.send');
SELECT assign_permission('CENTER_ADMIN', 'reports.view');
SELECT assign_permission('CENTER_ADMIN', 'reports.academic');
SELECT assign_permission('CENTER_ADMIN', 'ai.use');
SELECT assign_permission('CENTER_ADMIN', 'library.view');
SELECT assign_permission('CENTER_ADMIN', 'library.manage');

-- TEACHER permissions
SELECT assign_permission('TEACHER', 'dashboard.view');
SELECT assign_permission('TEACHER', 'students.view');
SELECT assign_permission('TEACHER', 'students.progress');
SELECT assign_permission('TEACHER', 'classes.view');
SELECT assign_permission('TEACHER', 'attendance.view');
SELECT assign_permission('TEACHER', 'attendance.mark');
SELECT assign_permission('TEACHER', 'exams.view');
SELECT assign_permission('TEACHER', 'exams.create');
SELECT assign_permission('TEACHER', 'exams.grade');
SELECT assign_permission('TEACHER', 'exams.results');
SELECT assign_permission('TEACHER', 'assignments.view');
SELECT assign_permission('TEACHER', 'assignments.create');
SELECT assign_permission('TEACHER', 'assignments.edit');
SELECT assign_permission('TEACHER', 'assignments.grade');
SELECT assign_permission('TEACHER', 'messages.view');
SELECT assign_permission('TEACHER', 'messages.send');
SELECT assign_permission('TEACHER', 'ai.use');
SELECT assign_permission('TEACHER', 'ai.tutor');
SELECT assign_permission('TEACHER', 'ai.content');
SELECT assign_permission('TEACHER', 'library.view');
SELECT assign_permission('TEACHER', 'library.borrow');

-- STUDENT permissions
SELECT assign_permission('STUDENT', 'dashboard.view');
SELECT assign_permission('STUDENT', 'attendance.view');
SELECT assign_permission('STUDENT', 'exams.results');
SELECT assign_permission('STUDENT', 'assignments.view');
SELECT assign_permission('STUDENT', 'messages.view');
SELECT assign_permission('STUDENT', 'messages.send');
SELECT assign_permission('STUDENT', 'ai.use');
SELECT assign_permission('STUDENT', 'ai.tutor');
SELECT assign_permission('STUDENT', 'library.view');
SELECT assign_permission('STUDENT', 'library.borrow');

-- PARENT permissions
SELECT assign_permission('PARENT', 'dashboard.view');
SELECT assign_permission('PARENT', 'attendance.view');
SELECT assign_permission('PARENT', 'exams.results');
SELECT assign_permission('PARENT', 'payments.view');
SELECT assign_permission('PARENT', 'invoices.view');
SELECT assign_permission('PARENT', 'messages.view');
SELECT assign_permission('PARENT', 'messages.send');

-- SALES permissions
SELECT assign_permission('SALES', 'dashboard.view');
SELECT assign_permission('SALES', 'leads.view');
SELECT assign_permission('SALES', 'leads.create');
SELECT assign_permission('SALES', 'leads.edit');
SELECT assign_permission('SALES', 'leads.convert');
SELECT assign_permission('SALES', 'followups.manage');
SELECT assign_permission('SALES', 'students.view');
SELECT assign_permission('SALES', 'students.create');
SELECT assign_permission('SALES', 'courses.view');
SELECT assign_permission('SALES', 'classes.view');
SELECT assign_permission('SALES', 'payments.view');
SELECT assign_permission('SALES', 'payments.create');
SELECT assign_permission('SALES', 'invoices.view');
SELECT assign_permission('SALES', 'invoices.create');
SELECT assign_permission('SALES', 'messages.view');
SELECT assign_permission('SALES', 'messages.send');

-- ACCOUNTANT permissions
SELECT assign_permission('ACCOUNTANT', 'dashboard.view');
SELECT assign_permission('ACCOUNTANT', 'payments.view');
SELECT assign_permission('ACCOUNTANT', 'payments.create');
SELECT assign_permission('ACCOUNTANT', 'payments.refund');
SELECT assign_permission('ACCOUNTANT', 'invoices.view');
SELECT assign_permission('ACCOUNTANT', 'invoices.create');
SELECT assign_permission('ACCOUNTANT', 'invoices.edit');
SELECT assign_permission('ACCOUNTANT', 'discounts.manage');
SELECT assign_permission('ACCOUNTANT', 'reports.view');
SELECT assign_permission('ACCOUNTANT', 'reports.financial');
SELECT assign_permission('ACCOUNTANT', 'reports.export');

-- RECEPTIONIST permissions
SELECT assign_permission('RECEPTIONIST', 'dashboard.view');
SELECT assign_permission('RECEPTIONIST', 'students.view');
SELECT assign_permission('RECEPTIONIST', 'students.create');
SELECT assign_permission('RECEPTIONIST', 'leads.view');
SELECT assign_permission('RECEPTIONIST', 'leads.create');
SELECT assign_permission('RECEPTIONIST', 'leads.edit');
SELECT assign_permission('RECEPTIONIST', 'followups.manage');
SELECT assign_permission('RECEPTIONIST', 'classes.view');
SELECT assign_permission('RECEPTIONIST', 'attendance.view');
SELECT assign_permission('RECEPTIONIST', 'messages.view');
SELECT assign_permission('RECEPTIONIST', 'messages.send');

-- MARKETING_MANAGER permissions
SELECT assign_permission('MARKETING_MANAGER', 'dashboard.view');
SELECT assign_permission('MARKETING_MANAGER', 'marketing.view');
SELECT assign_permission('MARKETING_MANAGER', 'marketing.manage');
SELECT assign_permission('MARKETING_MANAGER', 'campaigns.view');
SELECT assign_permission('MARKETING_MANAGER', 'campaigns.create');
SELECT assign_permission('MARKETING_MANAGER', 'campaigns.edit');
SELECT assign_permission('MARKETING_MANAGER', 'social_media.view');
SELECT assign_permission('MARKETING_MANAGER', 'social_media.manage');
SELECT assign_permission('MARKETING_MANAGER', 'social_media.publish');
SELECT assign_permission('MARKETING_MANAGER', 'website.view');
SELECT assign_permission('MARKETING_MANAGER', 'website.edit');
SELECT assign_permission('MARKETING_MANAGER', 'pages.create');
SELECT assign_permission('MARKETING_MANAGER', 'media.upload');
SELECT assign_permission('MARKETING_MANAGER', 'media.delete');
SELECT assign_permission('MARKETING_MANAGER', 'seo.manage');
SELECT assign_permission('MARKETING_MANAGER', 'leads.view');
SELECT assign_permission('MARKETING_MANAGER', 'analytics.view');
SELECT assign_permission('MARKETING_MANAGER', 'reports.view');
SELECT assign_permission('MARKETING_MANAGER', 'ai.use');
SELECT assign_permission('MARKETING_MANAGER', 'ai.content');

-- HR_MANAGER permissions
SELECT assign_permission('HR_MANAGER', 'dashboard.view');
SELECT assign_permission('HR_MANAGER', 'users.view');
SELECT assign_permission('HR_MANAGER', 'users.create');
SELECT assign_permission('HR_MANAGER', 'users.edit');
SELECT assign_permission('HR_MANAGER', 'teachers.view');
SELECT assign_permission('HR_MANAGER', 'teachers.create');
SELECT assign_permission('HR_MANAGER', 'teachers.edit');
SELECT assign_permission('HR_MANAGER', 'payroll.view');
SELECT assign_permission('HR_MANAGER', 'payroll.process');
SELECT assign_permission('HR_MANAGER', 'salary.view');
SELECT assign_permission('HR_MANAGER', 'salary.manage');
SELECT assign_permission('HR_MANAGER', 'attendance.view');
SELECT assign_permission('HR_MANAGER', 'attendance.reports');
SELECT assign_permission('HR_MANAGER', 'reports.view');
SELECT assign_permission('HR_MANAGER', 'messages.view');
SELECT assign_permission('HR_MANAGER', 'messages.send');

-- FINANCE_MANAGER permissions
SELECT assign_permission('FINANCE_MANAGER', 'dashboard.view');
SELECT assign_permission('FINANCE_MANAGER', 'dashboard.analytics');
SELECT assign_permission('FINANCE_MANAGER', 'payments.view');
SELECT assign_permission('FINANCE_MANAGER', 'payments.create');
SELECT assign_permission('FINANCE_MANAGER', 'payments.refund');
SELECT assign_permission('FINANCE_MANAGER', 'invoices.view');
SELECT assign_permission('FINANCE_MANAGER', 'invoices.create');
SELECT assign_permission('FINANCE_MANAGER', 'invoices.edit');
SELECT assign_permission('FINANCE_MANAGER', 'discounts.manage');
SELECT assign_permission('FINANCE_MANAGER', 'payroll.view');
SELECT assign_permission('FINANCE_MANAGER', 'payroll.process');
SELECT assign_permission('FINANCE_MANAGER', 'payroll.approve');
SELECT assign_permission('FINANCE_MANAGER', 'salary.view');
SELECT assign_permission('FINANCE_MANAGER', 'salary.manage');
SELECT assign_permission('FINANCE_MANAGER', 'reports.view');
SELECT assign_permission('FINANCE_MANAGER', 'reports.financial');
SELECT assign_permission('FINANCE_MANAGER', 'reports.export');
SELECT assign_permission('FINANCE_MANAGER', 'analytics.view');

-- Clean up helper function
DROP FUNCTION IF EXISTS assign_permission(VARCHAR, VARCHAR);

-- ===========================================================
-- ✅ Migration Complete
-- ===========================================================
