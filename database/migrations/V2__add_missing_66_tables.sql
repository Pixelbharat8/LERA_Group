-- ===========================================================
-- LERA ACADEMY — Migration to 107 Tables (v2.0)
-- ===========================================================
-- This migration adds 66 missing tables to the existing 41 tables
-- ===========================================================

-- ===========================================================
-- PostgreSQL prerequisites
-- ===========================================================
-- Required for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional for embedding_vector; if you don't want pgvector, the migration will fall back to JSONB.
-- The extension might not be installed on the system; in that case we just skip it.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
  EXCEPTION
    WHEN undefined_file OR insufficient_privilege THEN
      NULL;
    WHEN OTHERS THEN
      NULL;
  END;
END $$;

-- ===========================================================
-- A. MULTI-TENANT + AUTH + RBAC (9 new tables)
-- ===========================================================

-- Tenants (Multi-tenant foundation)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    subscription_plan VARCHAR(50),
    subscription_expires_at DATE,
    max_centers INT DEFAULT 1,
    max_users INT DEFAULT 100,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Settings
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

-- Center Settings
CREATE TABLE IF NOT EXISTS center_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(center_id, setting_key)
);

-- User Roles (explicit many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Impersonation Logs
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    reason TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    login_at TIMESTAMP DEFAULT NOW(),
    logout_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- B. STUDENTS & PARENTS (5 new tables)
-- ===========================================================

-- Student Parents (many-to-many relationship)
CREATE TABLE IF NOT EXISTS student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT TRUE,
    can_pickup BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON student_parents(parent_id);

-- Parent Profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    occupation VARCHAR(255),
    company VARCHAR(255),
    education_level VARCHAR(100),
    preferred_contact_method VARCHAR(50),
    preferred_language VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Documents
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    expires_at DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);

-- Student Skill Levels
CREATE TABLE IF NOT EXISTS student_skill_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_category VARCHAR(100) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    level VARCHAR(50),
    score DECIMAL(5, 2),
    assessed_by UUID REFERENCES users(id),
    assessed_at DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_skill_levels_student ON student_skill_levels(student_id);

-- ===========================================================
-- C. TEACHERS (3 new tables)
-- ===========================================================

-- Teacher Documents
CREATE TABLE IF NOT EXISTS teacher_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    expires_at DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_documents_teacher ON teacher_documents(teacher_id);

-- Teacher Skill Levels
CREATE TABLE IF NOT EXISTS teacher_skill_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    skill_category VARCHAR(100) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    level VARCHAR(50),
    years_experience INT,
    certification VARCHAR(255),
    certified_at DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_skill_levels_teacher ON teacher_skill_levels(teacher_id);

-- ===========================================================
-- D. COURSES (3 new tables)
-- ===========================================================

-- Course Modules
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES course_programs(id) ON DELETE CASCADE,
    module_name VARCHAR(255) NOT NULL,
    module_name_vi VARCHAR(255),
    description TEXT,
    description_vi TEXT,
    sequence INT DEFAULT 1,
    duration_weeks INT DEFAULT 4,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);

-- Course Lessons
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    lesson_name VARCHAR(255) NOT NULL,
    lesson_name_vi VARCHAR(255),
    description TEXT,
    description_vi TEXT,
    sequence INT DEFAULT 1,
    duration_minutes INT DEFAULT 90,
    lesson_type VARCHAR(50),
    objectives TEXT,
    content TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);

-- Course Materials
CREATE TABLE IF NOT EXISTS course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(50),
    file_path TEXT,
    file_url TEXT,
    file_size INT,
    mime_type VARCHAR(100),
    description TEXT,
    display_order INT DEFAULT 0,
    is_downloadable BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_lesson ON course_materials(lesson_id);

-- ===========================================================
-- E. CLASSES & ATTENDANCE (3 new tables)
-- ===========================================================

-- Attendance Records (required by attendance_exceptions)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    marked_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, class_session_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(class_session_id);

-- Class Schedules
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules(class_id);

-- Attendance Exceptions
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
    exception_type VARCHAR(50) NOT NULL,
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_attendance ON attendance_exceptions(attendance_id);

-- ===========================================================
-- F. ASSIGNMENTS & EXAMS (2 new tables)
-- ===========================================================

-- Class Assignments
CREATE TABLE IF NOT EXISTS class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id),
    assignment_name VARCHAR(255) NOT NULL,
    description TEXT,
    assignment_type VARCHAR(50),
    max_score DECIMAL(5, 2) DEFAULT 100,
    due_date TIMESTAMP,
    instructions TEXT,
    attachments JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_assignments_class ON class_assignments(class_id);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES class_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP,
    submission_text TEXT,
    attachments JSONB,
    score DECIMAL(5, 2),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);

-- ===========================================================
-- G. CERTIFICATES (2 new tables)
-- ===========================================================

-- Certificate Templates
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    course_id UUID REFERENCES course_programs(id),
    template_html TEXT,
    template_css TEXT,
    variables JSONB,
    background_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES course_programs(id),
    template_id UUID REFERENCES certificate_templates(id),
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    grade VARCHAR(10),
    score DECIMAL(5, 2),
    certificate_data JSONB,
    file_url TEXT,
    qr_code TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    issued_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);

-- ===========================================================
-- H. CRM EXTENSIONS (13 new tables)
-- ===========================================================

-- Lead Statuses
CREATE TABLE IF NOT EXISTS lead_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_name VARCHAR(100) UNIQUE NOT NULL,
    status_name_vi VARCHAR(100),
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lead Notes
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);

-- Lead Tags
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lead Tag Assignments
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES lead_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lead_id, tag_id)
);

-- Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_date TIMESTAMP DEFAULT NOW(),
    description TEXT,
    duration_minutes INT,
    outcome VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

-- Lead Assignments
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_user ON lead_assignments(assigned_to);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_lead ON chat_messages(lead_id);

-- Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES users(id),
    call_type VARCHAR(50),
    call_duration INT,
    call_status VARCHAR(50),
    recording_url TEXT,
    notes TEXT,
    called_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON call_logs(lead_id);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    user_id UUID REFERENCES users(id),
    email_to VARCHAR(255) NOT NULL,
    email_subject VARCHAR(500),
    email_body TEXT,
    email_status VARCHAR(50) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead ON email_logs(lead_id);

-- CRM Automations
CREATE TABLE IF NOT EXISTS crm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100),
    trigger_conditions JSONB,
    actions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CRM Automation Rules
CREATE TABLE IF NOT EXISTS crm_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES crm_automations(id) ON DELETE CASCADE,
    rule_name VARCHAR(255),
    rule_order INT DEFAULT 0,
    condition_type VARCHAR(50),
    condition_field VARCHAR(100),
    condition_operator VARCHAR(50),
    condition_value TEXT,
    action_type VARCHAR(50),
    action_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CRM Triggers
CREATE TABLE IF NOT EXISTS crm_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES crm_automations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'PENDING',
    executed_at TIMESTAMP,
    result TEXT
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50),
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    target_audience JSONB,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Leads
CREATE TABLE IF NOT EXISTS campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50),
    UNIQUE(campaign_id, lead_id)
);

-- ===========================================================
-- I. PAYMENTS (2 new tables)
-- ===========================================================

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    method_name VARCHAR(100) NOT NULL,
    method_code VARCHAR(50) UNIQUE NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scholarships
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scholarship_name VARCHAR(255) NOT NULL,
    scholarship_code VARCHAR(50) UNIQUE NOT NULL,
    scholarship_type VARCHAR(50),
    discount_percentage DECIMAL(5, 2),
    discount_amount DECIMAL(12, 2),
    description TEXT,
    eligibility_criteria TEXT,
    max_recipients INT,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Scholarships
CREATE TABLE IF NOT EXISTS student_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    scholarship_id UUID REFERENCES scholarships(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    valid_from DATE,
    valid_to DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- J. PAYROLL (5 new tables)
-- ===========================================================

-- Payroll Cycles
CREATE TABLE IF NOT EXISTS payroll_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_name VARCHAR(255) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    total_amount DECIMAL(12, 2),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Salaries (links to payroll_cycles)
CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_cycle_id UUID REFERENCES payroll_cycles(id),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    base_salary DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Salary Components
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    component_type VARCHAR(100) NOT NULL,
    component_name VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Salary Payouts
CREATE TABLE IF NOT EXISTS salary_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_salary_id UUID REFERENCES teacher_salaries(id),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payout_amount DECIMAL(12, 2),
    payout_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tax Settings
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_name VARCHAR(255) NOT NULL,
    tax_type VARCHAR(100),
    tax_rate DECIMAL(5, 2),
    threshold_amount DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Overtime
CREATE TABLE IF NOT EXISTS teacher_overtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    hourly_rate DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    description TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- K. AI GATEWAY (6 new tables)
-- ===========================================================

-- AI Exam Requests
CREATE TABLE IF NOT EXISTS ai_exam_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id),
    course_id UUID REFERENCES course_programs(id),
    exam_type VARCHAR(50),
    topic TEXT,
    difficulty VARCHAR(50),
    num_questions INT,
    question_types JSONB,
    request_data JSONB,
    status VARCHAR(50) DEFAULT 'PENDING',
    requested_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Exams
CREATE TABLE IF NOT EXISTS ai_generated_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES ai_exam_requests(id),
    exam_content JSONB,
    generated_at TIMESTAMP DEFAULT NOW(),
    used_in_exam_id UUID REFERENCES exams(id),
    quality_score DECIMAL(3, 2)
);

-- AI Content Summaries
CREATE TABLE IF NOT EXISTS ai_content_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50),
    content_id UUID,
    original_content TEXT,
    summary TEXT,
    summary_language VARCHAR(10),
    generated_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat Sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_type VARCHAR(50),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    message_count INT DEFAULT 0
);

-- AI Chat Messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- AI Embeddings
CREATE TABLE IF NOT EXISTS ai_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50),
    content_id UUID,
    content_text TEXT,
    embedding_vector JSONB,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE ai_embeddings
      ALTER COLUMN embedding_vector TYPE vector(1536)
      USING NULL;
  END IF;
END $$;

-- ===========================================================
-- L. WEBSITE (4 new tables)
-- ===========================================================

-- Website Pages
CREATE TABLE IF NOT EXISTS website_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_title VARCHAR(255) NOT NULL,
    page_title_vi VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    content_vi TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Website Sections
CREATE TABLE IF NOT EXISTS website_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name VARCHAR(255) NOT NULL,
    section_key VARCHAR(100) UNIQUE NOT NULL,
    page_location VARCHAR(100),
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Website Home Sections
CREATE TABLE IF NOT EXISTS website_home_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    title_vi VARCHAR(255),
    content TEXT,
    content_vi TEXT,
    image_url TEXT,
    link_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Website Contacts (form submissions)
CREATE TABLE IF NOT EXISTS website_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    source VARCHAR(100),
    ip_address VARCHAR(50),
    status VARCHAR(50) DEFAULT 'NEW',
    replied_at TIMESTAMP,
    replied_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_contacts_status ON website_contacts(status);
CREATE INDEX IF NOT EXISTS idx_website_contacts_created ON website_contacts(created_at);

-- ===========================================================
-- M. SPORTS / PLAYCIRCLE (6 new tables)
-- ===========================================================

-- Sports Programs
CREATE TABLE IF NOT EXISTS sports_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(100),
    description TEXT,
    age_from INT,
    age_to INT,
    fee DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports Teams
CREATE TABLE IF NOT EXISTS sports_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES sports_programs(id),
    team_name VARCHAR(255) NOT NULL,
    age_group VARCHAR(50),
    max_players INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports Coaches
CREATE TABLE IF NOT EXISTS sports_coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    specialization VARCHAR(255),
    certification VARCHAR(255),
    years_experience INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports Matches
CREATE TABLE IF NOT EXISTS sports_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES sports_teams(id),
    opponent_name VARCHAR(255),
    match_date DATE,
    match_time TIME,
    location VARCHAR(255),
    result VARCHAR(50),
    score VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports Training Sessions
CREATE TABLE IF NOT EXISTS sports_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES sports_teams(id),
    coach_id UUID REFERENCES sports_coaches(id),
    session_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports Player Stats
CREATE TABLE IF NOT EXISTS sports_player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    team_id UUID REFERENCES sports_teams(id),
    match_id UUID REFERENCES sports_matches(id),
    stat_type VARCHAR(100),
    stat_value DECIMAL(10, 2),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- N. NOTIFICATIONS (1 new table)
-- ===========================================================

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    notification_types JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- O. STORAGE / MEDIA (1 new table)
-- ===========================================================

-- Files (generic file storage)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100),
    entity_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_public BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

-- ===========================================================
-- Q. FUTURE EXPANS
-- ===========================================================

-- Bookstore Items
CREATE TABLE IF NOT EXISTS bookstore_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    isbn VARCHAR(50),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    course_id UUID REFERENCES course_programs(id),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookstore Orders
CREATE TABLE IF NOT EXISTS bookstore_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id),
    parent_id UUID REFERENCES users(id),
    total_amount DECIMAL(12, 2),
    order_items JSONB,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    ordered_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP
);

-- ===========================================================
-- R. INTERNAL OPS (5 new tables)
-- ===========================================================

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    flag_name VARCHAR(255),
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INT DEFAULT 0,
    target_tenants JSONB,
    target_users JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    permissions JSONB,
    rate_limit INT,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);

-- Background Jobs
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    job_name VARCHAR(255),
    job_data JSONB,
    status VARCHAR(50) DEFAULT 'PENDING',
    priority INT DEFAULT 5,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled ON background_jobs(scheduled_at);

-- ===========================================================
-- ADD TENANT_ID TO EXISTING TABLES (Multi-tenant support)
-- ===========================================================

ALTER TABLE centers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_centers_tenant ON centers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_programs_tenant ON course_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);

-- ===========================================================
-- SEED DATA FOR NEW TABLES
-- ===========================================================

-- Insert default tenant
INSERT INTO tenants (code, name, status, subscription_plan, max_centers, max_users) VALUES
('LERA_MAIN', 'LERA Academy', 'ACTIVE', 'ENTERPRISE', 10, 1000)
ON CONFLICT (code) DO NOTHING;

-- Insert default lead statuses
INSERT INTO lead_statuses (status_name, status_name_vi, color, display_order) VALUES
('New', 'Mới', '#3B82F6', 1),
('Contacted', 'Đã liên hệ', '#8B5CF6', 2),
('Qualified', 'Đủ điều kiện', '#10B981', 3),
('Proposal Sent', 'Đã gửi đề xuất', '#F59E0B', 4),
('Negotiation', 'Đang thương lượng', '#EF4444', 5),
('Won', 'Thành công', '#059669', 6),
('Lost', 'Thất bại', '#DC2626', 7)
ON CONFLICT (status_name) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (method_name, method_code, is_online, display_order) VALUES
('Cash', 'CASH', FALSE, 1),
('Bank Transfer', 'BANK_TRANSFER', TRUE, 2),
('Credit Card', 'CREDIT_CARD', TRUE, 3),
('MoMo', 'MOMO', TRUE, 4),
('VNPay', 'VNPAY', TRUE, 5)
ON CONFLICT (method_code) DO NOTHING;

-- ===========================================================
-- MIGRATION COMPLETE - 66 TABLES ADDED
-- ===========================================================
