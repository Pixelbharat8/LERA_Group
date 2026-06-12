-- =====================================================
-- LERA Identity Service - Seed Data
-- =====================================================
-- PERMANENT FIX: All columns match entity definitions exactly
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- TENANTS (Multi-tenancy support)
-- Entity: id, code, name, domain, subdomain, status, subscription_plan, max_centers, max_users, created_at, updated_at
-- =====================================================
INSERT INTO tenants (id, code, name, domain, subdomain, status, subscription_plan, max_centers, max_users, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'LERA', 'LERA Sports Academy', 'lera.edu.vn', 'lera', 'ACTIVE', 'ENTERPRISE', 10, 1000, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- =====================================================
-- ROLES (System roles with hierarchy levels)
-- Entity: id, name, display_name, display_name_vi, description, level, is_system_role, created_at
-- =====================================================
INSERT INTO roles (id, name, display_name, display_name_vi, description, level, is_system_role, created_at)
VALUES 
    ('00000000-0000-0000-0000-000000000003', 'CHAIRMAN', 'Chairman', 'Chủ tịch', 'GOD OF GODS - Supreme authority over entire system', 200, true, NOW()),
    ('00000000-0000-0000-0000-000000000002', 'CEO', 'Chief Executive Officer', 'Tổng Giám đốc', 'Executive level access', 90, true, NOW()),
    ('00000000-0000-0000-0000-000000000004', 'DIRECTOR', 'Director', 'Giám đốc', 'Regional/divisional management', 80, true, NOW()),
    ('00000000-0000-0000-0000-000000000005', 'CENTER_MANAGER', 'Center Manager', 'Quản lý trung tâm', 'Full center management', 70, true, NOW()),
    ('00000000-0000-0000-0000-000000000007', 'ACADEMIC_MANAGER', 'Academic Manager', 'Quản lý học vụ', 'Academic operations management', 65, true, NOW()),
    ('00000000-0000-0000-0000-000000000006', 'CENTER_ADMIN', 'Center Admin', 'Quản trị trung tâm', 'Center administrative access', 60, true, NOW()),
    ('00000000-0000-0000-0000-000000000008', 'TEACHER', 'Teacher', 'Giáo viên', 'Teaching staff', 40, true, NOW()),
    ('00000000-0000-0000-0000-000000000009', 'TA', 'Teaching Assistant', 'Trợ giảng', 'Teaching assistant', 35, true, NOW()),
    ('00000000-0000-0000-0000-000000000010', 'STAFF', 'Staff', 'Nhân viên', 'General staff', 30, true, NOW()),
    ('00000000-0000-0000-0000-000000000011', 'PARENT', 'Parent', 'Phụ huynh', 'Parent portal access', 20, true, NOW()),
    ('00000000-0000-0000-0000-000000000012', 'STUDENT', 'Student', 'Học sinh', 'Student portal access', 10, true, NOW())
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    display_name_vi = EXCLUDED.display_name_vi,
    level = EXCLUDED.level;

-- =====================================================
-- PERMISSIONS (System permissions by module)
-- Entity: id, code, name, module, description, created_at
-- =====================================================
INSERT INTO permissions (id, code, name, module, description, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'users.view', 'View Users', 'USER_MANAGEMENT', 'View user list and details', NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'users.create', 'Create Users', 'USER_MANAGEMENT', 'Create new users', NOW()),
    ('a0000000-0000-0000-0000-000000000003', 'users.edit', 'Edit Users', 'USER_MANAGEMENT', 'Edit user information', NOW()),
    ('a0000000-0000-0000-0000-000000000004', 'users.delete', 'Delete Users', 'USER_MANAGEMENT', 'Delete users', NOW()),
    ('a0000000-0000-0000-0000-000000000011', 'students.view', 'View Students', 'STUDENT_MANAGEMENT', 'View student list and details', NOW()),
    ('a0000000-0000-0000-0000-000000000012', 'students.create', 'Create Students', 'STUDENT_MANAGEMENT', 'Enroll new students', NOW()),
    ('a0000000-0000-0000-0000-000000000013', 'students.edit', 'Edit Students', 'STUDENT_MANAGEMENT', 'Edit student information', NOW()),
    ('a0000000-0000-0000-0000-000000000014', 'students.delete', 'Delete Students', 'STUDENT_MANAGEMENT', 'Remove students', NOW()),
    ('a0000000-0000-0000-0000-000000000021', 'teachers.view', 'View Teachers', 'TEACHER_MANAGEMENT', 'View teacher list and details', NOW()),
    ('a0000000-0000-0000-0000-000000000022', 'teachers.create', 'Create Teachers', 'TEACHER_MANAGEMENT', 'Add new teachers', NOW()),
    ('a0000000-0000-0000-0000-000000000023', 'teachers.edit', 'Edit Teachers', 'TEACHER_MANAGEMENT', 'Edit teacher information', NOW()),
    ('a0000000-0000-0000-0000-000000000024', 'teachers.delete', 'Delete Teachers', 'TEACHER_MANAGEMENT', 'Remove teachers', NOW()),
    ('a0000000-0000-0000-0000-000000000031', 'classes.view', 'View Classes', 'CLASS_MANAGEMENT', 'View class list and schedules', NOW()),
    ('a0000000-0000-0000-0000-000000000032', 'classes.create', 'Create Classes', 'CLASS_MANAGEMENT', 'Create new classes', NOW()),
    ('a0000000-0000-0000-0000-000000000033', 'classes.edit', 'Edit Classes', 'CLASS_MANAGEMENT', 'Edit class details', NOW()),
    ('a0000000-0000-0000-0000-000000000034', 'classes.delete', 'Delete Classes', 'CLASS_MANAGEMENT', 'Delete classes', NOW()),
    ('a0000000-0000-0000-0000-000000000041', 'attendance.view', 'View Attendance', 'ATTENDANCE', 'View attendance records', NOW()),
    ('a0000000-0000-0000-0000-000000000042', 'attendance.mark', 'Mark Attendance', 'ATTENDANCE', 'Mark student attendance', NOW()),
    ('a0000000-0000-0000-0000-000000000043', 'attendance.edit', 'Edit Attendance', 'ATTENDANCE', 'Edit attendance records', NOW()),
    ('a0000000-0000-0000-0000-000000000051', 'finance.view', 'View Finance', 'FINANCE', 'View financial records', NOW()),
    ('a0000000-0000-0000-0000-000000000052', 'finance.create', 'Create Invoices', 'FINANCE', 'Create invoices and payments', NOW()),
    ('a0000000-0000-0000-0000-000000000053', 'finance.approve', 'Approve Finance', 'FINANCE', 'Approve financial transactions', NOW()),
    ('a0000000-0000-0000-0000-000000000061', 'reports.view', 'View Reports', 'REPORTS', 'View system reports', NOW()),
    ('a0000000-0000-0000-0000-000000000062', 'reports.export', 'Export Reports', 'REPORTS', 'Export reports to files', NOW()),
    ('a0000000-0000-0000-0000-000000000071', 'settings.view', 'View Settings', 'SETTINGS', 'View system settings', NOW()),
    ('a0000000-0000-0000-0000-000000000072', 'settings.edit', 'Edit Settings', 'SETTINGS', 'Modify system settings', NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module;

-- =====================================================
-- CENTERS (Training locations)
-- Entity: id, code, name, name_vi, address, address_vi, city, district, phone, email, status, capacity, created_at, updated_at
-- =====================================================
INSERT INTO centers (id, code, name, name_vi, address, address_vi, city, district, phone, email, status, capacity, created_at, updated_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'HQ', 'LERA Headquarters', 'Trụ sở chính LERA', '123 Nguyen Hue Street, District 1', '123 Đường Nguyễn Huệ, Quận 1', 'Ho Chi Minh City', 'District 1', '+84 28 1234 5678', 'hq@lera.edu.vn', 'ACTIVE', 500, NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'D7', 'LERA District 7 Center', 'Trung tâm LERA Quận 7', '456 Nguyen Van Linh, District 7', '456 Nguyễn Văn Linh, Quận 7', 'Ho Chi Minh City', 'District 7', '+84 28 2345 6789', 'd7@lera.edu.vn', 'ACTIVE', 300, NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000003', 'TD', 'LERA Thu Duc Center', 'Trung tâm LERA Thủ Đức', '789 Vo Van Ngan, Thu Duc', '789 Võ Văn Ngân, Thủ Đức', 'Ho Chi Minh City', 'Thu Duc', '+84 28 3456 7890', 'td@lera.edu.vn', 'ACTIVE', 400, NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000004', 'HN', 'LERA Hanoi Center', 'Trung tâm LERA Hà Nội', '100 Ba Trieu Street, Hoan Kiem', '100 Phố Bà Triệu, Hoàn Kiếm', 'Hanoi', 'Hoan Kiem', '+84 24 1234 5678', 'hn@lera.edu.vn', 'ACTIVE', 350, NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000005', 'DN', 'LERA Da Nang Center', 'Trung tâm LERA Đà Nẵng', '50 Tran Phu Street', '50 Đường Trần Phú', 'Da Nang', 'Hai Chau', '+84 236 1234 567', 'dn@lera.edu.vn', 'ACTIVE', 250, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_vi = EXCLUDED.name_vi,
    updated_at = NOW();

-- =====================================================
-- DEPARTMENTS (Organizational structure)
-- Entity: id, department_code, department_name, department_name_vi, department_type, office_type, status, created_at, updated_at
-- =====================================================
INSERT INTO departments (id, department_code, department_name, department_name_vi, department_type, office_type, status, created_at, updated_at)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'EXEC', 'Executive Office', 'Văn phòng điều hành', 'ADMINISTRATIVE', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000002', 'ACAD', 'Academic Department', 'Phòng học vụ', 'ACADEMIC', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000003', 'FIN', 'Finance Department', 'Phòng tài chính', 'FINANCE', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000004', 'HR', 'Human Resources', 'Phòng nhân sự', 'HR', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000005', 'MKT', 'Marketing Department', 'Phòng marketing', 'MARKETING', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000006', 'IT', 'IT Department', 'Phòng công nghệ', 'IT', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000007', 'OPS', 'Operations', 'Phòng vận hành', 'OPERATIONS', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000008', 'STU', 'Student Services', 'Dịch vụ học sinh', 'STUDENT_SERVICES', 'MAIN_OFFICE', 'ACTIVE', NOW(), NOW())
ON CONFLICT (department_code) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    department_name_vi = EXCLUDED.department_name_vi,
    updated_at = NOW();

-- =====================================================
-- USERS (Sample users for different roles)
-- Entity: id, email, password_hash, fullname, fullname_vi, phone, role_id, center_id, department_id, job_title, employment_type, org_level, status, email_verified, created_at, updated_at
-- Password hash for 'admin123': $2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu
-- Password hash for 'password123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6
-- =====================================================
INSERT INTO users (id, email, password_hash, fullname, fullname_vi, phone, role_id, center_id, department_id, job_title, employment_type, org_level, status, email_verified, created_at, updated_at)
VALUES 
    -- CHAIRMAN (Chairman@Leraacademy.edu.vn / admin123)
    ('e0000000-0000-0000-0000-000000000001', 'Chairman@Leraacademy.edu.vn', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu', 'Rahul Sharma', 'Rahul Sharma', '+84 900 000 001', '00000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Chairman', 'FULL_TIME', 200, 'ACTIVE', true, NOW(), NOW()),
    
    -- CEO (CEO@Leraacademy.edu.vn / admin123)
    ('e0000000-0000-0000-0000-000000000002', 'CEO@Leraacademy.edu.vn', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu', 'Ledia Balliu', 'Ledia Balliu', '+84 900 000 002', '00000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Chief Executive Officer', 'FULL_TIME', 90, 'ACTIVE', true, NOW(), NOW()),
    
    -- DIRECTOR (director@lera.edu.vn / password123)
    ('e0000000-0000-0000-0000-000000000004', 'director@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Le Van Director', 'Lê Văn Giám Đốc', '+84 900 000 004', '00000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Academic Director', 'FULL_TIME', 80, 'ACTIVE', true, NOW(), NOW()),
    
    -- CENTER MANAGERS
    ('e0000000-0000-0000-0000-000000000005', 'manager.hq@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Pham Van Manager', 'Phạm Văn Quản Lý', '+84 900 000 005', '00000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'Center Manager', 'FULL_TIME', 70, 'ACTIVE', true, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000006', 'manager.d7@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Hoang Van Manager', 'Hoàng Văn Quản Lý', '+84 900 000 006', '00000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007', 'Center Manager', 'FULL_TIME', 70, 'ACTIVE', true, NOW(), NOW()),
    
    -- ACADEMIC MANAGER (P@gmail.com / admin123)
    ('e0000000-0000-0000-0000-000000000007', 'P@gmail.com', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu', 'Phoung', 'Phoung', '+84 900 000 007', '00000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Academic Manager', 'FULL_TIME', 65, 'ACTIVE', true, NOW(), NOW()),
    
    -- CENTER ADMIN (centeradmin@lera.edu.vn / password123)
    ('e0000000-0000-0000-0000-000000000008', 'centeradmin@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Center Admin User', 'Quản trị trung tâm', '+84 900 000 008', '00000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'Center Admin', 'FULL_TIME', 60, 'ACTIVE', true, NOW(), NOW()),
    
    -- TEACHERS
    ('e0000000-0000-0000-0000-000000000010', 'Mo@gmail.com', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu', 'MO', 'MO', '+84 900 000 010', '00000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Teacher', 'FULL_TIME', 40, 'ACTIVE', true, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000011', 'teacher1@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'John Smith', 'John Smith', '+84 900 000 011', '00000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Senior Teacher', 'FULL_TIME', 40, 'ACTIVE', true, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000012', 'teacher2@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Sarah Johnson', 'Sarah Johnson', '+84 900 000 012', '00000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Teacher', 'FULL_TIME', 40, 'ACTIVE', true, NOW(), NOW()),
    
    -- TA (TA@lera.com / admin123)
    ('e0000000-0000-0000-0000-000000000020', 'TA@lera.com', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu', 'R', 'R', '+84 900 000 020', '00000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Teaching Assistant', 'PART_TIME', 35, 'ACTIVE', true, NOW(), NOW()),
    
    -- STAFF (staff1@lera.edu.vn / password123)
    ('e0000000-0000-0000-0000-000000000030', 'staff1@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Le Thi Staff', 'Lê Thị Nhân Viên', '+84 900 000 030', '00000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000008', 'Student Services', 'FULL_TIME', 30, 'ACTIVE', true, NOW(), NOW()),
    
    -- PARENTS (password123)
    ('e0000000-0000-0000-0000-000000000040', 'parent1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Nguyen Van Parent', 'Nguyễn Văn Phụ Huynh', '+84 900 000 040', '00000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', NULL, 'Parent', NULL, 20, 'ACTIVE', true, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000041', 'parent2@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Tran Thi Parent', 'Trần Thị Phụ Huynh', '+84 900 000 041', '00000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', NULL, 'Parent', NULL, 20, 'ACTIVE', true, NOW(), NOW()),
    
    -- STUDENTS (password123)
    ('e0000000-0000-0000-0000-000000000050', 'student1@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Nguyen Van Student', 'Nguyễn Văn Học Sinh', '+84 900 000 050', '00000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', NULL, 'Student', NULL, 10, 'ACTIVE', true, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000051', 'student2@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.cL/z4mGb4rZwk6Bku6', 'Tran Thi Student', 'Trần Thị Học Sinh', '+84 900 000 051', '00000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', NULL, 'Student', NULL, 10, 'ACTIVE', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    fullname = EXCLUDED.fullname,
    updated_at = NOW();

-- =====================================================
-- ROLE_PERMISSIONS (Assign all permissions to CHAIRMAN)
-- Entity: id, role_id, permission_id, permission_code, created_at
-- =====================================================
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'CHAIRMAN'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SYSTEM_SETTINGS
-- Entity: id, setting_key, setting_value, setting_type, category, description, is_public, updated_at
-- NOTE: No created_at column in this entity!
-- =====================================================
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public, updated_at)
VALUES 
    (gen_random_uuid(), 'academy_name', 'LERA Sports Academy', 'text', 'GENERAL', 'Academy name', true, NOW()),
    (gen_random_uuid(), 'default_currency', 'VND', 'text', 'FINANCE', 'Default currency', true, NOW()),
    (gen_random_uuid(), 'timezone', 'Asia/Ho_Chi_Minh', 'text', 'GENERAL', 'System timezone', true, NOW()),
    (gen_random_uuid(), 'session_timeout', '3600', 'number', 'SECURITY', 'Session timeout in seconds', false, NOW()),
    (gen_random_uuid(), 'max_login_attempts', '5', 'number', 'SECURITY', 'Maximum login attempts', false, NOW()),
    (gen_random_uuid(), 'email_notifications', 'true', 'boolean', 'NOTIFICATIONS', 'Enable email notifications', false, NOW()),
    (gen_random_uuid(), 'sms_notifications', 'true', 'boolean', 'NOTIFICATIONS', 'Enable SMS notifications', false, NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- FEATURE_FLAGS
-- Entity: id, flag_key, flag_name, description, is_enabled, rollout_percentage, created_at, updated_at
-- =====================================================
INSERT INTO feature_flags (id, flag_key, flag_name, description, is_enabled, rollout_percentage, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'ai_tutor_enabled', 'AI Tutor', 'Enable AI Tutor feature', true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'online_payments', 'Online Payments', 'Enable online payment processing', true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'sms_notifications', 'SMS Notifications', 'Enable SMS notifications', true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'parent_portal', 'Parent Portal', 'Enable parent portal access', true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'gamification', 'Gamification', 'Enable gamification features', true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'multi_language', 'Multi Language', 'Enable multi-language support', true, 100, NOW(), NOW())
ON CONFLICT (flag_key) DO NOTHING;
