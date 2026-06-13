-- Correct Seed Data for LERA Group - Matches actual table schemas
-- Run: PGPASSWORD=lera psql -h localhost -U lera -d lera -f this_file.sql

-- ============================================
-- COURSES (title, description, level)
-- ============================================
INSERT INTO courses (id, title, description, level, duration_minutes) VALUES
(uuid_generate_v4(), 'English Fundamentals', 'Basic English for beginners covering grammar, vocabulary, and speaking', 'Beginner', 3600),
(uuid_generate_v4(), 'Intermediate English', 'Intermediate level English focusing on conversation and writing', 'Intermediate', 4800),
(uuid_generate_v4(), 'Advanced Communication', 'Advanced English for professional communication', 'Advanced', 6000),
(uuid_generate_v4(), 'IELTS Preparation', 'Complete IELTS exam preparation course', 'Intermediate', 7200),
(uuid_generate_v4(), 'TOEIC Preparation', 'TOEIC exam preparation and practice', 'Intermediate', 4800),
(uuid_generate_v4(), 'Business English', 'English for business professionals', 'Intermediate', 3600),
(uuid_generate_v4(), 'English for Kids', 'Fun English learning for children ages 6-10', 'Beginner', 2880),
(uuid_generate_v4(), 'Speaking Mastery', 'Intensive speaking practice and pronunciation', 'All Levels', 2400)
ON CONFLICT DO NOTHING;

-- ============================================
-- TEACHERS (using actual columns)
-- ============================================
INSERT INTO teachers (id, teacher_code, specialization, qualification, years_of_experience, status) VALUES
(uuid_generate_v4(), 'TCH001', 'IELTS, English Speaking', 'MA in Applied Linguistics', 8, 'ACTIVE'),
(uuid_generate_v4(), 'TCH002', 'Business English, TOEIC', 'MBA, TESOL Certified', 6, 'ACTIVE'),
(uuid_generate_v4(), 'TCH003', 'Kids English, Grammar', 'BA in Education', 4, 'ACTIVE'),
(uuid_generate_v4(), 'TCH004', 'Academic Writing, IELTS', 'PhD in English Literature', 10, 'ACTIVE'),
(uuid_generate_v4(), 'TCH005', 'Pronunciation, Speaking', 'MA TESOL', 5, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- ============================================
-- STUDENTS (fullname not full_name)
-- ============================================
INSERT INTO students (id, student_code, fullname, date_of_birth, gender, status, enrollment_date) VALUES
(uuid_generate_v4(), 'STU2026001', 'Nguyễn Minh Anh', '2005-03-15', 'Female', 'ACTIVE', '2024-01-15'),
(uuid_generate_v4(), 'STU2026002', 'Trần Hoàng Nam', '2006-07-20', 'Male', 'ACTIVE', '2024-01-20'),
(uuid_generate_v4(), 'STU2026003', 'Lê Thị Mai', '2004-11-10', 'Female', 'ACTIVE', '2024-02-01'),
(uuid_generate_v4(), 'STU2026004', 'Phạm Văn Đức', '2005-05-25', 'Male', 'ACTIVE', '2024-02-10'),
(uuid_generate_v4(), 'STU2026005', 'Võ Thanh Hà', '2006-09-05', 'Female', 'ACTIVE', '2024-02-15'),
(uuid_generate_v4(), 'STU2026006', 'Hoàng Minh Tú', '2005-01-12', 'Male', 'ACTIVE', '2024-03-01'),
(uuid_generate_v4(), 'STU2026007', 'Đặng Thị Lan', '2004-08-30', 'Female', 'ACTIVE', '2024-03-05'),
(uuid_generate_v4(), 'STU2026008', 'Bùi Văn Hải', '2006-04-18', 'Male', 'ACTIVE', '2024-03-10'),
(uuid_generate_v4(), 'STU2026009', 'Ngô Thị Hồng', '2005-12-22', 'Female', 'ACTIVE', '2024-03-15'),
(uuid_generate_v4(), 'STU2026010', 'Trương Minh Khôi', '2004-06-08', 'Male', 'ACTIVE', '2024-03-20'),
(uuid_generate_v4(), 'STU2026011', 'Lý Thị Ngọc', '2006-02-14', 'Female', 'ACTIVE', '2024-04-01'),
(uuid_generate_v4(), 'STU2026012', 'Đinh Văn Phong', '2005-10-28', 'Male', 'ACTIVE', '2024-04-05')
ON CONFLICT DO NOTHING;

-- ============================================
-- CLASSES (name not class_name)
-- ============================================
-- First get teacher IDs
DO $$
DECLARE
    t1_id UUID;
    t2_id UUID;
    t3_id UUID;
BEGIN
    SELECT id INTO t1_id FROM teachers WHERE teacher_code = 'TCH001' LIMIT 1;
    SELECT id INTO t2_id FROM teachers WHERE teacher_code = 'TCH002' LIMIT 1;
    SELECT id INTO t3_id FROM teachers WHERE teacher_code = 'TCH003' LIMIT 1;
    
    IF t1_id IS NULL THEN t1_id := (SELECT id FROM teachers LIMIT 1); END IF;
    IF t2_id IS NULL THEN t2_id := t1_id; END IF;
    IF t3_id IS NULL THEN t3_id := t1_id; END IF;
    
    INSERT INTO classes (id, name, teacher_id, room, schedule_days, schedule_time_start, schedule_time_end, start_date, end_date, max_students, status) VALUES
    (uuid_generate_v4(), 'English Beginners A', t1_id, 'Room 101', 'Mon,Wed,Fri', '09:00', '10:30', '2026-01-06', '2026-04-30', 25, 'OPEN'),
    (uuid_generate_v4(), 'English Beginners B', t3_id, 'Room 102', 'Tue,Thu', '14:00', '15:30', '2026-01-07', '2026-05-15', 20, 'OPEN'),
    (uuid_generate_v4(), 'IELTS Prep Morning', t1_id, 'Room 201', 'Mon,Wed,Fri', '08:00', '10:00', '2026-01-06', '2026-06-30', 15, 'OPEN'),
    (uuid_generate_v4(), 'IELTS Prep Evening', t1_id, 'Room 202', 'Tue,Thu', '18:00', '20:00', '2026-01-07', '2026-06-30', 15, 'OPEN'),
    (uuid_generate_v4(), 'Business English', t2_id, 'Room 301', 'Sat', '09:00', '12:00', '2026-01-11', '2026-04-26', 12, 'OPEN'),
    (uuid_generate_v4(), 'Speaking Mastery', t1_id, 'Room 103', 'Wed,Fri', '16:00', '17:30', '2026-01-08', '2026-03-28', 10, 'OPEN'),
    (uuid_generate_v4(), 'Kids English Fun', t3_id, 'Room 104', 'Sat,Sun', '09:00', '10:30', '2026-01-11', '2026-05-31', 15, 'OPEN'),
    (uuid_generate_v4(), 'Advanced Communication', t1_id, 'Room 203', 'Mon,Thu', '19:00', '21:00', '2026-01-06', '2026-05-29', 20, 'OPEN')
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- ENROLLMENTS - Link students to classes
-- ============================================
DO $$
DECLARE
    s_rec RECORD;
    c_rec RECORD;
    i INTEGER := 0;
BEGIN
    FOR s_rec IN SELECT id FROM students WHERE student_code LIKE 'STU2026%' ORDER BY student_code LOOP
        i := i + 1;
        -- Assign each student to a class
        SELECT id INTO c_rec FROM classes ORDER BY name LIMIT 1 OFFSET (i % 8);
        
        IF c_rec.id IS NOT NULL THEN
            INSERT INTO enrollments (student_id, class_id, enrollment_date, status)
            VALUES (s_rec.id, c_rec.id, CURRENT_DATE - (i * 5), 'ACTIVE')
            ON CONFLICT (student_id, class_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- LEADS (more data)
-- ============================================
INSERT INTO leads (id, parent_name, parent_phone, parent_email, student_name, student_age, notes, utm_source, utm_medium, utm_campaign, status) VALUES
(uuid_generate_v4(), 'Nguyễn Văn A', '0911111111', 'nguyen.a@email.com', 'Nguyễn Thị B', 12, 'Interested in IELTS preparation', 'Facebook', 'Paid', 'IELTS_Jan2026', 'NEW'),
(uuid_generate_v4(), 'Trần Thị C', '0922222222', 'tran.c@email.com', 'Trần Văn D', 15, 'Looking for English speaking course', 'Google', 'Organic', NULL, 'CONTACTED'),
(uuid_generate_v4(), 'Lê Văn E', '0933333333', 'le.e@email.com', 'Lê Thị F', 8, 'Kids English program inquiry', 'Website', 'Direct', NULL, 'QUALIFIED'),
(uuid_generate_v4(), 'Phạm Thị G', '0944444444', 'pham.g@email.com', 'Phạm Văn H', 20, 'Business English for work', 'LinkedIn', 'Paid', 'Business_Q1', 'NEW'),
(uuid_generate_v4(), 'Hoàng Văn I', '0955555555', 'hoang.i@email.com', 'Hoàng Thị K', 18, 'TOEIC preparation for job', 'Instagram', 'Paid', 'TOEIC_2026', 'CONTACTED'),
(uuid_generate_v4(), 'Vũ Thị L', '0966666666', 'vu.l@email.com', 'Vũ Văn M', 14, 'English fundamentals needed', 'TikTok', 'Organic', NULL, 'NEW'),
(uuid_generate_v4(), 'Đỗ Văn N', '0977777777', 'do.n@email.com', 'Đỗ Thị O', 16, 'Preparing for study abroad', 'Referral', 'Word of mouth', NULL, 'QUALIFIED'),
(uuid_generate_v4(), 'Bùi Thị P', '0988888888', 'bui.p@email.com', 'Bùi Văn Q', 22, 'Advanced English for career', 'Google', 'Paid', 'Advanced_Jan', 'CONVERTED'),
(uuid_generate_v4(), 'Cao Văn R', '0899999999', 'cao.r@email.com', 'Cao Thị S', 10, 'Kids summer camp', 'Facebook', 'Organic', NULL, 'NEW'),
(uuid_generate_v4(), 'Dương Thị T', '0811111111', 'duong.t@email.com', 'Dương Văn U', 17, 'University prep English', 'Website', 'Direct', NULL, 'CONTACTED')
ON CONFLICT DO NOTHING;

-- ============================================
-- LEAD FOLLOWUPS (action_type, outcome, next_followup_date)
-- ============================================
DO $$
DECLARE
    lead_rec RECORD;
    i INTEGER := 0;
    action_types TEXT[] := ARRAY['CALL', 'EMAIL', 'MEETING', 'SMS'];
    outcomes TEXT[] := ARRAY['INTERESTED', 'CALLBACK', 'NOT_INTERESTED', 'SCHEDULED_DEMO', NULL];
BEGIN
    FOR lead_rec IN SELECT id FROM leads ORDER BY created_at DESC LIMIT 10 LOOP
        i := i + 1;
        INSERT INTO lead_followups (lead_id, action_type, notes, next_followup_date, outcome)
        VALUES (
            lead_rec.id,
            action_types[(i % 4) + 1],
            'Follow up note #' || i,
            CURRENT_DATE + (i * 2),
            outcomes[(i % 5) + 1]
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ============================================
-- STUDENT REGISTRATIONS
-- ============================================
INSERT INTO student_registrations (id, student_name, course_id, registration_date, status, payment_status, amount) VALUES
(uuid_generate_v4(), 'Nguyễn Văn D', (SELECT id FROM courses WHERE title = 'English Fundamentals' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'CONFIRMED', 'PAID', 2500000),
(uuid_generate_v4(), 'Trần Thị E', (SELECT id FROM courses WHERE title = 'IELTS Preparation' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'PENDING', 'PENDING', 6000000),
(uuid_generate_v4(), 'Lê Văn F', (SELECT id FROM courses WHERE title = 'Advanced Communication' LIMIT 1), CURRENT_DATE, 'CONFIRMED', 'PAID', 4500000),
(uuid_generate_v4(), 'Phạm Thị G', (SELECT id FROM courses WHERE title = 'Business English' LIMIT 1), CURRENT_DATE, 'PENDING', 'PARTIAL', 2500000),
(uuid_generate_v4(), 'Hoàng Văn H', (SELECT id FROM courses WHERE title = 'TOEIC Preparation' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'CONFIRMED', 'PAID', 4000000),
(uuid_generate_v4(), 'Vũ Thị I', (SELECT id FROM courses WHERE title = 'English for Kids' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'PENDING', 'PENDING', 2000000)
ON CONFLICT DO NOTHING;

-- ============================================
-- CLASS SESSIONS (for attendance)
-- ============================================
DO $$
DECLARE
    class_rec RECORD;
    session_date DATE;
BEGIN
    FOR class_rec IN SELECT id FROM classes LIMIT 5 LOOP
        session_date := CURRENT_DATE - INTERVAL '3 days';
        WHILE session_date <= CURRENT_DATE LOOP
            INSERT INTO class_sessions (id, class_id, session_date, start_time, end_time, status)
            VALUES (uuid_generate_v4(), class_rec.id, session_date, '09:00', '10:30', 'COMPLETED')
            ON CONFLICT DO NOTHING;
            session_date := session_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
DO $$
DECLARE
    session_rec RECORD;
    enrollment_rec RECORD;
    statuses TEXT[] := ARRAY['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];
BEGIN
    FOR session_rec IN SELECT cs.id as session_id, cs.class_id FROM class_sessions cs ORDER BY session_date DESC LIMIT 20 LOOP
        FOR enrollment_rec IN SELECT student_id FROM enrollments WHERE class_id = session_rec.class_id LIMIT 5 LOOP
            INSERT INTO attendance (session_id, student_id, status, check_in_time)
            VALUES (
                session_rec.session_id,
                enrollment_rec.student_id,
                statuses[(random() * 4 + 1)::int],
                CASE WHEN random() > 0.2 THEN NOW() - INTERVAL '2 hours' ELSE NULL END
            )
            ON CONFLICT (session_id, student_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
END $$;

SELECT 'SEED DATA SUMMARY' as info;
SELECT 'Courses: ' || COUNT(*) FROM courses;
SELECT 'Teachers: ' || COUNT(*) FROM teachers;
SELECT 'Students: ' || COUNT(*) FROM students;
SELECT 'Classes: ' || COUNT(*) FROM classes;
SELECT 'Enrollments: ' || COUNT(*) FROM enrollments;
SELECT 'Leads: ' || COUNT(*) FROM leads;
SELECT 'Lead Followups: ' || COUNT(*) FROM lead_followups;
SELECT 'Registrations: ' || COUNT(*) FROM student_registrations;
SELECT 'Class Sessions: ' || COUNT(*) FROM class_sessions;
SELECT 'Attendance: ' || COUNT(*) FROM attendance;
