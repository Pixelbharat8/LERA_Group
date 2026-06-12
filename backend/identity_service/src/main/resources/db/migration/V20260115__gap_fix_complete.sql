-- =====================================================
-- LERA Academy - Complete Gap Fix Migration
-- Date: 2026-01-15
-- Purpose: Fix all identified gaps for world-class status
-- =====================================================

-- Get center ID for reference
DO $$
DECLARE
    v_center_id UUID;
    v_student_role_id UUID := 'a48ea611-e950-476d-8331-eb4d06effd3d';
    v_parent_role_id UUID := 'ad2cfd90-f81d-4198-8784-0e0976807d85';
    v_staff_role_id UUID := 'd61089c6-b552-4c43-b8f5-bbafcc355419';
    v_teacher_role_id UUID := 'da427344-056b-476b-abcc-b11b972d0926';
    v_teaching_dept_id UUID;
    v_admin_dept_id UUID;
    v_user_id UUID;
    v_student_rec RECORD;
    v_teacher_rec RECORD;
BEGIN
    -- Get center ID
    SELECT id INTO v_center_id FROM centers LIMIT 1;
    
    -- Get department IDs
    SELECT id INTO v_teaching_dept_id FROM departments WHERE department_name ILIKE '%teaching%' LIMIT 1;
    SELECT id INTO v_admin_dept_id FROM departments WHERE department_name ILIKE '%admin%' OR department_name ILIKE '%operation%' LIMIT 1;
    
    -- =====================================================
    -- 1. CREATE USER ACCOUNTS FOR EXISTING STUDENTS
    -- =====================================================
    RAISE NOTICE 'Creating user accounts for students...';
    
    FOR v_student_rec IN SELECT id, fullname, student_code FROM students WHERE user_id IS NULL
    LOOP
        -- Generate email from student code
        v_user_id := uuid_generate_v4();
        
        INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, created_at)
        VALUES (
            v_user_id,
            LOWER(REPLACE(v_student_rec.student_code, ' ', '')) || '@student.lera.edu.vn',
            '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', -- password: student123
            v_student_rec.fullname,
            v_student_role_id,
            v_center_id,
            'ACTIVE',
            true,
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
        
        -- Link student to user
        UPDATE students SET user_id = v_user_id WHERE id = v_student_rec.id AND user_id IS NULL;
        
        RAISE NOTICE 'Created user for student: %', v_student_rec.fullname;
    END LOOP;
    
    -- =====================================================
    -- 2. CREATE USER ACCOUNTS FOR EXISTING TEACHERS
    -- =====================================================
    RAISE NOTICE 'Creating user accounts for teachers...';
    
    FOR v_teacher_rec IN SELECT id, teacher_code, specialization FROM teachers WHERE user_id IS NULL
    LOOP
        v_user_id := uuid_generate_v4();
        
        INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, created_at)
        VALUES (
            v_user_id,
            LOWER(REPLACE(v_teacher_rec.teacher_code, ' ', '')) || '@teacher.lera.edu.vn',
            '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', -- password: teacher123
            'Teacher ' || v_teacher_rec.teacher_code,
            v_teacher_role_id,
            v_center_id,
            v_teaching_dept_id,
            'ACTIVE',
            true,
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
        
        UPDATE teachers SET user_id = v_user_id WHERE id = v_teacher_rec.id AND user_id IS NULL;
        
        RAISE NOTICE 'Created user for teacher: %', v_teacher_rec.teacher_code;
    END LOOP;
    
    -- =====================================================
    -- 3. CREATE PARENT ACCOUNTS
    -- =====================================================
    RAISE NOTICE 'Creating parent accounts...';
    
    -- Parent 1
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'parent1@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Nguyễn Văn Minh', v_parent_role_id, v_center_id, 'ACTIVE', true, '+84901234001', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO parents (id, user_id, full_name, email, phone, parent_code, created_at)
    SELECT uuid_generate_v4(), id, 'Nguyễn Văn Minh', 'parent1@lera.edu.vn', '+84901234001', 'PAR001', NOW()
    FROM users WHERE email = 'parent1@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Parent 2
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'parent2@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Trần Thị Hương', v_parent_role_id, v_center_id, 'ACTIVE', true, '+84901234002', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO parents (id, user_id, full_name, email, phone, parent_code, created_at)
    SELECT uuid_generate_v4(), id, 'Trần Thị Hương', 'parent2@lera.edu.vn', '+84901234002', 'PAR002', NOW()
    FROM users WHERE email = 'parent2@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Parent 3
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'parent3@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Lê Văn Đức', v_parent_role_id, v_center_id, 'ACTIVE', true, '+84901234003', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO parents (id, user_id, full_name, email, phone, parent_code, created_at)
    SELECT uuid_generate_v4(), id, 'Lê Văn Đức', 'parent3@lera.edu.vn', '+84901234003', 'PAR003', NOW()
    FROM users WHERE email = 'parent3@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Parent 4
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'parent4@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Phạm Thị Lan', v_parent_role_id, v_center_id, 'ACTIVE', true, '+84901234004', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO parents (id, user_id, full_name, email, phone, parent_code, created_at)
    SELECT uuid_generate_v4(), id, 'Phạm Thị Lan', 'parent4@lera.edu.vn', '+84901234004', 'PAR004', NOW()
    FROM users WHERE email = 'parent4@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Parent 5
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'parent5@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Hoàng Văn Tùng', v_parent_role_id, v_center_id, 'ACTIVE', true, '+84901234005', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO parents (id, user_id, full_name, email, phone, parent_code, created_at)
    SELECT uuid_generate_v4(), id, 'Hoàng Văn Tùng', 'parent5@lera.edu.vn', '+84901234005', 'PAR005', NOW()
    FROM users WHERE email = 'parent5@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- =====================================================
    -- 4. CREATE STAFF ACCOUNTS
    -- =====================================================
    RAISE NOTICE 'Creating staff accounts...';
    
    -- Staff 1 - Receptionist
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'staff1@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Võ Thị Mai', v_staff_role_id, v_center_id, v_admin_dept_id, 'ACTIVE', true, '+84901234101', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO staff (id, user_id, center_id, staff_code, designation, status, created_at)
    SELECT uuid_generate_v4(), id, v_center_id, 'STF001', 'Receptionist', 'ACTIVE', NOW()
    FROM users WHERE email = 'staff1@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Staff 2 - Accountant
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'staff2@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Đặng Văn Hùng', v_staff_role_id, v_center_id, v_admin_dept_id, 'ACTIVE', true, '+84901234102', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO staff (id, user_id, center_id, staff_code, designation, status, created_at)
    SELECT uuid_generate_v4(), id, v_center_id, 'STF002', 'Accountant', 'ACTIVE', NOW()
    FROM users WHERE email = 'staff2@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Staff 3 - IT Support
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'staff3@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Bùi Minh Tuấn', v_staff_role_id, v_center_id, v_admin_dept_id, 'ACTIVE', true, '+84901234103', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO staff (id, user_id, center_id, staff_code, designation, status, created_at)
    SELECT uuid_generate_v4(), id, v_center_id, 'STF003', 'IT Support', 'ACTIVE', NOW()
    FROM users WHERE email = 'staff3@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Staff 4 - HR Assistant
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'staff4@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Ngô Thị Hạnh', v_staff_role_id, v_center_id, v_admin_dept_id, 'ACTIVE', true, '+84901234104', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO staff (id, user_id, center_id, staff_code, designation, status, created_at)
    SELECT uuid_generate_v4(), id, v_center_id, 'STF004', 'HR Assistant', 'ACTIVE', NOW()
    FROM users WHERE email = 'staff4@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    -- Staff 5 - Facility Manager
    INSERT INTO users (id, email, password_hash, fullname, role_id, center_id, department_id, status, email_verified, phone, created_at)
    VALUES (uuid_generate_v4(), 'staff5@lera.edu.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqC8oKgqYHs6FKXK1LNfCf/3JKZJ2', 
            'Trương Văn Khoa', v_staff_role_id, v_center_id, v_admin_dept_id, 'ACTIVE', true, '+84901234105', NOW())
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO staff (id, user_id, center_id, staff_code, designation, status, created_at)
    SELECT uuid_generate_v4(), id, v_center_id, 'STF005', 'Facility Manager', 'ACTIVE', NOW()
    FROM users WHERE email = 'staff5@lera.edu.vn'
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'User accounts creation complete!';
    
END $$;

-- =====================================================
-- 5. CREATE EXAM DATA
-- =====================================================
INSERT INTO exams (id, title, description, course_id, class_id, exam_type, duration_minutes, total_marks, passing_marks, scheduled_date, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Midterm English Grammar Exam',
    'Comprehensive grammar assessment covering tenses, articles, and prepositions',
    (SELECT id FROM courses WHERE name ILIKE '%English%' OR name ILIKE '%grammar%' LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    'MIDTERM',
    90,
    100,
    60,
    '2026-01-20 09:00:00',
    'SCHEDULED',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Midterm English Grammar Exam');

INSERT INTO exams (id, title, description, course_id, class_id, exam_type, duration_minutes, total_marks, passing_marks, scheduled_date, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Final Speaking Assessment',
    'Oral examination testing pronunciation and communication skills',
    (SELECT id FROM courses WHERE name ILIKE '%English%' OR name ILIKE '%speaking%' LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    'FINAL',
    30,
    50,
    30,
    '2026-02-15 10:00:00',
    'SCHEDULED',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Final Speaking Assessment');

INSERT INTO exams (id, title, description, course_id, class_id, exam_type, duration_minutes, total_marks, passing_marks, scheduled_date, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Weekly Vocabulary Quiz',
    'Quick vocabulary check on this week''s words',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 1 LIMIT 1),
    'QUIZ',
    15,
    20,
    12,
    '2026-01-17 14:00:00',
    'SCHEDULED',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Weekly Vocabulary Quiz');

INSERT INTO exams (id, title, description, course_id, class_id, exam_type, duration_minutes, total_marks, passing_marks, scheduled_date, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Reading Comprehension Test',
    'Assessment of reading and understanding English texts',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 2 LIMIT 1),
    'TEST',
    45,
    40,
    24,
    '2026-01-22 11:00:00',
    'SCHEDULED',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Reading Comprehension Test');

INSERT INTO exams (id, title, description, course_id, class_id, exam_type, duration_minutes, total_marks, passing_marks, scheduled_date, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Writing Skills Evaluation',
    'Essay writing and sentence construction assessment',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 3 LIMIT 1),
    'TEST',
    60,
    50,
    30,
    '2026-01-25 09:30:00',
    'SCHEDULED',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Writing Skills Evaluation');

-- =====================================================
-- 6. CREATE ASSIGNMENT DATA
-- =====================================================
INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Essay: My Favorite Holiday',
    'Write a 300-word essay about your favorite holiday and why you enjoy it.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    '2026-01-20 23:59:00',
    100,
    'ESSAY',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Essay: My Favorite Holiday');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Grammar Worksheet: Tenses',
    'Complete the worksheet covering past, present, and future tenses.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    '2026-01-18 23:59:00',
    50,
    'WORKSHEET',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Grammar Worksheet: Tenses');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Vocabulary Building Exercise',
    'Learn and use 20 new vocabulary words in sentences.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 1 LIMIT 1),
    '2026-01-22 23:59:00',
    40,
    'EXERCISE',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Vocabulary Building Exercise');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Reading Report: Short Story',
    'Read the assigned short story and write a summary with your thoughts.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 2 LIMIT 1),
    '2026-01-25 23:59:00',
    80,
    'REPORT',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Reading Report: Short Story');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Dialogue Practice Recording',
    'Record a 2-minute dialogue with a partner practicing conversational English.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 3 LIMIT 1),
    '2026-01-28 23:59:00',
    60,
    'RECORDING',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Dialogue Practice Recording');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Presentation: Famous Person',
    'Prepare a 5-minute presentation about a famous person you admire.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    '2026-02-01 23:59:00',
    100,
    'PRESENTATION',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Presentation: Famous Person');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Article Writing: Environmental Issues',
    'Write a 500-word article about an environmental issue that concerns you.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 1 LIMIT 1),
    '2026-02-05 23:59:00',
    120,
    'ESSAY',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Article Writing: Environmental Issues');

INSERT INTO assignments (id, title, description, course_id, class_id, due_date, total_points, assignment_type, status, created_at)
SELECT 
    uuid_generate_v4(),
    'Listening Comprehension Exercise',
    'Listen to the audio clips and answer the comprehension questions.',
    (SELECT id FROM courses LIMIT 1),
    (SELECT id FROM classes OFFSET 2 LIMIT 1),
    '2026-01-30 23:59:00',
    45,
    'EXERCISE',
    'ACTIVE',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE title = 'Listening Comprehension Exercise');

-- =====================================================
-- 7. CREATE ATTENDANCE RECORDS (Last 30 days)
-- =====================================================
INSERT INTO attendance_records (id, student_id, class_id, date, status, check_in_time, created_at)
SELECT 
    uuid_generate_v4(),
    s.id,
    c.id,
    d.date,
    CASE 
        WHEN random() < 0.85 THEN 'PRESENT'
        WHEN random() < 0.95 THEN 'LATE'
        ELSE 'ABSENT'
    END,
    CASE WHEN random() < 0.85 THEN (d.date + interval '8 hours' + (random() * interval '30 minutes')) ELSE NULL END,
    NOW()
FROM students s
CROSS JOIN classes c
CROSS JOIN (
    SELECT generate_series(
        CURRENT_DATE - interval '30 days',
        CURRENT_DATE - interval '1 day',
        interval '1 day'
    )::date as date
) d
WHERE NOT EXISTS (
    SELECT 1 FROM attendance_records ar 
    WHERE ar.student_id = s.id AND ar.class_id = c.id AND ar.date = d.date
)
AND EXTRACT(DOW FROM d.date) NOT IN (0, 6)  -- Exclude weekends
LIMIT 500;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '=== GAP FIX VERIFICATION ===';
    RAISE NOTICE 'Students with user_id: %', (SELECT count(*) FROM students WHERE user_id IS NOT NULL);
    RAISE NOTICE 'Teachers with user_id: %', (SELECT count(*) FROM teachers WHERE user_id IS NOT NULL);
    RAISE NOTICE 'Parents count: %', (SELECT count(*) FROM parents);
    RAISE NOTICE 'Staff count: %', (SELECT count(*) FROM staff);
    RAISE NOTICE 'Exams count: %', (SELECT count(*) FROM exams);
    RAISE NOTICE 'Assignments count: %', (SELECT count(*) FROM assignments);
    RAISE NOTICE 'Attendance records count: %', (SELECT count(*) FROM attendance_records);
    RAISE NOTICE 'Total users: %', (SELECT count(*) FROM users);
END $$;
