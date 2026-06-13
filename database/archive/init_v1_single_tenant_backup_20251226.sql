-- ===========================================================
-- LERA ACADEMY — Master Database Schema (v20 - Complete)
-- ===========================================================
-- Includes: Identity, Academy, CRM, Attendance, Exams, Payments, Website CMS
-- ===========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================================
-- SECTION 1: IDENTITY & ACCESS MANAGEMENT
-- ===========================================================

-- =============================
-- 1.1 CENTERS (Learning Centers)
-- =============================
CREATE TABLE IF NOT EXISTS centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    address TEXT,
    address_vi TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_id UUID,
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    opening_date DATE,
    capacity INT DEFAULT 500,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 1.2 ROLES
-- =============================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    display_name_vi VARCHAR(255),
    description TEXT,
    level INT DEFAULT 0,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 1.3 PERMISSIONS
-- =============================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 1.4 ROLE_PERMISSIONS (Many-to-Many)
-- =============================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- =============================
-- 1.5 USERS
-- =============================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    role_id UUID REFERENCES roles(id),
    center_id UUID REFERENCES centers(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 1.6 USER SESSIONS
-- =============================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 1.7 AUDIT LOGS
-- =============================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ===========================================================
-- SECTION 2: ACADEMY (COURSES, CLASSES, STUDENTS, TEACHERS)
-- ===========================================================

-- =============================
-- 2.1 COURSE PROGRAMS
-- =============================
CREATE TABLE IF NOT EXISTS course_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    description_vi TEXT,
    age_from INT,
    age_to INT,
    category VARCHAR(100),
    level VARCHAR(50),
    price DECIMAL(12, 2),
    image_url TEXT,
    color VARCHAR(20),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 2.2 COURSE LEVELS
-- =============================
CREATE TABLE IF NOT EXISTS course_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES course_programs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    sequence INT DEFAULT 1,
    duration_months INT DEFAULT 3,
    total_lessons INT DEFAULT 36,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 2.3 CLASSES
-- =============================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    program_id UUID REFERENCES course_programs(id),
    level_id UUID REFERENCES course_levels(id),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID,
    assistant_teacher_id UUID,
    room VARCHAR(100),
    schedule_days VARCHAR(50),
    schedule_time_start TIME,
    schedule_time_end TIME,
    start_date DATE,
    end_date DATE,
    max_students INT DEFAULT 15,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 2.4 STUDENTS
-- =============================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES users(id),
    center_id UUID REFERENCES centers(id),
    student_code VARCHAR(50) UNIQUE,
    fullname VARCHAR(255) NOT NULL,
    fullname_vi VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url TEXT,
    school_name VARCHAR(255),
    grade VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    medical_notes TEXT,
    learning_notes TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 2.5 TEACHERS
-- =============================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    center_id UUID REFERENCES centers(id),
    teacher_code VARCHAR(50) UNIQUE,
    specialization TEXT,
    qualification TEXT,
    years_of_experience INT,
    nationality VARCHAR(100),
    bio TEXT,
    bio_vi TEXT,
    hourly_rate DECIMAL(10, 2),
    contract_type VARCHAR(50),
    is_native_speaker BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 2.6 ENROLLMENTS
-- =============================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- ===========================================================
-- SECTION 3: ATTENDANCE
-- ===========================================================

-- =============================
-- 3.1 CLASS SESSIONS
-- =============================
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 3.2 ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- =============================
-- 3.3 MAKEUP SESSIONS
-- =============================
CREATE TABLE IF NOT EXISTS makeup_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_session_id UUID REFERENCES class_sessions(id),
    makeup_session_id UUID REFERENCES class_sessions(id),
    student_id UUID REFERENCES students(id),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- SECTION 4: EXAMS & ASSESSMENTS
-- ===========================================================

-- =============================
-- 4.1 EXAM TYPES
-- =============================
CREATE TABLE IF NOT EXISTS exam_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    weight DECIMAL(5, 2) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 4.2 EXAMS
-- =============================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    exam_type_id UUID REFERENCES exam_types(id),
    name VARCHAR(255) NOT NULL,
    exam_date DATE,
    max_score DECIMAL(5, 2) DEFAULT 100,
    passing_score DECIMAL(5, 2) DEFAULT 50,
    duration_minutes INT,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 4.3 EXAM RESULTS
-- =============================
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    grade VARCHAR(10),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- =============================
-- 4.4 STUDENT PROGRESS
-- =============================
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    period VARCHAR(50),
    overall_score DECIMAL(5, 2),
    attendance_rate DECIMAL(5, 2),
    homework_completion DECIMAL(5, 2),
    teacher_notes TEXT,
    parent_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- SECTION 5: CRM (LEADS & FOLLOWUPS)
-- ===========================================================

-- =============================
-- 5.1 LEAD SOURCES
-- =============================
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 5.2 LEADS
-- =============================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES centers(id),
    source_id UUID REFERENCES lead_sources(id),
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_email VARCHAR(255),
    student_name VARCHAR(255),
    student_age INT,
    interested_program_id UUID REFERENCES course_programs(id),
    preferred_schedule TEXT,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'NEW',
    assigned_to UUID REFERENCES users(id),
    converted_student_id UUID REFERENCES students(id),
    conversion_date DATE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 5.3 LEAD FOLLOWUPS
-- =============================
CREATE TABLE IF NOT EXISTS lead_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    notes TEXT,
    next_followup_date DATE,
    outcome VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 5.4 TRIAL CLASSES
-- =============================
CREATE TABLE IF NOT EXISTS trial_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    class_id UUID REFERENCES classes(id),
    trial_date DATE,
    feedback TEXT,
    rating INT,
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- SECTION 6: PAYMENTS & INVOICING
-- ===========================================================

-- =============================
-- 6.1 FEE STRUCTURES
-- =============================
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES course_programs(id),
    center_id UUID REFERENCES centers(id),
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    fee_type VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    billing_cycle VARCHAR(30),
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 6.2 DISCOUNTS
-- =============================
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    discount_type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INT,
    current_uses INT DEFAULT 0,
    min_purchase DECIMAL(12, 2),
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 6.3 INVOICES
-- =============================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id),
    center_id UUID REFERENCES centers(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_id UUID REFERENCES discounts(id),
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'PENDING',
    due_date DATE,
    paid_at TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 6.4 INVOICE ITEMS
-- =============================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    description_vi VARCHAR(255),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    fee_structure_id UUID REFERENCES fee_structures(id),
    class_id UUID REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 6.5 PAYMENTS
-- =============================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 6.6 PAYROLL
-- =============================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_salary DECIMAL(12, 2),
    teaching_hours DECIMAL(6, 2),
    hourly_rate DECIMAL(10, 2),
    teaching_amount DECIMAL(12, 2),
    bonus DECIMAL(12, 2) DEFAULT 0,
    deductions DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- SECTION 7: WEBSITE CMS
-- ===========================================================

-- =============================
-- 7.1 CMS SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS cms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    category VARCHAR(100),
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.2 CMS PAGES
-- =============================
CREATE TABLE IF NOT EXISTS cms_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_vi VARCHAR(255),
    content TEXT,
    content_vi TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.3 BLOG POSTS
-- =============================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_vi VARCHAR(255),
    excerpt TEXT,
    excerpt_vi TEXT,
    content TEXT,
    content_vi TEXT,
    featured_image TEXT,
    category VARCHAR(100),
    tags TEXT,
    author_id UUID REFERENCES users(id),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.4 TESTIMONIALS
-- =============================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_name VARCHAR(255) NOT NULL,
    parent_name_vi VARCHAR(255),
    student_name VARCHAR(255),
    student_age INT,
    program_id UUID REFERENCES course_programs(id),
    center_id UUID REFERENCES centers(id),
    rating INT DEFAULT 5,
    content TEXT NOT NULL,
    content_vi TEXT,
    avatar_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.5 MEDIA LIBRARY
-- =============================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    mime_type VARCHAR(100),
    alt_text VARCHAR(255),
    caption TEXT,
    folder VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.6 BANNERS
-- =============================
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    title_vi VARCHAR(255),
    subtitle TEXT,
    subtitle_vi TEXT,
    image_url TEXT NOT NULL,
    image_url_mobile TEXT,
    link_url TEXT,
    button_text VARCHAR(100),
    button_text_vi VARCHAR(100),
    position VARCHAR(50) DEFAULT 'homepage',
    display_order INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 7.7 FAQs
-- =============================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_vi TEXT,
    answer TEXT NOT NULL,
    answer_vi TEXT,
    category VARCHAR(100),
    display_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- SECTION 8: GAMIFICATION
-- ===========================================================

-- =============================
-- 8.1 BADGES
-- =============================
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    description TEXT,
    description_vi TEXT,
    icon_url TEXT,
    points_required INT DEFAULT 0,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 8.2 STUDENT BADGES
-- =============================
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id),
    notes TEXT,
    UNIQUE(student_id, badge_id)
);

-- =============================
-- 8.3 POINTS TRANSACTIONS
-- =============================
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- 8.4 LEADERBOARD
-- =============================
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,
    period_value VARCHAR(20) NOT NULL,
    total_points INT DEFAULT 0,
    rank INT,
    center_id UUID REFERENCES centers(id),
    class_id UUID REFERENCES classes(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, period, period_value)
);

-- ===========================================================
-- SECTION 9: NOTIFICATIONS
-- ===========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_vi VARCHAR(255),
    message TEXT NOT NULL,
    message_vi TEXT,
    type VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================================
-- INDEXES FOR PERFORMANCE
-- ===========================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_center ON users(center_id);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_center ON students(center_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON teachers(teacher_code);
CREATE INDEX IF NOT EXISTS idx_teachers_center ON teachers(center_id);
CREATE INDEX IF NOT EXISTS idx_classes_center ON classes(center_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_leads_center ON leads(center_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ===========================================================
-- SEED DATA
-- ===========================================================

INSERT INTO roles (name, display_name, display_name_vi, level, is_system_role) VALUES
('SUPER_ADMIN', 'Super Administrator', 'Quản trị viên cao cấp', 100, TRUE),
('ADMIN', 'Administrator', 'Quản trị viên', 90, TRUE),
('CENTER_MANAGER', 'Center Manager', 'Quản lý trung tâm', 80, FALSE),
('ACADEMIC_MANAGER', 'Academic Manager', 'Quản lý học vụ', 70, FALSE),
('TEACHER', 'Teacher', 'Giáo viên', 50, FALSE),
('PARENT', 'Parent', 'Phụ huynh', 20, FALSE),
('STUDENT', 'Student', 'Học sinh', 10, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (code, name, module) VALUES
('users.view', 'View Users', 'users'),
('users.create', 'Create Users', 'users'),
('users.edit', 'Edit Users', 'users'),
('users.delete', 'Delete Users', 'users'),
('students.view', 'View Students', 'students'),
('students.create', 'Create Students', 'students'),
('students.edit', 'Edit Students', 'students'),
('students.delete', 'Delete Students', 'students'),
('classes.view', 'View Classes', 'classes'),
('classes.create', 'Create Classes', 'classes'),
('classes.edit', 'Edit Classes', 'classes'),
('classes.delete', 'Delete Classes', 'classes'),
('attendance.view', 'View Attendance', 'attendance'),
('attendance.mark', 'Mark Attendance', 'attendance'),
('payments.view', 'View Payments', 'payments'),
('payments.create', 'Create Payments', 'payments'),
('cms.view', 'View CMS', 'cms'),
('cms.edit', 'Edit CMS', 'cms'),
('reports.view', 'View Reports', 'reports'),
('reports.export', 'Export Reports', 'reports')
ON CONFLICT (code) DO NOTHING;

INSERT INTO lead_sources (code, name, name_vi) VALUES
('WEBSITE', 'Website', 'Website'),
('FACEBOOK', 'Facebook', 'Facebook'),
('GOOGLE', 'Google Ads', 'Quảng cáo Google'),
('REFERRAL', 'Referral', 'Giới thiệu'),
('WALKIN', 'Walk-in', 'Đến trực tiếp'),
('PHONE', 'Phone Call', 'Điện thoại'),
('EVENT', 'Event', 'Sự kiện')
ON CONFLICT (code) DO NOTHING;

INSERT INTO exam_types (code, name, name_vi, weight) VALUES
('PLACEMENT', 'Placement Test', 'Bài kiểm tra xếp lớp', 0),
('MIDTERM', 'Midterm Exam', 'Kiểm tra giữa kỳ', 0.3),
('FINAL', 'Final Exam', 'Kiểm tra cuối kỳ', 0.5),
('QUIZ', 'Quiz', 'Bài kiểm tra ngắn', 0.1),
('HOMEWORK', 'Homework', 'Bài tập về nhà', 0.1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO course_programs (code, name, name_vi, description, description_vi, age_from, age_to, category, level, is_featured, is_active, display_order) VALUES
('STARTERS', 'LERA Starters', 'LERA Khởi đầu', 'Foundation English for young learners', 'Tiếng Anh nền tảng cho trẻ nhỏ', 4, 6, 'kids', 'beginner', TRUE, TRUE, 1),
('EXPLORERS', 'LERA Explorers', 'LERA Khám phá', 'Interactive English exploration for children', 'Khám phá Tiếng Anh tương tác cho trẻ em', 7, 9, 'kids', 'elementary', TRUE, TRUE, 2),
('PRIMARY', 'LERA Primary', 'LERA Tiểu học', 'Comprehensive English for primary students', 'Tiếng Anh toàn diện cho học sinh tiểu học', 10, 12, 'kids', 'intermediate', TRUE, TRUE, 3),
('TEENS', 'LERA Teens', 'LERA Thiếu niên', 'English mastery for teenagers', 'Thành thạo Tiếng Anh cho thanh thiếu niên', 13, 17, 'teens', 'intermediate', TRUE, TRUE, 4),
('IELTS_SAT', 'IELTS & SAT Prep', 'Luyện thi IELTS & SAT', 'Intensive exam preparation', 'Luyện thi chuyên sâu', 15, 99, 'exam', 'advanced', TRUE, TRUE, 5),
('BUSINESS', 'Business English', 'Tiếng Anh Doanh nghiệp', 'Professional English for adults', 'Tiếng Anh chuyên nghiệp cho người lớn', 18, 99, 'adult', 'all', TRUE, TRUE, 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO centers (code, name, name_vi, address, city, district, phone, email, status) VALUES
('MAIN', 'LERA Academy Main Center', 'Trung tâm LERA Academy', '123 Education Street, District 1', 'Ho Chi Minh City', 'District 1', '+84 28 1234 5678', 'info@lera.edu.vn', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cms_settings (setting_key, setting_value, setting_type, category) VALUES
('site_name', 'LERA Academy', 'text', 'general'),
('site_name_vi', 'Học viện LERA', 'text', 'general'),
('site_tagline', 'Learn English, Reach Achievement', 'text', 'general'),
('site_tagline_vi', 'Học Tiếng Anh, Đạt Thành Tựu', 'text', 'general'),
('contact_phone', '+84 28 1234 5678', 'text', 'contact'),
('contact_email', 'info@lera.edu.vn', 'text', 'contact'),
('contact_address', '123 Education Street, District 1, Ho Chi Minh City', 'text', 'contact'),
('facebook_url', 'https://facebook.com/leraacademy', 'url', 'social'),
('instagram_url', 'https://instagram.com/leraacademy', 'url', 'social'),
('youtube_url', 'https://youtube.com/leraacademy', 'url', 'social'),
('primary_color', '#0a1a5c', 'color', 'branding'),
('secondary_color', '#1e40af', 'color', 'branding')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO badges (code, name, name_vi, description, description_vi, category, points_required) VALUES
('FIRST_DAY', 'First Day', 'Ngày đầu tiên', 'Completed first day of class', 'Hoàn thành ngày học đầu tiên', 'milestone', 0),
('PERFECT_ATTENDANCE', 'Perfect Attendance', 'Đi học đầy đủ', '100% attendance for a month', 'Đi học đầy đủ 100% trong tháng', 'attendance', 100),
('HOMEWORK_HERO', 'Homework Hero', 'Anh hùng bài tập', 'Completed all homework for a month', 'Hoàn thành tất cả bài tập trong tháng', 'academic', 100),
('STAR_STUDENT', 'Star Student', 'Học sinh xuất sắc', 'Top performer in class', 'Học sinh xuất sắc nhất lớp', 'academic', 500),
('LEVEL_UP', 'Level Up', 'Lên cấp', 'Completed a course level', 'Hoàn thành một cấp độ khóa học', 'milestone', 200)
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (email, password_hash, fullname, fullname_vi, phone, role_id, status, email_verified)
SELECT 
    'admin@lera.com',
    '$2a$10$EFMnDEQP3hLOOheot6JR8e51PXcuwYJHYRE40QTNgusprMtb21EYe',
    'Super Administrator',
    'Quản trị viên cao cấp',
    '+84 901234567',
    (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'),
    'ACTIVE',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@lera.com');
