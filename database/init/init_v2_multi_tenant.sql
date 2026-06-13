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

-- Continue in next message due to length...
