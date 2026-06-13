-- ===========================================================
-- LERA ECOSYSTEM — Multi-Tenant Master Database Schema (v2.0)
-- ===========================================================
-- Complete Enterprise System with 107 Tables
-- Includes: Multi-Tenancy, LMS, CRM, Payments, Payroll, AI, Sports
-- ===========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================
-- 🔴 SECTION A: MULTI-TENANT SYSTEM (SuperAdmin → God Mode)
-- ===========================================================

-- =============================
-- A.1 TENANTS (Organizations/Educational Brands)
-- =============================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    subscription_plan VARCHAR(50) DEFAULT 'BASIC',
    subscription_expires_at TIMESTAMP,
    max_centers INT DEFAULT 1,
    max_students INT DEFAULT 100,
    max_teachers INT DEFAULT 10,
    features JSONB DEFAULT '{}',
    billing_email VARCHAR(255),
    billing_address TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    currency VARCHAR(10) DEFAULT 'VND',
    locale VARCHAR(10) DEFAULT 'vi',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- A.2 TENANT SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#0a1a5c',
    secondary_color VARCHAR(20) DEFAULT '#1e40af',
    theme VARCHAR(20) DEFAULT 'light',
    custom_css TEXT,
    email_from_name VARCHAR(255),
    email_from_address VARCHAR(255),
    sms_gateway VARCHAR(50),
    payment_gateway VARCHAR(50),
    features_enabled JSONB DEFAULT '{"lms": true, "crm": true, "payments": true, "ai": false, "sports": false}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- =============================
-- A.3 CENTERS (Learning Centers under Tenant)
-- =============================
CREATE TABLE IF NOT EXISTS centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    address TEXT,
    address_vi TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Vietnam',
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_id UUID,
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    opening_date DATE,
    capacity INT DEFAULT 500,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =============================
-- A.4 CENTER SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS center_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    operating_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "20:00"}}',
    holidays JSONB DEFAULT '[]',
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    locale VARCHAR(10) DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    auto_attendance BOOLEAN DEFAULT FALSE,
    require_payment_before_class BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(center_id)
);

-- =============================
-- A.5 ROLES
-- =============================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    display_name_vi VARCHAR(255),
    description TEXT,
    level INT DEFAULT 0,
    is_system_role BOOLEAN DEFAULT FALSE,
    scope VARCHAR(20) DEFAULT 'TENANT', -- GLOBAL, TENANT, CENTER
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- =============================
-- A.6 PERMISSIONS
-- =============================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100),
    resource VARCHAR(100),
    action VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- A.7 ROLE PERMISSIONS
-- =============================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- =============================
-- A.8 USERS (All System Users)
-- =============================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =============================
-- A.9 USER ROLES
-- =============================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id, center_id)
);

-- =============================
-- A.9.1 USER PERMISSIONS (Direct User Feature Access)
-- =============================
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

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- =============================
-- A.10 IMPERSONATION LOGS
-- =============================
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID REFERENCES users(id),
    impersonated_user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    reason TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- =============================
-- A.11 AUDIT LOGS
-- =============================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =============================
-- A.12 ACTIVITY LOGS
-- =============================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);

-- =============================
-- A.13 LOGIN HISTORY
-- =============================
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    login_status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, BLOCKED
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    location VARCHAR(255),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_status ON login_history(login_status);

-- =============================
-- A.14 DEPARTMENTS
-- =============================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    department_name_vi VARCHAR(200),
    department_type VARCHAR(50) NOT NULL,
    parent_department_id UUID,
    center_id UUID REFERENCES centers(id),
    office_type VARCHAR(50) NOT NULL DEFAULT 'MAIN_OFFICE',
    manager_id UUID,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_departments_center ON departments(center_id);
CREATE INDEX idx_departments_status ON departments(status);

-- =============================
-- A.15 SYSTEM SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'STRING',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- A.16 CMS SETTINGS (for website content, social media, SEO)
-- =============================
CREATE TABLE IF NOT EXISTS cms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    category VARCHAR(100),
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_settings_category ON cms_settings(category);
CREATE INDEX IF NOT EXISTS idx_cms_settings_key ON cms_settings(setting_key);

-- ===========================================================
-- 🟦 SECTION B: LERA ACADEMY (LMS SYSTEM)
-- ===========================================================

-- =============================
-- B.1 STUDENTS
-- =============================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    user_id UUID REFERENCES users(id),
    student_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, student_code)
);

-- =============================
-- B.2 STUDENT PROFILES
-- =============================
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    school_name VARCHAR(255),
    grade VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(50),
    medical_notes TEXT,
    learning_notes TEXT,
    special_needs TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id)
);

-- =============================
-- B.3 STUDENT PARENTS
-- =============================
CREATE TABLE IF NOT EXISTS student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    relationship VARCHAR(50) NOT NULL, -- FATHER, MOTHER, GUARDIAN
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, user_id)
);

-- =============================
-- B.4 PARENT PROFILES
-- =============================
CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    occupation VARCHAR(255),
    company VARCHAR(255),
    address TEXT,
    preferred_contact_method VARCHAR(20) DEFAULT 'EMAIL',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================
-- B.5 STUDENT DOCUMENTS
-- =============================
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- =============================
-- B.6 STUDENT PROGRESS
-- =============================
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID,
    class_id UUID,
    period VARCHAR(50),
    period_start DATE,
    period_end DATE,
    overall_score DECIMAL(5, 2),
    attendance_rate DECIMAL(5, 2),
    homework_completion DECIMAL(5, 2),
    teacher_notes TEXT,
    parent_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.7 STUDENT SKILL LEVELS
-- =============================
CREATE TABLE IF NOT EXISTS student_skill_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50),
    level VARCHAR(50),
    score DECIMAL(5, 2),
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- =============================
-- B.8 TEACHERS
-- =============================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    user_id UUID REFERENCES users(id),
    teacher_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    contract_type VARCHAR(50),
    contract_start_date DATE,
    contract_end_date DATE,
    is_native_speaker BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, teacher_code)
);

-- =============================
-- B.9 TEACHER PROFILES
-- =============================
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    nationality VARCHAR(100),
    languages_spoken VARCHAR(255),
    specialization TEXT,
    qualification TEXT,
    years_of_experience INT,
    bio TEXT,
    bio_vi TEXT,
    address TEXT,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(teacher_id)
);

-- =============================
-- B.10 TEACHER DOCUMENTS
-- =============================
CREATE TABLE IF NOT EXISTS teacher_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- =============================
-- B.11 TEACHER SKILL LEVELS
-- =============================
CREATE TABLE IF NOT EXISTS teacher_skill_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50),
    certification VARCHAR(255),
    level VARCHAR(50),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.12 COURSES
-- =============================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    description_vi TEXT,
    category VARCHAR(100),
    level VARCHAR(50),
    age_from INT,
    age_to INT,
    duration_months INT DEFAULT 3,
    total_lessons INT DEFAULT 36,
    price DECIMAL(12, 2),
    image_url TEXT,
    color VARCHAR(20),
    syllabus_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =============================
-- B.13 COURSE MODULES
-- =============================
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    description_vi TEXT,
    duration_weeks INT DEFAULT 4,
    objectives TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, module_number)
);

-- =============================
-- B.14 COURSE LESSONS
-- =============================
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    lesson_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    content TEXT,
    content_vi TEXT,
    video_url TEXT,
    duration_minutes INT,
    learning_outcomes TEXT,
    display_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, lesson_number)
);

-- =============================
-- B.15 COURSE MATERIALS
-- =============================
CREATE TABLE IF NOT EXISTS course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
    material_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    is_downloadable BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.16 CLASSES
-- =============================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    name VARCHAR(255) NOT NULL,
    class_code VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id),
    assistant_teacher_id UUID REFERENCES teachers(id),
    room VARCHAR(100),
    max_students INT DEFAULT 15,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, ONGOING, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, class_code)
);

-- =============================
-- B.17 CLASS SCHEDULES
-- =============================
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    recurrence_type VARCHAR(20) DEFAULT 'WEEKLY',
    recurrence_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.18 CLASS STUDENTS
-- =============================
CREATE TABLE IF NOT EXISTS class_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    completion_status VARCHAR(20),
    final_grade VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- =============================
-- B.19 CLASS ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS class_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME,
    status VARCHAR(20) DEFAULT 'PRESENT',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, student_id, session_date)
);

-- =============================
-- B.20 CLASS ASSIGNMENTS
-- =============================
CREATE TABLE IF NOT EXISTS class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50),
    due_date TIMESTAMP,
    max_score DECIMAL(5, 2) DEFAULT 100,
    file_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.21 ASSIGNMENT SUBMISSIONS
-- =============================
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES class_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_date TIMESTAMP DEFAULT NOW(),
    file_url TEXT,
    content TEXT,
    score DECIMAL(5, 2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- =============================
-- B.22 EXAMS
-- =============================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    exam_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    exam_date DATE,
    start_time TIME,
    duration_minutes INT,
    max_score DECIMAL(5, 2) DEFAULT 100,
    passing_score DECIMAL(5, 2) DEFAULT 50,
    description TEXT,
    instructions TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.23 EXAM RESULTS
-- =============================
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    grade VARCHAR(10),
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- =============================
-- B.24 CERTIFICATES
-- =============================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    certificate_type VARCHAR(50),
    issued_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    pdf_url TEXT,
    verification_code VARCHAR(100) UNIQUE,
    issued_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- B.25 CERTIFICATE TEMPLATES
-- =============================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50),
    html_template TEXT,
    css_styles TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- 🟪 SECTION C: CRM – LERA CONNECT (Leads System)
-- ===========================================================

-- =============================
-- C.1 LEADS
-- =============================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    source_id UUID,
    status_id UUID,
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_email VARCHAR(255),
    student_name VARCHAR(255),
    student_age INT,
    student_grade VARCHAR(50),
    interested_course_id UUID REFERENCES courses(id),
    preferred_schedule TEXT,
    budget_range VARCHAR(50),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    converted_student_id UUID REFERENCES students(id),
    conversion_date TIMESTAMP,
    score INT DEFAULT 0,
    temperature VARCHAR(20) DEFAULT 'COLD', -- HOT, WARM, COLD
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    referrer_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.2 LEAD SOURCES
-- =============================
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =============================
-- C.3 LEAD STATUSES
-- =============================
CREATE TABLE IF NOT EXISTS lead_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    stage VARCHAR(50) NOT NULL, -- NEW, CONTACTED, QUALIFIED, NEGOTIATION, WON, LOST
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- =============================
-- C.4 LEAD NOTES
-- =============================
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'GENERAL',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.5 LEAD TAGS
-- =============================
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.6 LEAD ACTIVITIES
-- =============================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.7 LEAD ASSIGNMENTS
-- =============================
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    reason TEXT
);

-- =============================
-- C.8 LEAD FOLLOWUPS
-- =============================
CREATE TABLE IF NOT EXISTS lead_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    followup_type VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    outcome VARCHAR(50),
    next_followup_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.9 CHAT MESSAGES
-- =============================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL, -- STAFF, LEAD
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.10 CALL LOGS
-- =============================
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    call_type VARCHAR(20) NOT NULL, -- INBOUND, OUTBOUND
    phone_number VARCHAR(50),
    duration_seconds INT,
    status VARCHAR(20),
    recording_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.11 EMAIL LOGS
-- =============================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    to_email VARCHAR(255) NOT NULL,
    cc_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced BOOLEAN DEFAULT FALSE,
    status VARCHAR(20)
);

-- =============================
-- C.12 CRM AUTOMATIONS
-- =============================
CREATE TABLE IF NOT EXISTS crm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    execution_count INT DEFAULT 0,
    last_executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.13 CRM AUTOMATION RULES
-- =============================
CREATE TABLE IF NOT EXISTS crm_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES crm_automations(id) ON DELETE CASCADE,
    condition_field VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL,
    condition_value TEXT,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB,
    execution_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.14 CRM TRIGGERS
-- =============================
CREATE TABLE IF NOT EXISTS crm_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES crm_automations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT NOW(),
    execution_status VARCHAR(20),
    execution_result TEXT,
    execution_time_ms INT
);

-- =============================
-- C.15 MARKETING CAMPAIGNS
-- =============================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50),
    budget DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    target_audience JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- C.16 CAMPAIGN LEADS
-- =============================
CREATE TABLE IF NOT EXISTS campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(12, 2),
    UNIQUE(campaign_id, lead_id)
);

-- ===========================================================
-- 🟧 SECTION D: PAYMENTS & PAYROLL
-- ===========================================================

-- =============================
-- D.1 INVOICES
-- =============================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    student_id UUID REFERENCES students(id),
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

-- =============================
-- D.2 INVOICE ITEMS
-- =============================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    description_vi VARCHAR(255),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    class_id UUID REFERENCES classes(id),
    course_id UUID REFERENCES courses(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.3 PAYMENTS
-- =============================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id),
    student_id UUID REFERENCES students(id),
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    gateway_response JSONB,
    status VARCHAR(30) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.3a REFUNDS
-- =============================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- =============================
-- D.4 PAYMENT METHODS
-- =============================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    gateway VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =============================
-- D.5 DISCOUNTS
-- =============================
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    discount_type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INT,
    current_uses INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    min_purchase DECIMAL(12, 2),
    applicable_to VARCHAR(50) DEFAULT 'ALL',
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =============================
-- D.6 SCHOLARSHIPS
-- =============================
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scholarship_type VARCHAR(50),
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(12, 2),
    eligibility_criteria JSONB,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.7 FEE RULES
-- =============================
CREATE TABLE IF NOT EXISTS fee_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.8 FEE RULE CONDITIONS
-- =============================
CREATE TABLE IF NOT EXISTS fee_rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES fee_rules(id) ON DELETE CASCADE,
    condition_field VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL,
    condition_value TEXT,
    logical_operator VARCHAR(10) DEFAULT 'AND',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.9 FEE RULE ACTIONS
-- =============================
CREATE TABLE IF NOT EXISTS fee_rule_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES fee_rules(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.10 FEE RULE TESTS
-- =============================
CREATE TABLE IF NOT EXISTS fee_rule_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES fee_rules(id) ON DELETE CASCADE,
    test_input JSONB,
    expected_output JSONB,
    actual_output JSONB,
    test_status VARCHAR(20),
    tested_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.11 FEE PREVIEWS
-- =============================
CREATE TABLE IF NOT EXISTS fee_previews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    course_id UUID REFERENCES courses(id),
    class_id UUID REFERENCES classes(id),
    base_fee DECIMAL(12, 2),
    applied_rules JSONB,
    final_fee DECIMAL(12, 2),
    preview_date TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP
);

-- =============================
-- D.11a STUDENT DISCOUNTS
-- =============================
CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    discount_id UUID REFERENCES discounts(id),
    discount_name VARCHAR(200),
    discount_type VARCHAR(50),
    discount_value DECIMAL(10, 2),
    reason TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_discounts_student ON student_discounts(student_id);
CREATE INDEX idx_student_discounts_status ON student_discounts(status);

-- =============================
-- D.11b STUDENT FEE PLANS
-- =============================
CREATE TABLE IF NOT EXISTS student_fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    plan_name VARCHAR(200),
    total_amount DECIMAL(15, 2),
    installments INT,
    installment_amount DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_fee_plans_student ON student_fee_plans(student_id);
CREATE INDEX idx_student_fee_plans_status ON student_fee_plans(status);

-- =============================
-- D.11c STUDENT SCHOLARSHIPS
-- =============================
CREATE TABLE IF NOT EXISTS student_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    scholarship_id UUID REFERENCES scholarships(id),
    scholarship_name VARCHAR(200),
    amount DECIMAL(15, 2),
    percentage DECIMAL(5, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_scholarships_student ON student_scholarships(student_id);

-- =============================
-- D.11d LEDGER ENTRIES
-- =============================
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    center_id UUID REFERENCES centers(id),
    entry_type VARCHAR(50) NOT NULL,
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_center ON ledger_entries(center_id);
CREATE INDEX idx_ledger_entries_type ON ledger_entries(entry_type);

-- =============================
-- D.11e LATE FEE RULES
-- =============================
CREATE TABLE IF NOT EXISTS late_fee_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    grace_period_days INT DEFAULT 0,
    fee_type VARCHAR(50) DEFAULT 'FIXED',
    fee_amount DECIMAL(10, 2),
    fee_percentage DECIMAL(5, 2),
    max_fee DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.12 PAYROLL CYCLES
-- =============================
CREATE TABLE IF NOT EXISTS payroll_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_name VARCHAR(100) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    total_amount DECIMAL(12, 2) DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.13 TEACHER SALARIES
-- =============================
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_cycle_id UUID REFERENCES payroll_cycles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    base_salary DECIMAL(12, 2) DEFAULT 0,
    teaching_hours DECIMAL(6, 2) DEFAULT 0,
    hourly_rate DECIMAL(10, 2) DEFAULT 0,
    teaching_amount DECIMAL(12, 2) DEFAULT 0,
    bonus DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.14 SALARY COMPONENTS
-- =============================
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    calculation_basis TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.15 SALARY PAYOUTS
-- =============================
CREATE TABLE IF NOT EXISTS salary_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    transaction_id VARCHAR(255),
    paid_at TIMESTAMP DEFAULT NOW(),
    processed_by UUID REFERENCES users(id),
    notes TEXT
);

-- =============================
-- D.16 TAX SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    country VARCHAR(100),
    tax_name VARCHAR(100),
    tax_rate DECIMAL(5, 2),
    threshold_amount DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- D.17 TEACHER OVERTIME
-- =============================
CREATE TABLE IF NOT EXISTS teacher_overtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    payroll_cycle_id UUID REFERENCES payroll_cycles(id),
    overtime_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- 🟩 SECTION E: ATTENDANCE
-- ===========================================================

-- =============================
-- E.1 ATTENDANCE SESSIONS
-- =============================
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic VARCHAR(255),
    notes TEXT,
    teacher_id UUID REFERENCES teachers(id),
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, session_date, start_time)
);

-- =============================
-- E.2 STUDENT ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS student_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    late_minutes INT DEFAULT 0,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- =============================
-- E.3 ATTENDANCE EXCEPTIONS
-- =============================
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    exception_type VARCHAR(50) NOT NULL,
    reason TEXT,
    supporting_document_url TEXT,
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- 🟣 SECTION F: PUBLIC WEBSITE CMS
-- ===========================================================

-- =============================
-- F.1 MEDIA GALLERY
-- =============================
CREATE TABLE IF NOT EXISTS media_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    media_type VARCHAR(50) DEFAULT 'image',
    mime_type VARCHAR(100),
    file_size BIGINT,
    file_size_formatted VARCHAR(50),
    alt_text VARCHAR(500),
    alt_text_vi VARCHAR(500),
    caption TEXT,
    caption_vi TEXT,
    category VARCHAR(100),
    tags TEXT,
    used_in TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- F.2 FOOTER SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS footer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    section VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- F.3 CMS PAGES (for dynamic public pages)
-- =============================
CREATE TABLE IF NOT EXISTS cms_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title_en VARCHAR(500),
    title_vi VARCHAR(500),
    content_en TEXT,
    content_vi TEXT,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    featured_image TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMP,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for CMS tables
CREATE INDEX IF NOT EXISTS idx_media_gallery_category ON media_gallery(category);
CREATE INDEX IF NOT EXISTS idx_media_gallery_media_type ON media_gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_footer_settings_section ON footer_settings(section);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON cms_pages(is_published);

-- =============================
-- G. SOCIAL MEDIA & MARKETING TABLES
-- =============================

-- G.1 Social Media Platforms Configuration
CREATE TABLE IF NOT EXISTS social_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(20),
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    page_id VARCHAR(255),
    page_url TEXT,
    is_connected BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    auto_post BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- G.2 Social Media Posts
CREATE TABLE IF NOT EXISTS social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500),
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'post',
    media_urls TEXT[],
    platforms TEXT[],
    hashtags TEXT[],
    link_url TEXT,
    link_preview JSONB,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    engagement_data JSONB,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- G.3 Ad Accounts Configuration
CREATE TABLE IF NOT EXISTS ad_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'VND',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    daily_budget DECIMAL(15, 2),
    monthly_budget DECIMAL(15, 2),
    total_spend DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, account_id)
);

-- G.4 Tracking Pixels
CREATE TABLE IF NOT EXISTS tracking_pixels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    pixel_id VARCHAR(255) NOT NULL,
    pixel_name VARCHAR(255),
    pixel_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    events_tracked TEXT[],
    conversion_value DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, pixel_id)
);

-- G.5 Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) DEFAULT 'post',
    platforms TEXT[],
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status VARCHAR(50) DEFAULT 'planned',
    assigned_to UUID REFERENCES users(id),
    color VARCHAR(20),
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    post_id UUID REFERENCES social_media_posts(id),
    campaign_id UUID REFERENCES marketing_campaigns(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- G.6 Social Analytics Snapshots
CREATE TABLE IF NOT EXISTS social_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    total_reach INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 2),
    new_followers INTEGER DEFAULT 0,
    lost_followers INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,
    demographics JSONB,
    top_posts JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, metric_date)
);

-- G.7 Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    category VARCHAR(50),
    link TEXT,
    icon VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for social media tables
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_media_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_by ON social_media_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_social_analytics_platform ON social_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_social_analytics_date ON social_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ===========================================================
-- 🆕 SECTION: ADDITIONAL FEATURE TABLES (V5-V10 Migrations)
-- ===========================================================
-- Added: 2026-01-10
-- Includes: AI Features, Chat, Library, Sports, Transport, CMS
-- ===========================================================

-- ===========================================================
-- V5: AI FEATURES
-- ===========================================================

-- Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    difficulty_level VARCHAR(50),
    estimated_hours INTEGER,
    prerequisites JSONB,
    outcomes JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Tutor Sessions
CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    subject VARCHAR(100),
    topic VARCHAR(255),
    session_type VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    messages_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Assessments
CREATE TABLE IF NOT EXISTS ai_assessments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    subject VARCHAR(100),
    topic VARCHAR(255),
    assessment_type VARCHAR(50),
    total_questions INTEGER,
    correct_answers INTEGER,
    score DECIMAL(5,2),
    time_spent_minutes INTEGER,
    difficulty_level VARCHAR(50),
    strengths JSONB,
    weaknesses JSONB,
    recommendations JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Learning Progress
CREATE TABLE IF NOT EXISTS ai_learning_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    learning_path_id BIGINT REFERENCES learning_paths(id),
    subject VARCHAR(100),
    topic VARCHAR(255),
    mastery_level DECIMAL(5,2) DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    assessments_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    last_activity_at TIMESTAMP,
    progress_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT,
    recommendation_type VARCHAR(50),
    subject VARCHAR(100),
    topic VARCHAR(255),
    priority INTEGER DEFAULT 5,
    reason TEXT,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    resource_url VARCHAR(500),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- V6: CHAT FEATURES
-- ===========================================================

-- Chat Groups
CREATE TABLE IF NOT EXISTS chat_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    group_type VARCHAR(50) DEFAULT 'private',
    max_members INTEGER DEFAULT 256,
    owner_id BIGINT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Group Members
CREATE TABLE IF NOT EXISTS chat_group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id BIGINT,
    role VARCHAR(50) DEFAULT 'member',
    muted_until TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_type VARCHAR(50) DEFAULT 'direct',
    group_id BIGINT REFERENCES chat_groups(id),
    last_message_at TIMESTAMP,
    last_message_preview VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT,
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- Chat Attachments
CREATE TABLE IF NOT EXISTS chat_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Message Reactions
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT,
    user_id BIGINT,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Chat Polls
CREATE TABLE IF NOT EXISTS chat_polls (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT,
    question VARCHAR(500) NOT NULL,
    poll_type VARCHAR(50) DEFAULT 'single',
    is_anonymous BOOLEAN DEFAULT false,
    allows_add_options BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Poll Options
CREATE TABLE IF NOT EXISTS chat_poll_options (
    id BIGSERIAL PRIMARY KEY,
    poll_id BIGINT REFERENCES chat_polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    option_order INTEGER DEFAULT 0,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Poll Votes
CREATE TABLE IF NOT EXISTS chat_poll_votes (
    id BIGSERIAL PRIMARY KEY,
    poll_id BIGINT REFERENCES chat_polls(id) ON DELETE CASCADE,
    option_id BIGINT REFERENCES chat_poll_options(id) ON DELETE CASCADE,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- =====================================================
-- V7: LIBRARY MANAGEMENT TABLES
-- =====================================================

-- Book Categories
CREATE TABLE IF NOT EXISTS book_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES book_categories(id),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authors
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    nationality VARCHAR(100),
    birth_date DATE,
    photo_url VARCHAR(500),
    website VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publishers
CREATE TABLE IF NOT EXISTS publishers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    isbn VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    cover_image_url VARCHAR(500),
    category_id BIGINT REFERENCES book_categories(id),
    author_id BIGINT REFERENCES authors(id),
    publisher_id BIGINT REFERENCES publishers(id),
    publication_date DATE,
    edition VARCHAR(50),
    language VARCHAR(50) DEFAULT 'Vietnamese',
    page_count INTEGER,
    format VARCHAR(50),
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    location VARCHAR(100),
    price DECIMAL(12,2),
    tags JSONB,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library Inventory
CREATE TABLE IF NOT EXISTS library_inventory (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT REFERENCES books(id) ON DELETE CASCADE,
    copy_number INTEGER NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    condition VARCHAR(50) DEFAULT 'good',
    location VARCHAR(100),
    acquisition_date DATE,
    acquisition_type VARCHAR(50),
    acquisition_price DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'available',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Borrowings
CREATE TABLE IF NOT EXISTS book_borrowings (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT REFERENCES library_inventory(id),
    book_id BIGINT REFERENCES books(id),
    borrower_id BIGINT REFERENCES users(id),
    borrower_type VARCHAR(50),
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    return_condition VARCHAR(50),
    is_renewed BOOLEAN DEFAULT false,
    renewal_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'borrowed',
    notes TEXT,
    processed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Reservations
CREATE TABLE IF NOT EXISTS book_reservations (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT REFERENCES books(id),
    user_id BIGINT REFERENCES users(id),
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    notification_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library Fines
CREATE TABLE IF NOT EXISTS library_fines (
    id BIGSERIAL PRIMARY KEY,
    borrowing_id BIGINT REFERENCES book_borrowings(id),
    user_id BIGINT REFERENCES users(id),
    fine_type VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    days_overdue INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    waived_by BIGINT REFERENCES users(id),
    waived_at TIMESTAMP,
    waiver_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading Lists
CREATE TABLE IF NOT EXISTS reading_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id BIGINT REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading List Items
CREATE TABLE IF NOT EXISTS reading_list_items (
    id BIGSERIAL PRIMARY KEY,
    reading_list_id BIGINT REFERENCES reading_lists(id) ON DELETE CASCADE,
    book_id BIGINT REFERENCES books(id),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- V8: SPORTS MANAGEMENT TABLES
-- =====================================================

-- Sport Types
CREATE TABLE IF NOT EXISTS sport_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    max_team_size INTEGER,
    min_team_size INTEGER,
    rules TEXT,
    equipment_required JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Facilities
CREATE TABLE IF NOT EXISTS sport_facilities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100),
    location VARCHAR(255),
    capacity INTEGER,
    amenities JSONB,
    description TEXT,
    images JSONB,
    booking_rules JSONB,
    hourly_rate DECIMAL(12,2),
    is_indoor BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    maintenance_schedule JSONB,
    center_id BIGINT REFERENCES centers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Equipment
CREATE TABLE IF NOT EXISTS sport_equipment (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type_id BIGINT REFERENCES sport_types(id),
    category VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    quantity INTEGER DEFAULT 1,
    available_quantity INTEGER DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'good',
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    location VARCHAR(255),
    images JSONB,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Assignments
CREATE TABLE IF NOT EXISTS equipment_assignments (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT REFERENCES sport_equipment(id),
    assigned_to_id BIGINT REFERENCES users(id),
    assigned_to_type VARCHAR(50),
    team_id BIGINT,
    quantity INTEGER DEFAULT 1,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    returned_at TIMESTAMP,
    return_condition VARCHAR(50),
    status VARCHAR(50) DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Teams
CREATE TABLE IF NOT EXISTS sport_teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_type_id BIGINT REFERENCES sport_types(id),
    center_id BIGINT REFERENCES centers(id),
    category VARCHAR(100),
    age_group VARCHAR(50),
    gender VARCHAR(50),
    coach_id BIGINT REFERENCES teachers(id),
    assistant_coach_id BIGINT REFERENCES teachers(id),
    captain_id BIGINT REFERENCES students(id),
    logo_url VARCHAR(500),
    description TEXT,
    formation VARCHAR(50),
    home_color VARCHAR(50),
    away_color VARCHAR(50),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    ranking INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES sport_teams(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id),
    position VARCHAR(100),
    jersey_number INTEGER,
    role VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, student_id)
);

-- Student Skill Levels
CREATE TABLE IF NOT EXISTS student_skill_levels (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    skill_level VARCHAR(50),
    rating DECIMAL(3,1),
    assessed_by BIGINT REFERENCES teachers(id),
    assessed_at TIMESTAMP,
    skills_detail JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, sport_type_id)
);

-- Teacher Skill Levels
CREATE TABLE IF NOT EXISTS teacher_skill_levels (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT REFERENCES teachers(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    certification VARCHAR(255),
    certification_date DATE,
    expiry_date DATE,
    skill_level VARCHAR(50),
    specializations JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, sport_type_id)
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type_id BIGINT REFERENCES sport_types(id),
    tournament_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    location VARCHAR(255),
    organizer VARCHAR(255),
    max_teams INTEGER,
    min_teams INTEGER,
    entry_fee DECIMAL(12,2),
    prize_pool DECIMAL(12,2),
    rules TEXT,
    bracket_data JSONB,
    status VARCHAR(50) DEFAULT 'upcoming',
    winner_team_id BIGINT REFERENCES sport_teams(id),
    runner_up_team_id BIGINT REFERENCES sport_teams(id),
    images JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament Teams
CREATE TABLE IF NOT EXISTS tournament_teams (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES sport_teams(id),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    group_name VARCHAR(50),
    seed_number INTEGER,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'registered',
    final_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, team_id)
);

-- Sport Matches
CREATE TABLE IF NOT EXISTS sport_matches (
    id BIGSERIAL PRIMARY KEY,
    sport_type_id BIGINT REFERENCES sport_types(id),
    tournament_id BIGINT REFERENCES tournaments(id),
    home_team_id BIGINT REFERENCES sport_teams(id),
    away_team_id BIGINT REFERENCES sport_teams(id),
    facility_id BIGINT REFERENCES sport_facilities(id),
    match_date TIMESTAMP,
    duration_minutes INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    match_type VARCHAR(50),
    round VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    referee VARCHAR(255),
    attendance INTEGER,
    weather VARCHAR(50),
    highlights JSONB,
    match_report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match Events
CREATE TABLE IF NOT EXISTS match_events (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES sport_matches(id) ON DELETE CASCADE,
    event_type VARCHAR(50),
    event_time INTEGER,
    team_id BIGINT REFERENCES sport_teams(id),
    player_id BIGINT REFERENCES students(id),
    secondary_player_id BIGINT REFERENCES students(id),
    description TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player Statistics
CREATE TABLE IF NOT EXISTS player_statistics (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    season VARCHAR(50),
    matches_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    rating DECIMAL(3,1),
    stats_detail JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, sport_type_id, season)
);

-- Sport Training Sessions
CREATE TABLE IF NOT EXISTS sport_training_sessions (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES sport_teams(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    coach_id BIGINT REFERENCES teachers(id),
    facility_id BIGINT REFERENCES sport_facilities(id),
    session_date DATE,
    start_time TIME,
    end_time TIME,
    session_type VARCHAR(50),
    focus_area VARCHAR(255),
    description TEXT,
    drills JSONB,
    equipment_needed JSONB,
    intensity_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Attendance
CREATE TABLE IF NOT EXISTS training_attendance (
    id BIGSERIAL PRIMARY KEY,
    training_session_id BIGINT REFERENCES sport_training_sessions(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id),
    status VARCHAR(50) DEFAULT 'present',
    arrival_time TIME,
    departure_time TIME,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(training_session_id, student_id)
);

-- Facility Bookings
CREATE TABLE IF NOT EXISTS facility_bookings (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT REFERENCES sport_facilities(id),
    booked_by BIGINT REFERENCES users(id),
    team_id BIGINT REFERENCES sport_teams(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255),
    attendees_count INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    total_cost DECIMAL(12,2),
    is_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- V9: TRANSPORT MANAGEMENT TABLES
-- =====================================================

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    capacity INTEGER NOT NULL,
    fuel_type VARCHAR(50),
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    registration_date DATE,
    registration_expiry DATE,
    insurance_number VARCHAR(100),
    insurance_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    odometer_reading INTEGER,
    gps_device_id VARCHAR(100),
    features JSONB,
    images JSONB,
    status VARCHAR(50) DEFAULT 'active',
    center_id BIGINT REFERENCES centers(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100),
    description TEXT,
    service_provider VARCHAR(255),
    service_date DATE NOT NULL,
    odometer_at_service INTEGER,
    cost DECIMAL(12,2),
    parts_replaced JSONB,
    next_maintenance_date DATE,
    next_maintenance_odometer INTEGER,
    documents JSONB,
    status VARCHAR(50) DEFAULT 'completed',
    performed_by VARCHAR(255),
    approved_by BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Drivers
CREATE TABLE IF NOT EXISTS transport_drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    date_of_birth DATE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_type VARCHAR(50),
    license_issue_date DATE,
    license_expiry DATE,
    photo_url VARCHAR(500),
    blood_group VARCHAR(10),
    experience_years INTEGER,
    previous_employer VARCHAR(255),
    background_check_date DATE,
    background_check_status VARCHAR(50),
    assigned_vehicle_id BIGINT REFERENCES vehicles(id),
    salary DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active',
    joined_date DATE,
    termination_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Routes
CREATE TABLE IF NOT EXISTS transport_routes (
    id BIGSERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(50) UNIQUE,
    route_type VARCHAR(50),
    start_point VARCHAR(255),
    end_point VARCHAR(255),
    total_distance DECIMAL(10,2),
    estimated_duration INTEGER,
    assigned_vehicle_id BIGINT REFERENCES vehicles(id),
    primary_driver_id BIGINT REFERENCES transport_drivers(id),
    secondary_driver_id BIGINT REFERENCES transport_drivers(id),
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    fare_per_month DECIMAL(12,2),
    map_data JSONB,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    center_id BIGINT REFERENCES centers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INTEGER NOT NULL,
    address VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    pickup_time TIME,
    dropoff_time TIME,
    waiting_time INTEGER DEFAULT 2,
    landmark VARCHAR(255),
    students_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_order)
);

-- Transport Schedules
CREATE TABLE IF NOT EXISTS transport_schedules (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id) ON DELETE CASCADE,
    vehicle_id BIGINT REFERENCES vehicles(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    schedule_type VARCHAR(50),
    day_of_week VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Transport
CREATE TABLE IF NOT EXISTS student_transport (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    route_id BIGINT REFERENCES transport_routes(id),
    pickup_stop_id BIGINT REFERENCES route_stops(id),
    dropoff_stop_id BIGINT REFERENCES route_stops(id),
    transport_type VARCHAR(50),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    emergency_contact VARCHAR(50),
    special_instructions TEXT,
    medical_notes TEXT,
    monthly_fee DECIMAL(12,2),
    fee_status VARCHAR(50) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, route_id)
);

-- Transport Attendance
CREATE TABLE IF NOT EXISTS transport_attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    route_id BIGINT REFERENCES transport_routes(id),
    schedule_id BIGINT REFERENCES transport_schedules(id),
    attendance_date DATE NOT NULL,
    attendance_type VARCHAR(50),
    stop_id BIGINT REFERENCES route_stops(id),
    boarded_at TIMESTAMP,
    alighted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'present',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    marked_by BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date, attendance_type)
);

-- GPS Tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles(id),
    route_id BIGINT REFERENCES transport_routes(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(6,2),
    heading INTEGER,
    altitude DECIMAL(10,2),
    accuracy DECIMAL(6,2),
    battery_level INTEGER,
    signal_strength INTEGER,
    ignition_status BOOLEAN,
    door_status BOOLEAN,
    fuel_level DECIMAL(5,2),
    odometer INTEGER,
    event_type VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Logs
CREATE TABLE IF NOT EXISTS trip_logs (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    trip_type VARCHAR(50),
    trip_date DATE NOT NULL,
    scheduled_start_time TIME,
    actual_start_time TIME,
    scheduled_end_time TIME,
    actual_end_time TIME,
    start_odometer INTEGER,
    end_odometer INTEGER,
    total_distance DECIMAL(10,2),
    total_students INTEGER,
    fuel_consumed DECIMAL(10,2),
    route_deviation_km DECIMAL(10,2),
    delays_minutes INTEGER,
    incidents TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Notifications
CREATE TABLE IF NOT EXISTS transport_notifications (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    parent_id BIGINT REFERENCES users(id),
    notification_type VARCHAR(50),
    message TEXT,
    sent_via VARCHAR(50),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB
);

-- =====================================================
-- V10: WEBSITE CMS AND FEATURES TABLES
-- =====================================================

-- Banners
CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    mobile_image_url VARCHAR(500),
    link_url VARCHAR(500),
    link_target VARCHAR(20) DEFAULT '_self',
    button_text VARCHAR(100),
    position VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url VARCHAR(500),
    author_id BIGINT REFERENCES users(id),
    category VARCHAR(100),
    tags JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    is_featured BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    content_type VARCHAR(50),
    media_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    text_content TEXT,
    background_color VARCHAR(50),
    font_style VARCHAR(50),
    link_url VARCHAR(500),
    mentions JSONB,
    hashtags JSONB,
    location VARCHAR(255),
    duration_seconds INTEGER DEFAULT 5,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Story Views
CREATE TABLE IF NOT EXISTS story_views (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id BIGINT REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration_seconds INTEGER,
    UNIQUE(story_id, viewer_id)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    organization VARCHAR(255),
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    photo_url VARCHAR(500),
    video_url VARCHAR(500),
    student_id BIGINT REFERENCES students(id),
    parent_id BIGINT REFERENCES users(id),
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    tags JSONB,
    display_order INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leadership Members
CREATE TABLE IF NOT EXISTS leadership_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    bio TEXT,
    photo_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    department VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    environment VARCHAR(50) DEFAULT 'all',
    percentage_rollout INTEGER DEFAULT 100,
    user_whitelist JSONB,
    user_blacklist JSONB,
    conditions JSONB,
    expires_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Point Transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    student_id BIGINT REFERENCES students(id),
    transaction_type VARCHAR(50),
    points INTEGER NOT NULL,
    balance_after INTEGER,
    category VARCHAR(100),
    reference_type VARCHAR(100),
    reference_id BIGINT,
    description TEXT,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Points
CREATE TABLE IF NOT EXISTS student_points (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    total_expired INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    lifetime_balance INTEGER DEFAULT 0,
    level VARCHAR(50) DEFAULT 'bronze',
    level_progress INTEGER DEFAULT 0,
    achievements JSONB,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared Assignments
CREATE TABLE IF NOT EXISTS shared_assignments (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES class_assignments(id) ON DELETE CASCADE,
    shared_by BIGINT REFERENCES users(id),
    shared_with_class_id BIGINT REFERENCES classes(id),
    shared_with_teacher_id BIGINT REFERENCES teachers(id),
    can_edit BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT
);

-- Class Group Chats
CREATE TABLE IF NOT EXISTS class_group_chats (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES classes(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES chat_groups(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, group_id)
);

-- Class Schedule Exceptions
CREATE TABLE IF NOT EXISTS class_schedule_exceptions (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT REFERENCES class_schedules(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    exception_type VARCHAR(50),
    new_start_time TIME,
    new_end_time TIME,
    new_room VARCHAR(100),
    substitute_teacher_id BIGINT REFERENCES teachers(id),
    reason TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Sessions
CREATE TABLE IF NOT EXISTS class_sessions (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES classes(id),
    schedule_id BIGINT REFERENCES class_schedules(id),
    teacher_id BIGINT REFERENCES teachers(id),
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic VARCHAR(500),
    description TEXT,
    lesson_id BIGINT REFERENCES course_lessons(id),
    materials JSONB,
    homework TEXT,
    recording_url VARCHAR(500),
    session_type VARCHAR(50) DEFAULT 'regular',
    status VARCHAR(50) DEFAULT 'scheduled',
    attendance_marked BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bonuses
CREATE TABLE IF NOT EXISTS bonuses (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES users(id),
    teacher_id BIGINT REFERENCES teachers(id),
    bonus_type VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payroll_cycle_id BIGINT REFERENCES payroll_cycles(id),
    reason TEXT,
    performance_metrics JSONB,
    approval_status VARCHAR(50) DEFAULT 'pending',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_reference VARCHAR(100),
    tax_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES users(id),
    teacher_id BIGINT REFERENCES teachers(id),
    payroll_cycle_id BIGINT REFERENCES payroll_cycles(id),
    basic_salary DECIMAL(12,2),
    gross_salary DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    total_earnings DECIMAL(12,2),
    total_deductions DECIMAL(12,2),
    total_bonuses DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    social_insurance DECIMAL(12,2),
    health_insurance DECIMAL(12,2),
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    leave_deduction DECIMAL(12,2) DEFAULT 0,
    attendance_bonus DECIMAL(12,2) DEFAULT 0,
    earnings_breakdown JSONB,
    deductions_breakdown JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balance Accruals
CREATE TABLE IF NOT EXISTS leave_balance_accruals (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES users(id),
    teacher_id BIGINT REFERENCES teachers(id),
    leave_type VARCHAR(50),
    year INTEGER NOT NULL,
    month INTEGER,
    accrued_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    expired_days DECIMAL(5,2) DEFAULT 0,
    carried_over_days DECIMAL(5,2) DEFAULT 0,
    balance_days DECIMAL(5,2) DEFAULT 0,
    max_carry_over DECIMAL(5,2),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type, year, month)
);

-- =====================================================
-- ALL INDEXES
-- =====================================================

-- Library indexes
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_library_inventory_book ON library_inventory(book_id);
CREATE INDEX IF NOT EXISTS idx_library_inventory_status ON library_inventory(status);
CREATE INDEX IF NOT EXISTS idx_book_borrowings_user ON book_borrowings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_book_borrowings_status ON book_borrowings(status);
CREATE INDEX IF NOT EXISTS idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_user ON book_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_user ON library_fines(user_id);
CREATE INDEX IF NOT EXISTS idx_library_fines_status ON library_fines(status);

-- Sports indexes
CREATE INDEX IF NOT EXISTS idx_sport_teams_type ON sport_teams(sport_type_id);
CREATE INDEX IF NOT EXISTS idx_sport_teams_center ON sport_teams(center_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student ON team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(sport_type_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_sport_matches_tournament ON sport_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sport_matches_date ON sport_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_player_statistics_student ON player_statistics(student_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_team ON sport_training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_session ON training_attendance(training_session_id);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_date ON facility_bookings(booking_date);

-- Transport indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_center ON vehicles(center_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_date ON vehicle_maintenance(service_date);
CREATE INDEX IF NOT EXISTS idx_transport_drivers_status ON transport_drivers(status);
CREATE INDEX IF NOT EXISTS idx_transport_routes_center ON transport_routes(center_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_schedules_route ON transport_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_student ON student_transport(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_route ON student_transport(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_student ON transport_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_date ON transport_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_time ON gps_tracking(recorded_at);
CREATE INDEX IF NOT EXISTS idx_trip_logs_route ON trip_logs(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_date ON trip_logs(trip_date);
CREATE INDEX IF NOT EXISTS idx_transport_notifications_student ON transport_notifications(student_id);

-- Website/CMS indexes
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_role ON testimonials(role);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_student ON point_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_points_student ON student_points(student_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class ON class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_bonuses_employee ON bonuses(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_cycle ON bonuses(payroll_cycle_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_cycle ON payroll_records(payroll_cycle_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_employee ON leave_balance_accruals(employee_id);

-- =====================================================
-- FINAL GRANTS
-- =====================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lera;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lera;

SELECT 'All tables created successfully! Total: ~170 tables' as status;