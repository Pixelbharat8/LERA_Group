-- V11: Fix All Errors and Add Missing Tables
-- This script fixes type mismatches and adds missing tables

-- =====================================================
-- FIX TYPE MISMATCHES - Create tables without foreign keys
-- =====================================================

-- Reading Lists (without FK to users - will work with any user type)
CREATE TABLE IF NOT EXISTS reading_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(50), -- Use VARCHAR to be compatible with both UUID and BIGINT
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading List Items
CREATE TABLE IF NOT EXISTS reading_list_items (
    id BIGSERIAL PRIMARY KEY,
    reading_list_id BIGINT REFERENCES reading_lists(id) ON DELETE CASCADE,
    book_id BIGINT,
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Logs (without FK - using VARCHAR for route_id)
CREATE TABLE IF NOT EXISTS trip_logs (
    id BIGSERIAL PRIMARY KEY,
    route_id VARCHAR(50),
    vehicle_id BIGINT,
    driver_id BIGINT,
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

-- Transport Notifications (without FK - using VARCHAR for student_id)
CREATE TABLE IF NOT EXISTS transport_notifications (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50),
    parent_id VARCHAR(50),
    notification_type VARCHAR(50),
    message TEXT,
    sent_via VARCHAR(50),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB
);

-- Payroll Records (without FK - using VARCHAR for employee_id)
CREATE TABLE IF NOT EXISTS payroll_records (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50),
    teacher_id BIGINT,
    payroll_cycle_id BIGINT,
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
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add tenant_id to audit_logs if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'tenant_id') THEN
        ALTER TABLE audit_logs ADD COLUMN tenant_id BIGINT;
    END IF;
END $$;

-- Add login_status to login_history if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'login_history' AND column_name = 'login_status') THEN
        ALTER TABLE login_history ADD COLUMN login_status VARCHAR(50);
    END IF;
END $$;

-- Add borrower_id to book_borrowings if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_borrowings' AND column_name = 'borrower_id') THEN
        ALTER TABLE book_borrowings ADD COLUMN borrower_id VARCHAR(50);
    END IF;
END $$;

-- Add user_id to book_reservations if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_reservations' AND column_name = 'user_id') THEN
        ALTER TABLE book_reservations ADD COLUMN user_id VARCHAR(50);
    END IF;
END $$;

-- Add user_id to library_fines if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'library_fines' AND column_name = 'user_id') THEN
        ALTER TABLE library_fines ADD COLUMN user_id VARCHAR(50);
    END IF;
END $$;

-- Add center_id to sport_teams if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sport_teams' AND column_name = 'center_id') THEN
        ALTER TABLE sport_teams ADD COLUMN center_id BIGINT;
    END IF;
END $$;

-- Add student_id to player_statistics if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_statistics' AND column_name = 'student_id') THEN
        ALTER TABLE player_statistics ADD COLUMN student_id VARCHAR(50);
    END IF;
END $$;

-- Add center_id to vehicles if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'center_id') THEN
        ALTER TABLE vehicles ADD COLUMN center_id BIGINT;
    END IF;
END $$;

-- Add service_date to vehicle_maintenance if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_maintenance' AND column_name = 'service_date') THEN
        ALTER TABLE vehicle_maintenance ADD COLUMN service_date DATE;
    END IF;
END $$;

-- Add center_id to transport_routes if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport_routes' AND column_name = 'center_id') THEN
        ALTER TABLE transport_routes ADD COLUMN center_id BIGINT;
    END IF;
END $$;

-- Add student_id to transport_attendance if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport_attendance' AND column_name = 'student_id') THEN
        ALTER TABLE transport_attendance ADD COLUMN student_id VARCHAR(50);
    END IF;
END $$;

-- Add recorded_at to gps_tracking if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gps_tracking' AND column_name = 'recorded_at') THEN
        ALTER TABLE gps_tracking ADD COLUMN recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add role to testimonials if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'role') THEN
        ALTER TABLE testimonials ADD COLUMN role VARCHAR(100);
    END IF;
END $$;

-- Add feature_key to feature_flags if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feature_flags' AND column_name = 'feature_key') THEN
        ALTER TABLE feature_flags ADD COLUMN feature_key VARCHAR(100);
    END IF;
END $$;

-- Add user_id to point_transactions if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'point_transactions' AND column_name = 'user_id') THEN
        ALTER TABLE point_transactions ADD COLUMN user_id VARCHAR(50);
    END IF;
END $$;

-- Add employee_id to bonuses if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bonuses' AND column_name = 'employee_id') THEN
        ALTER TABLE bonuses ADD COLUMN employee_id VARCHAR(50);
    END IF;
END $$;

-- Add employee_id to leave_balance_accruals if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_balance_accruals' AND column_name = 'employee_id') THEN
        ALTER TABLE leave_balance_accruals ADD COLUMN employee_id VARCHAR(50);
    END IF;
END $$;

-- =====================================================
-- ADDITIONAL MISSING TABLES FOR FRONTEND FEATURES
-- =====================================================

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal',
    target_audience VARCHAR(100),
    target_roles JSONB,
    target_centers JSONB,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    attachment_url VARCHAR(500),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP,
    location VARCHAR(500),
    is_online BOOLEAN DEFAULT false,
    online_link VARCHAR(500),
    max_participants INTEGER,
    registration_deadline TIMESTAMP,
    is_public BOOLEAN DEFAULT true,
    cover_image_url VARCHAR(500),
    organizer_id VARCHAR(50),
    center_id BIGINT,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'registered',
    attended BOOLEAN DEFAULT false,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'public',
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    applies_to JSONB,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id BIGSERIAL PRIMARY KEY,
    academic_year_id BIGINT REFERENCES academic_years(id),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grades/Levels
CREATE TABLE IF NOT EXISTS grades (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    level_order INTEGER,
    description TEXT,
    min_age INTEGER,
    max_age INTEGER,
    is_active BOOLEAN DEFAULT true,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_id BIGINT REFERENCES grades(id),
    class_id BIGINT,
    capacity INTEGER,
    class_teacher_id BIGINT,
    room VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    credits INTEGER,
    hours_per_week INTEGER,
    subject_type VARCHAR(50),
    grade_id BIGINT REFERENCES grades(id),
    is_mandatory BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT,
    section_id BIGINT REFERENCES sections(id),
    subject_id BIGINT REFERENCES subjects(id),
    teacher_id BIGINT,
    day_of_week VARCHAR(20),
    start_time TIME,
    end_time TIME,
    room VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homework
CREATE TABLE IF NOT EXISTS homework (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    class_id BIGINT,
    subject_id BIGINT REFERENCES subjects(id),
    teacher_id BIGINT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    max_marks INTEGER,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homework Submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
    id BIGSERIAL PRIMARY KEY,
    homework_id BIGINT REFERENCES homework(id) ON DELETE CASCADE,
    student_id VARCHAR(50),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    attachments JSONB,
    marks_obtained INTEGER,
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    graded_by BIGINT,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Messages
CREATE TABLE IF NOT EXISTS parent_messages (
    id BIGSERIAL PRIMARY KEY,
    parent_id VARCHAR(50),
    teacher_id BIGINT,
    student_id VARCHAR(50),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    replied_to_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Cards
CREATE TABLE IF NOT EXISTS report_cards (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50),
    academic_year_id BIGINT REFERENCES academic_years(id),
    semester_id BIGINT REFERENCES semesters(id),
    class_id BIGINT,
    total_marks DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(10),
    rank INTEGER,
    attendance_percentage DECIMAL(5,2),
    teacher_remarks TEXT,
    principal_remarks TEXT,
    generated_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Card Details
CREATE TABLE IF NOT EXISTS report_card_details (
    id BIGSERIAL PRIMARY KEY,
    report_card_id BIGINT REFERENCES report_cards(id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(id),
    marks_obtained DECIMAL(10,2),
    max_marks DECIMAL(10,2),
    grade VARCHAR(10),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    academic_year_id BIGINT REFERENCES academic_years(id),
    grade_id BIGINT REFERENCES grades(id),
    amount DECIMAL(12,2) NOT NULL,
    frequency VARCHAR(50),
    due_day INTEGER,
    late_fee_amount DECIMAL(12,2),
    late_fee_type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Fees
CREATE TABLE IF NOT EXISTS student_fees (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50),
    fee_structure_id BIGINT REFERENCES fee_structures(id),
    amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    late_fee DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitor Logs
CREATE TABLE IF NOT EXISTS visitor_logs (
    id BIGSERIAL PRIMARY KEY,
    visitor_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    purpose VARCHAR(255),
    whom_to_meet VARCHAR(255),
    department VARCHAR(100),
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    id_proof_type VARCHAR(100),
    id_proof_number VARCHAR(100),
    visitor_photo_url VARCHAR(500),
    badge_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'checked_in',
    remarks TEXT,
    center_id BIGINT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_type VARCHAR(50),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER,
    reason TEXT,
    attachment_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints/Grievances
CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    complainant_id VARCHAR(50),
    complainant_type VARCHAR(50),
    category VARCHAR(100),
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(50),
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(50),
    attachments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_type VARCHAR(50),
    category VARCHAR(100),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'new',
    response TEXT,
    responded_by VARCHAR(50),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Circular/Notices
CREATE TABLE IF NOT EXISTS circulars (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    circular_number VARCHAR(50),
    circular_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    target_audience JSONB,
    attachment_url VARCHAR(500),
    is_important BOOLEAN DEFAULT false,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(50),
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(100),
    description TEXT,
    unit VARCHAR(50),
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    unit_price DECIMAL(12,2),
    location VARCHAR(255),
    supplier VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    last_restocked_at TIMESTAMP,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES inventory_items(id),
    transaction_type VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    reference_type VARCHAR(100),
    reference_id BIGINT,
    notes TEXT,
    performed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    asset_code VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    depreciation_rate DECIMAL(5,2),
    warranty_expiry DATE,
    vendor VARCHAR(255),
    location VARCHAR(255),
    assigned_to VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    condition VARCHAR(50) DEFAULT 'good',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    images JSONB,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hostel Rooms
CREATE TABLE IF NOT EXISTS hostel_rooms (
    id BIGSERIAL PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL,
    hostel_name VARCHAR(255),
    floor INTEGER,
    room_type VARCHAR(50),
    capacity INTEGER DEFAULT 1,
    occupied INTEGER DEFAULT 0,
    amenities JSONB,
    monthly_rent DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'available',
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hostel Allocations
CREATE TABLE IF NOT EXISTS hostel_allocations (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT REFERENCES hostel_rooms(id),
    student_id VARCHAR(50),
    bed_number VARCHAR(20),
    allocation_date DATE DEFAULT CURRENT_DATE,
    vacate_date DATE,
    monthly_rent DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Menu
CREATE TABLE IF NOT EXISTS canteen_menu (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_vegetarian BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    available_days JSONB,
    meal_type VARCHAR(50),
    calories INTEGER,
    allergens JSONB,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Orders
CREATE TABLE IF NOT EXISTS canteen_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_type VARCHAR(50),
    order_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canteen Order Items
CREATE TABLE IF NOT EXISTS canteen_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES canteen_orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT REFERENCES canteen_menu(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital ID Cards
CREATE TABLE IF NOT EXISTS digital_id_cards (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_type VARCHAR(50),
    card_number VARCHAR(50) UNIQUE,
    qr_code VARCHAR(500),
    barcode VARCHAR(100),
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    template_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Biometric Devices
CREATE TABLE IF NOT EXISTS biometric_devices (
    id BIGSERIAL PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(100) UNIQUE,
    device_type VARCHAR(50),
    location VARCHAR(255),
    ip_address VARCHAR(50),
    port INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    last_sync TIMESTAMP,
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Biometric Attendance
CREATE TABLE IF NOT EXISTS biometric_attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    user_type VARCHAR(50),
    device_id BIGINT REFERENCES biometric_devices(id),
    punch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    punch_type VARCHAR(20),
    verification_type VARCHAR(50),
    temperature DECIMAL(4,1),
    location VARCHAR(255),
    sync_status VARCHAR(50) DEFAULT 'synced',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50),
    content TEXT NOT NULL,
    variables JSONB,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables JSONB,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push Notification Templates
CREATE TABLE IF NOT EXISTS push_notification_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    body TEXT NOT NULL,
    image_url VARCHAR(500),
    action_url VARCHAR(500),
    variables JSONB,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Devices (for push notifications)
CREATE TABLE IF NOT EXISTS user_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admission Applications
CREATE TABLE IF NOT EXISTS admission_applications (
    id BIGSERIAL PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    grade_applying_for BIGINT REFERENCES grades(id),
    previous_school VARCHAR(255),
    previous_grade VARCHAR(100),
    father_name VARCHAR(255),
    father_phone VARCHAR(50),
    father_email VARCHAR(255),
    father_occupation VARCHAR(255),
    mother_name VARCHAR(255),
    mother_phone VARCHAR(50),
    mother_email VARCHAR(255),
    mother_occupation VARCHAR(255),
    documents JSONB,
    status VARCHAR(50) DEFAULT 'submitted',
    remarks TEXT,
    processed_by VARCHAR(50),
    processed_at TIMESTAMP,
    academic_year_id BIGINT REFERENCES academic_years(id),
    center_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admission Tests
CREATE TABLE IF NOT EXISTS admission_tests (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT REFERENCES admission_applications(id),
    test_date TIMESTAMP,
    test_type VARCHAR(100),
    subjects JSONB,
    total_marks INTEGER,
    obtained_marks INTEGER,
    percentage DECIMAL(5,2),
    result VARCHAR(50),
    remarks TEXT,
    conducted_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Classes
CREATE TABLE IF NOT EXISTS online_classes (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT,
    subject_id BIGINT REFERENCES subjects(id),
    teacher_id BIGINT,
    title VARCHAR(500),
    description TEXT,
    meeting_link VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    platform VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    recording_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled',
    max_participants INTEGER,
    actual_participants INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Class Attendance
CREATE TABLE IF NOT EXISTS online_class_attendance (
    id BIGSERIAL PRIMARY KEY,
    online_class_id BIGINT REFERENCES online_classes(id) ON DELETE CASCADE,
    student_id VARCHAR(50),
    join_time TIMESTAMP,
    leave_time TIMESTAMP,
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(id),
    class_id BIGINT,
    teacher_id BIGINT,
    material_type VARCHAR(50),
    file_url VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(100),
    thumbnail_url VARCHAR(500),
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subjects(id),
    topic VARCHAR(255),
    question_type VARCHAR(50),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    difficulty_level VARCHAR(50),
    tags JSONB,
    created_by BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Exams
CREATE TABLE IF NOT EXISTS online_exams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    subject_id BIGINT REFERENCES subjects(id),
    class_id BIGINT,
    exam_type VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    total_marks INTEGER,
    passing_marks INTEGER,
    instructions TEXT,
    is_randomized BOOLEAN DEFAULT false,
    show_result_immediately BOOLEAN DEFAULT true,
    allow_review BOOLEAN DEFAULT true,
    attempts_allowed INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Exam Questions
CREATE TABLE IF NOT EXISTS online_exam_questions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT REFERENCES online_exams(id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES question_bank(id),
    question_order INTEGER,
    marks INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Exam Attempts
CREATE TABLE IF NOT EXISTS online_exam_attempts (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT REFERENCES online_exams(id),
    student_id VARCHAR(50),
    attempt_number INTEGER DEFAULT 1,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    submitted_at TIMESTAMP,
    total_marks_obtained DECIMAL(10,2),
    percentage DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'in_progress',
    ip_address VARCHAR(50),
    browser_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Online Exam Answers
CREATE TABLE IF NOT EXISTS online_exam_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT REFERENCES online_exam_attempts(id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES question_bank(id),
    answer TEXT,
    is_correct BOOLEAN,
    marks_obtained DECIMAL(5,2),
    time_spent_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CREATE MISSING INDEXES (with IF NOT EXISTS)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_academic_years_current ON academic_years(is_current);
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_grades_center ON grades(center_id);
CREATE INDEX IF NOT EXISTS idx_sections_grade ON sections(grade_id);
CREATE INDEX IF NOT EXISTS idx_subjects_grade ON subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_grade ON fee_structures(grade_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_date ON visitor_logs(check_in_time);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_circulars_date ON circulars(circular_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_hostel_rooms_status ON hostel_rooms(status);
CREATE INDEX IF NOT EXISTS idx_canteen_orders_date ON canteen_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_digital_id_cards_user ON digital_id_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_user ON biometric_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_time ON biometric_attendance(punch_time);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_admission_applications_status ON admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_online_classes_status ON online_classes(status);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_online_exams_status ON online_exams(status);
CREATE INDEX IF NOT EXISTS idx_reading_lists_user ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_date ON trip_logs(trip_date);
CREATE INDEX IF NOT EXISTS idx_transport_notifications_student ON transport_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON payroll_records(employee_id);

-- =====================================================
-- FINAL GRANTS
-- =====================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lera;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lera;

SELECT 'V11: All errors fixed and missing tables added! Total: ~220 tables' as status;
