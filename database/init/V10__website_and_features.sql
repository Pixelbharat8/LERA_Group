-- V10: Website CMS and Additional Features Tables
-- Migration for Website Management, Blogs, and Feature Flags

-- Banners
CREATE TABLE IF NOT EXISTS banners (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    mobile_image_url VARCHAR(500),
    link_url VARCHAR(500),
    link_target VARCHAR(20) DEFAULT '_self', -- '_self', '_blank'
    button_text VARCHAR(100),
    position VARCHAR(50), -- 'hero', 'sidebar', 'footer', 'popup'
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
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'scheduled', 'archived'
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

-- Stories (Instagram-like stories)
CREATE TABLE IF NOT EXISTS stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    content_type VARCHAR(50), -- 'image', 'video', 'text'
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
    role VARCHAR(100), -- 'student', 'parent', 'teacher', 'alumni'
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
    environment VARCHAR(50) DEFAULT 'all', -- 'development', 'staging', 'production', 'all'
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

-- Point Transactions (gamification)
CREATE TABLE IF NOT EXISTS point_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    student_id BIGINT REFERENCES students(id),
    transaction_type VARCHAR(50), -- 'earn', 'redeem', 'expire', 'adjust'
    points INTEGER NOT NULL,
    balance_after INTEGER,
    category VARCHAR(100), -- 'attendance', 'assignment', 'exam', 'activity', 'behavior'
    reference_type VARCHAR(100),
    reference_id BIGINT,
    description TEXT,
    metadata JSONB,
    expires_at TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Points (summary)
CREATE TABLE IF NOT EXISTS student_points (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    total_expired INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    lifetime_balance INTEGER DEFAULT 0,
    level VARCHAR(50) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
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
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
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
    exception_type VARCHAR(50), -- 'cancelled', 'rescheduled', 'substitute'
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
    session_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'makeup', 'extra', 'exam'
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    attendance_marked BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bonuses (payroll)
CREATE TABLE IF NOT EXISTS bonuses (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES users(id),
    teacher_id BIGINT REFERENCES teachers(id),
    bonus_type VARCHAR(100), -- 'performance', 'festival', 'annual', 'special', 'referral'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payroll_cycle_id BIGINT REFERENCES payroll_cycles(id),
    reason TEXT,
    performance_metrics JSONB,
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
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
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'paid', 'rejected'
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
    leave_type VARCHAR(50), -- 'annual', 'sick', 'personal', 'maternity', 'paternity'
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

-- Indexes
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_active ON banners(is_active);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_testimonials_role ON testimonials(role);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_student ON point_transactions(student_id);
CREATE INDEX idx_student_points_student ON student_points(student_id);
CREATE INDEX idx_class_sessions_class ON class_sessions(class_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_bonuses_employee ON bonuses(employee_id);
CREATE INDEX idx_bonuses_cycle ON bonuses(payroll_cycle_id);
CREATE INDEX idx_payroll_records_employee ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_cycle ON payroll_records(payroll_cycle_id);
CREATE INDEX idx_leave_balance_employee ON leave_balance_accruals(employee_id);
