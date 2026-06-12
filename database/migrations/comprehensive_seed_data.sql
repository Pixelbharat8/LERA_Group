-- Comprehensive Seed Data for LERA Group
-- This seeds all major tables with realistic data

-- ============================================
-- COURSES
-- ============================================
INSERT INTO courses (id, course_code, course_name, description, duration_hours, fee, status, category, level, created_at) VALUES
('c1000001-0000-0000-0000-000000000001'::uuid, 'ENG101', 'English Fundamentals', 'Basic English for beginners covering grammar, vocabulary, and speaking', 60, 2500000, 'ACTIVE', 'English', 'Beginner', NOW()),
('c1000001-0000-0000-0000-000000000002'::uuid, 'ENG201', 'Intermediate English', 'Intermediate level English focusing on conversation and writing', 80, 3500000, 'ACTIVE', 'English', 'Intermediate', NOW()),
('c1000001-0000-0000-0000-000000000003'::uuid, 'ENG301', 'Advanced Communication', 'Advanced English for professional communication', 100, 4500000, 'ACTIVE', 'English', 'Advanced', NOW()),
('c1000001-0000-0000-0000-000000000004'::uuid, 'IELTS101', 'IELTS Preparation', 'Complete IELTS exam preparation course', 120, 6000000, 'ACTIVE', 'IELTS', 'Intermediate', NOW()),
('c1000001-0000-0000-0000-000000000005'::uuid, 'TOEIC101', 'TOEIC Preparation', 'TOEIC exam preparation and practice', 80, 4000000, 'ACTIVE', 'TOEIC', 'Intermediate', NOW()),
('c1000001-0000-0000-0000-000000000006'::uuid, 'BUS101', 'Business English', 'English for business professionals', 60, 5000000, 'ACTIVE', 'Business', 'Intermediate', NOW()),
('c1000001-0000-0000-0000-000000000007'::uuid, 'KIDS101', 'English for Kids', 'Fun English learning for children ages 6-10', 48, 2000000, 'ACTIVE', 'Kids', 'Beginner', NOW()),
('c1000001-0000-0000-0000-000000000008'::uuid, 'SPEAK101', 'Speaking Mastery', 'Intensive speaking practice and pronunciation', 40, 3000000, 'ACTIVE', 'Speaking', 'All Levels', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEACHERS (additional)
-- ============================================
INSERT INTO teachers (id, user_id, full_name, email, phone, specialization, qualification, experience_years, status, created_at) VALUES
('t1000001-0000-0000-0000-000000000001'::uuid, NULL, 'Nguyễn Thị Lan', 'lan.nguyen@lera.edu.vn', '0901234567', 'IELTS, English Speaking', 'MA in Applied Linguistics', 8, 'ACTIVE', NOW()),
('t1000001-0000-0000-0000-000000000002'::uuid, NULL, 'Trần Văn Minh', 'minh.tran@lera.edu.vn', '0912345678', 'Business English, TOEIC', 'MBA, TESOL Certified', 6, 'ACTIVE', NOW()),
('t1000001-0000-0000-0000-000000000003'::uuid, NULL, 'Lê Thị Hương', 'huong.le@lera.edu.vn', '0923456789', 'Kids English, Grammar', 'BA in Education', 4, 'ACTIVE', NOW()),
('t1000001-0000-0000-0000-000000000004'::uuid, NULL, 'Phạm Văn Đức', 'duc.pham@lera.edu.vn', '0934567890', 'Academic Writing, IELTS', 'PhD in English Literature', 10, 'ACTIVE', NOW()),
('t1000001-0000-0000-0000-000000000005'::uuid, NULL, 'Võ Thanh Hà', 'ha.vo@lera.edu.vn', '0945678901', 'Pronunciation, Speaking', 'MA TESOL', 5, 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STUDENTS (additional)
-- ============================================
INSERT INTO students (id, user_id, student_code, full_name, email, phone, date_of_birth, gender, address, status, enrollment_date, created_at) VALUES
('s1000001-0000-0000-0000-000000000001'::uuid, NULL, 'STU2024001', 'Nguyễn Minh Anh', 'minhanh@email.com', '0901111111', '2005-03-15', 'Female', '123 Nguyen Hue, District 1, HCMC', 'ACTIVE', '2024-01-15', NOW()),
('s1000001-0000-0000-0000-000000000002'::uuid, NULL, 'STU2024002', 'Trần Hoàng Nam', 'hoangnam@email.com', '0902222222', '2006-07-20', 'Male', '456 Le Loi, District 3, HCMC', 'ACTIVE', '2024-01-20', NOW()),
('s1000001-0000-0000-0000-000000000003'::uuid, NULL, 'STU2024003', 'Lê Thị Mai', 'mai.le@email.com', '0903333333', '2004-11-10', 'Female', '789 Tran Hung Dao, District 5, HCMC', 'ACTIVE', '2024-02-01', NOW()),
('s1000001-0000-0000-0000-000000000004'::uuid, NULL, 'STU2024004', 'Phạm Văn Đức', 'duc.pham.student@email.com', '0904444444', '2005-05-25', 'Male', '321 Hai Ba Trung, District 1, HCMC', 'ACTIVE', '2024-02-10', NOW()),
('s1000001-0000-0000-0000-000000000005'::uuid, NULL, 'STU2024005', 'Võ Thanh Hà', 'ha.vo.student@email.com', '0905555555', '2006-09-05', 'Female', '654 Nguyen Trai, District 5, HCMC', 'ACTIVE', '2024-02-15', NOW()),
('s1000001-0000-0000-0000-000000000006'::uuid, NULL, 'STU2024006', 'Hoàng Minh Tú', 'tu.hoang@email.com', '0906666666', '2005-01-12', 'Male', '987 Vo Van Tan, District 3, HCMC', 'ACTIVE', '2024-03-01', NOW()),
('s1000001-0000-0000-0000-000000000007'::uuid, NULL, 'STU2024007', 'Đặng Thị Lan', 'lan.dang@email.com', '0907777777', '2004-08-30', 'Female', '147 Cach Mang Thang 8, District 10, HCMC', 'ACTIVE', '2024-03-05', NOW()),
('s1000001-0000-0000-0000-000000000008'::uuid, NULL, 'STU2024008', 'Bùi Văn Hải', 'hai.bui@email.com', '0908888888', '2006-04-18', 'Male', '258 Nguyen Dinh Chieu, District 3, HCMC', 'ACTIVE', '2024-03-10', NOW()),
('s1000001-0000-0000-0000-000000000009'::uuid, NULL, 'STU2024009', 'Ngô Thị Hồng', 'hong.ngo@email.com', '0909999999', '2005-12-22', 'Female', '369 Le Van Sy, Phu Nhuan, HCMC', 'ACTIVE', '2024-03-15', NOW()),
('s1000001-0000-0000-0000-000000000010'::uuid, NULL, 'STU2024010', 'Trương Minh Khôi', 'khoi.truong@email.com', '0910000001', '2004-06-08', 'Male', '741 Phan Xich Long, Phu Nhuan, HCMC', 'ACTIVE', '2024-03-20', NOW()),
('s1000001-0000-0000-0000-000000000011'::uuid, NULL, 'STU2024011', 'Lý Thị Ngọc', 'ngoc.ly@email.com', '0910000002', '2006-02-14', 'Female', '852 Nguyen Van Troi, Phu Nhuan, HCMC', 'ACTIVE', '2024-04-01', NOW()),
('s1000001-0000-0000-0000-000000000012'::uuid, NULL, 'STU2024012', 'Đinh Văn Phong', 'phong.dinh@email.com', '0910000003', '2005-10-28', 'Male', '963 Hoang Van Thu, Tan Binh, HCMC', 'ACTIVE', '2024-04-05', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CLASSES (additional with proper references)
-- ============================================
INSERT INTO classes (id, class_name, course_id, teacher_id, room, capacity, enrolled_count, schedule, start_date, end_date, status, created_at) VALUES
('cl100001-0000-0000-0000-000000000001'::uuid, 'English Beginners A', 'c1000001-0000-0000-0000-000000000001'::uuid, 't1000001-0000-0000-0000-000000000001'::uuid, 'Room 101', 25, 22, 'Mon, Wed, Fri 9:00-10:30', '2026-01-06', '2026-04-30', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000002'::uuid, 'English Beginners B', 'c1000001-0000-0000-0000-000000000001'::uuid, 't1000001-0000-0000-0000-000000000003'::uuid, 'Room 102', 20, 18, 'Tue, Thu 14:00-15:30', '2026-01-07', '2026-05-15', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000003'::uuid, 'IELTS Prep Morning', 'c1000001-0000-0000-0000-000000000004'::uuid, 't1000001-0000-0000-0000-000000000004'::uuid, 'Room 201', 15, 12, 'Mon, Wed, Fri 8:00-10:00', '2026-01-06', '2026-06-30', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000004'::uuid, 'IELTS Prep Evening', 'c1000001-0000-0000-0000-000000000004'::uuid, 't1000001-0000-0000-0000-000000000001'::uuid, 'Room 202', 15, 14, 'Tue, Thu 18:00-20:00', '2026-01-07', '2026-06-30', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000005'::uuid, 'Business English', 'c1000001-0000-0000-0000-000000000006'::uuid, 't1000001-0000-0000-0000-000000000002'::uuid, 'Room 301', 12, 10, 'Sat 9:00-12:00', '2026-01-11', '2026-04-26', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000006'::uuid, 'Speaking Mastery', 'c1000001-0000-0000-0000-000000000008'::uuid, 't1000001-0000-0000-0000-000000000005'::uuid, 'Room 103', 10, 8, 'Wed, Fri 16:00-17:30', '2026-01-08', '2026-03-28', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000007'::uuid, 'Kids English Fun', 'c1000001-0000-0000-0000-000000000007'::uuid, 't1000001-0000-0000-0000-000000000003'::uuid, 'Room 104', 15, 12, 'Sat, Sun 9:00-10:30', '2026-01-11', '2026-05-31', 'ACTIVE', NOW()),
('cl100001-0000-0000-0000-000000000008'::uuid, 'Advanced Communication', 'c1000001-0000-0000-0000-000000000003'::uuid, 't1000001-0000-0000-0000-000000000004'::uuid, 'Room 203', 20, 16, 'Mon, Thu 19:00-21:00', '2026-01-06', '2026-05-29', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ENROLLMENTS
-- ============================================
INSERT INTO enrollments (id, student_id, class_id, enrollment_date, status, created_at) VALUES
('e1000001-0000-0000-0000-000000000001'::uuid, 's1000001-0000-0000-0000-000000000001'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, '2024-01-15', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000002'::uuid, 's1000001-0000-0000-0000-000000000002'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, '2024-01-20', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000003'::uuid, 's1000001-0000-0000-0000-000000000003'::uuid, 'cl100001-0000-0000-0000-000000000003'::uuid, '2024-02-01', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000004'::uuid, 's1000001-0000-0000-0000-000000000004'::uuid, 'cl100001-0000-0000-0000-000000000003'::uuid, '2024-02-10', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000005'::uuid, 's1000001-0000-0000-0000-000000000005'::uuid, 'cl100001-0000-0000-0000-000000000004'::uuid, '2024-02-15', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000006'::uuid, 's1000001-0000-0000-0000-000000000006'::uuid, 'cl100001-0000-0000-0000-000000000005'::uuid, '2024-03-01', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000007'::uuid, 's1000001-0000-0000-0000-000000000007'::uuid, 'cl100001-0000-0000-0000-000000000006'::uuid, '2024-03-05', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000008'::uuid, 's1000001-0000-0000-0000-000000000008'::uuid, 'cl100001-0000-0000-0000-000000000002'::uuid, '2024-03-10', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000009'::uuid, 's1000001-0000-0000-0000-000000000009'::uuid, 'cl100001-0000-0000-0000-000000000007'::uuid, '2024-03-15', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000010'::uuid, 's1000001-0000-0000-0000-000000000010'::uuid, 'cl100001-0000-0000-0000-000000000008'::uuid, '2024-03-20', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000011'::uuid, 's1000001-0000-0000-0000-000000000011'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, '2024-04-01', 'ACTIVE', NOW()),
('e1000001-0000-0000-0000-000000000012'::uuid, 's1000001-0000-0000-0000-000000000012'::uuid, 'cl100001-0000-0000-0000-000000000004'::uuid, '2024-04-05', 'ACTIVE', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LEADS (additional)
-- ============================================
INSERT INTO leads (id, parent_name, parent_phone, parent_email, student_name, student_age, notes, utm_source, utm_medium, utm_campaign, status, created_at) VALUES
('ld100001-0000-0000-0000-000000000001'::uuid, 'Nguyễn Văn A', '0911111111', 'nguyen.a@email.com', 'Nguyễn Thị B', 12, 'Interested in IELTS preparation', 'Facebook', 'Paid', 'IELTS_Jan2026', 'NEW', NOW() - INTERVAL '2 days'),
('ld100001-0000-0000-0000-000000000002'::uuid, 'Trần Thị C', '0922222222', 'tran.c@email.com', 'Trần Văn D', 15, 'Looking for English speaking course', 'Google', 'Organic', NULL, 'CONTACTED', NOW() - INTERVAL '5 days'),
('ld100001-0000-0000-0000-000000000003'::uuid, 'Lê Văn E', '0933333333', 'le.e@email.com', 'Lê Thị F', 8, 'Kids English program inquiry', 'Website', 'Direct', NULL, 'QUALIFIED', NOW() - INTERVAL '3 days'),
('ld100001-0000-0000-0000-000000000004'::uuid, 'Phạm Thị G', '0944444444', 'pham.g@email.com', 'Phạm Văn H', 20, 'Business English for work', 'LinkedIn', 'Paid', 'Business_Q1', 'NEW', NOW() - INTERVAL '1 day'),
('ld100001-0000-0000-0000-000000000005'::uuid, 'Hoàng Văn I', '0955555555', 'hoang.i@email.com', 'Hoàng Thị K', 18, 'TOEIC preparation for job', 'Instagram', 'Paid', 'TOEIC_2026', 'CONTACTED', NOW() - INTERVAL '4 days'),
('ld100001-0000-0000-0000-000000000006'::uuid, 'Vũ Thị L', '0966666666', 'vu.l@email.com', 'Vũ Văn M', 14, 'English fundamentals needed', 'TikTok', 'Organic', NULL, 'NEW', NOW()),
('ld100001-0000-0000-0000-000000000007'::uuid, 'Đỗ Văn N', '0977777777', 'do.n@email.com', 'Đỗ Thị O', 16, 'Preparing for study abroad', 'Referral', 'Word of mouth', NULL, 'QUALIFIED', NOW() - INTERVAL '6 days'),
('ld100001-0000-0000-0000-000000000008'::uuid, 'Bùi Thị P', '0988888888', 'bui.p@email.com', 'Bùi Văn Q', 22, 'Advanced English for career', 'Google', 'Paid', 'Advanced_Jan', 'CONVERTED', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LEAD FOLLOWUPS (create table if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    followup_type VARCHAR(50) NOT NULL,
    followup_date DATE NOT NULL,
    followup_time TIME,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    notes TEXT,
    assigned_to VARCHAR(255),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lead_followups (id, lead_id, followup_type, followup_date, followup_time, status, notes, assigned_to) VALUES
('lf100001-0000-0000-0000-000000000001'::uuid, 'ld100001-0000-0000-0000-000000000001'::uuid, 'CALL', CURRENT_DATE, '10:00', 'PENDING', 'Initial call to discuss IELTS course options', 'Sales Team'),
('lf100001-0000-0000-0000-000000000002'::uuid, 'ld100001-0000-0000-0000-000000000002'::uuid, 'EMAIL', CURRENT_DATE, '14:00', 'COMPLETED', 'Sent course brochure and pricing', 'Marketing Team'),
('lf100001-0000-0000-0000-000000000003'::uuid, 'ld100001-0000-0000-0000-000000000003'::uuid, 'MEETING', CURRENT_DATE + INTERVAL '1 day', '09:00', 'SCHEDULED', 'Campus tour with parent and child', 'Admissions'),
('lf100001-0000-0000-0000-000000000004'::uuid, 'ld100001-0000-0000-0000-000000000004'::uuid, 'CALL', CURRENT_DATE + INTERVAL '1 day', '11:00', 'SCHEDULED', 'Follow up on Business English inquiry', 'Sales Team'),
('lf100001-0000-0000-0000-000000000005'::uuid, 'ld100001-0000-0000-0000-000000000005'::uuid, 'EMAIL', CURRENT_DATE - INTERVAL '1 day', '15:00', 'COMPLETED', 'Sent TOEIC test preparation materials', 'Academic Team'),
('lf100001-0000-0000-0000-000000000006'::uuid, 'ld100001-0000-0000-0000-000000000006'::uuid, 'CALL', CURRENT_DATE + INTERVAL '2 days', '10:30', 'PENDING', 'First contact call', 'Sales Team'),
('lf100001-0000-0000-0000-000000000007'::uuid, 'ld100001-0000-0000-0000-000000000007'::uuid, 'MEETING', CURRENT_DATE + INTERVAL '3 days', '14:00', 'SCHEDULED', 'Consultation for study abroad program', 'Counselor'),
('lf100001-0000-0000-0000-000000000008'::uuid, 'ld100001-0000-0000-0000-000000000001'::uuid, 'CALL', CURRENT_DATE - INTERVAL '2 days', '16:00', 'MISSED', 'Could not reach, try again', 'Sales Team')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STUDENT REGISTRATIONS (create table if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(255) NOT NULL,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    parent_email VARCHAR(255),
    course_id UUID REFERENCES courses(id),
    course_name VARCHAR(255),
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    amount DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO student_registrations (id, student_name, parent_name, parent_phone, parent_email, course_id, course_name, registration_date, status, payment_status, amount) VALUES
('sr100001-0000-0000-0000-000000000001'::uuid, 'Nguyễn Văn D', 'Nguyễn Thị X', '0911234567', 'nguyen.x@email.com', 'c1000001-0000-0000-0000-000000000001'::uuid, 'English Fundamentals', CURRENT_DATE - INTERVAL '2 days', 'CONFIRMED', 'PAID', 2500000),
('sr100001-0000-0000-0000-000000000002'::uuid, 'Trần Thị E', 'Trần Văn Y', '0922345678', 'tran.y@email.com', 'c1000001-0000-0000-0000-000000000004'::uuid, 'IELTS Preparation', CURRENT_DATE - INTERVAL '1 day', 'PENDING', 'PENDING', 6000000),
('sr100001-0000-0000-0000-000000000003'::uuid, 'Lê Văn F', 'Lê Thị Z', '0933456789', 'le.z@email.com', 'c1000001-0000-0000-0000-000000000003'::uuid, 'Advanced Communication', CURRENT_DATE, 'CONFIRMED', 'PAID', 4500000),
('sr100001-0000-0000-0000-000000000004'::uuid, 'Phạm Thị G', 'Phạm Văn W', '0944567890', 'pham.w@email.com', 'c1000001-0000-0000-0000-000000000006'::uuid, 'Business English', CURRENT_DATE, 'PENDING', 'PARTIAL', 2500000),
('sr100001-0000-0000-0000-000000000005'::uuid, 'Hoàng Văn H', 'Hoàng Thị V', '0955678901', 'hoang.v@email.com', 'c1000001-0000-0000-0000-000000000005'::uuid, 'TOEIC Preparation', CURRENT_DATE - INTERVAL '3 days', 'CONFIRMED', 'PAID', 4000000),
('sr100001-0000-0000-0000-000000000006'::uuid, 'Vũ Thị I', 'Vũ Văn U', '0966789012', 'vu.u@email.com', 'c1000001-0000-0000-0000-000000000007'::uuid, 'English for Kids', CURRENT_DATE - INTERVAL '1 day', 'PENDING', 'PENDING', 2000000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
INSERT INTO attendance (id, student_id, class_id, attendance_date, status, check_in_time, notes, created_at) VALUES
('at100001-0000-0000-0000-000000000001'::uuid, 's1000001-0000-0000-0000-000000000001'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '2 days', 'PRESENT', '08:55:00', NULL, NOW()),
('at100001-0000-0000-0000-000000000002'::uuid, 's1000001-0000-0000-0000-000000000002'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '2 days', 'PRESENT', '09:00:00', NULL, NOW()),
('at100001-0000-0000-0000-000000000003'::uuid, 's1000001-0000-0000-0000-000000000003'::uuid, 'cl100001-0000-0000-0000-000000000003'::uuid, CURRENT_DATE - INTERVAL '2 days', 'LATE', '08:15:00', 'Traffic delay', NOW()),
('at100001-0000-0000-0000-000000000004'::uuid, 's1000001-0000-0000-0000-000000000004'::uuid, 'cl100001-0000-0000-0000-000000000003'::uuid, CURRENT_DATE - INTERVAL '2 days', 'ABSENT', NULL, 'Sick leave', NOW()),
('at100001-0000-0000-0000-000000000005'::uuid, 's1000001-0000-0000-0000-000000000001'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '4 days', 'PRESENT', '08:50:00', NULL, NOW()),
('at100001-0000-0000-0000-000000000006'::uuid, 's1000001-0000-0000-0000-000000000002'::uuid, 'cl100001-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - INTERVAL '4 days', 'PRESENT', '08:58:00', NULL, NOW()),
('at100001-0000-0000-0000-000000000007'::uuid, 's1000001-0000-0000-0000-000000000005'::uuid, 'cl100001-0000-0000-0000-000000000004'::uuid, CURRENT_DATE - INTERVAL '1 day', 'PRESENT', '17:55:00', NULL, NOW()),
('at100001-0000-0000-0000-000000000008'::uuid, 's1000001-0000-0000-0000-000000000006'::uuid, 'cl100001-0000-0000-0000-000000000005'::uuid, CURRENT_DATE - INTERVAL '3 days', 'PRESENT', '08:45:00', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Update stats/counts
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive seed data inserted successfully!';
END $$;

SELECT 'Data Summary:' as info;
SELECT 'Courses: ' || COUNT(*) FROM courses;
SELECT 'Teachers: ' || COUNT(*) FROM teachers;
SELECT 'Students: ' || COUNT(*) FROM students;
SELECT 'Classes: ' || COUNT(*) FROM classes;
SELECT 'Enrollments: ' || COUNT(*) FROM enrollments;
SELECT 'Leads: ' || COUNT(*) FROM leads;
SELECT 'Lead Followups: ' || COUNT(*) FROM lead_followups;
SELECT 'Registrations: ' || COUNT(*) FROM student_registrations;
SELECT 'Attendance: ' || COUNT(*) FROM attendance;
