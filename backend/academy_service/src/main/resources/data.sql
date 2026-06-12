-- =====================================================
-- LERA Academy Service - Seed Data
-- =====================================================
-- This file creates initial data for students, teachers, programs, classes, enrollments
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- CLEAN UP OLD SPORTS COURSES (Replace with English courses)
-- =====================================================
DELETE FROM course_programs WHERE category IN ('SPORTS', 'FOOTBALL', 'SWIMMING', 'TENNIS', 'BASKETBALL', 'MARTIAL_ARTS', 'YOGA') OR code IN ('FOOTBALL-BASIC', 'FOOTBALL-ADV', 'SWIM-BASIC', 'SWIM-ADV', 'TENNIS-BASIC', 'BASKETBALL', 'MARTIAL-ARTS', 'YOGA-KIDS');

-- =====================================================
-- COURSE PROGRAMS (LERA Academy English Language Programs)
-- =====================================================
INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES 
    ('a0000001-0000-0000-0000-000000000001', 'STARTERS', 'LERA Starters', 'LERA Khởi Đầu', 'Fun English learning for toddlers through play, songs, and interactive activities. Building foundation for language love.', 'Học tiếng Anh vui nhộn cho trẻ nhỏ qua trò chơi, bài hát và hoạt động tương tác. Xây dựng nền tảng yêu thích ngôn ngữ.', 2, 4, 'ENGLISH', 'BEGINNER', 2500000, '#EC4899', true, true, 1, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000002', 'EXPLORERS', 'LERA Explorers', 'LERA Khám Phá', 'Discover English through stories, crafts, and games. Develop listening and speaking confidence.', 'Khám phá tiếng Anh qua câu chuyện, thủ công và trò chơi. Phát triển sự tự tin nghe và nói.', 5, 6, 'ENGLISH', 'BEGINNER', 2800000, '#3B82F6', true, true, 2, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000003', 'PRIMARY', 'LERA Primary', 'LERA Tiểu Học', 'Comprehensive English for primary school students. Reading, writing, speaking, and listening skills.', 'Tiếng Anh toàn diện cho học sinh tiểu học. Kỹ năng đọc, viết, nói và nghe.', 7, 10, 'ENGLISH', 'ELEMENTARY', 3000000, '#10B981', true, true, 3, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000004', 'TEENS', 'LERA Teens', 'LERA Thiếu Niên', 'Academic English and exam preparation for teenagers. Cambridge, TOEFL Junior prep included.', 'Tiếng Anh học thuật và luyện thi cho thiếu niên. Bao gồm luyện Cambridge, TOEFL Junior.', 11, 14, 'ENGLISH', 'INTERMEDIATE', 3500000, '#8B5CF6', true, true, 4, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000005', 'IELTS_SAT', 'IELTS & SAT Preparation', 'Luyện Thi IELTS & SAT', 'Intensive preparation for IELTS, SAT, and university admission. Expert instructors and proven methods.', 'Luyện thi chuyên sâu IELTS, SAT và tuyển sinh đại học. Giáo viên chuyên gia và phương pháp đã chứng minh.', 15, 99, 'ENGLISH', 'ADVANCED', 4500000, '#4F46E5', true, true, 5, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000006', 'BUSINESS', 'Business English', 'Tiếng Anh Thương Mại', 'Professional English for the workplace. Presentations, negotiations, business writing, and communication.', 'Tiếng Anh chuyên nghiệp cho môi trường làm việc. Thuyết trình, đàm phán, viết và giao tiếp công việc.', 18, 99, 'ENGLISH', 'ADVANCED', 4000000, '#7C3AED', true, true, 6, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000007', 'CONVERSATION', 'English Conversation Club', 'Câu Lạc Bộ Giao Tiếp', 'Practice speaking English with native speakers. Fun topics, debates, and real-life scenarios.', 'Luyện nói tiếng Anh với người bản xứ. Chủ đề vui, tranh luận và tình huống thực tế.', 10, 99, 'ENGLISH', 'ALL_LEVELS', 2000000, '#06B6D4', false, true, 7, NOW(), NOW()),
    ('a0000001-0000-0000-0000-000000000008', 'PHONICS', 'Phonics & Reading', 'Ngữ Âm & Đọc', 'Master English pronunciation and reading skills. Systematic phonics approach for all ages.', 'Làm chủ phát âm và kỹ năng đọc tiếng Anh. Phương pháp ngữ âm hệ thống cho mọi lứa tuổi.', 5, 12, 'ENGLISH', 'BEGINNER', 2200000, '#F59E0B', false, true, 8, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description,
    description_vi = EXCLUDED.description_vi,
    age_from = EXCLUDED.age_from,
    age_to = EXCLUDED.age_to,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    color = EXCLUDED.color,
    updated_at = NOW();

-- =====================================================
-- TEACHERS (English Language Teaching Staff)
-- =====================================================
INSERT INTO teachers (id, user_id, center_id, teacher_code, specialization, qualification, years_of_experience, nationality, bio, bio_vi, hourly_rate, contract_type, is_native_speaker, is_featured, status, created_at, updated_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'TCH-001', 'IELTS & Academic English', 'CELTA, MA TESOL, IELTS Examiner', 10, 'United Kingdom', 'Native British teacher specializing in IELTS and academic English. Former British Council examiner with proven track record.', 'Giáo viên người Anh chuyên IELTS và tiếng Anh học thuật. Cựu giám khảo British Council với thành tích xuất sắc.', 600000, 'FULL_TIME', true, true, 'ACTIVE', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'TCH-002', 'Young Learners & Phonics', 'TESOL, Early Childhood Education', 8, 'United States', 'American teacher passionate about early English education. Fun and engaging teaching style loved by kids.', 'Giáo viên Mỹ đam mê giáo dục tiếng Anh sớm. Phong cách dạy vui vẻ và hấp dẫn được trẻ yêu thích.', 550000, 'FULL_TIME', true, true, 'ACTIVE', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'TCH-003', 'Business English', 'MBA, Cambridge CELTA, BEC Higher', 12, 'Australia', 'Australian business English specialist with corporate training background. Expert in presentation skills and negotiation.', 'Chuyên gia tiếng Anh thương mại người Úc có kinh nghiệm đào tạo doanh nghiệp. Thành thạo kỹ năng thuyết trình và đàm phán.', 650000, 'FULL_TIME', true, true, 'ACTIVE', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000004', NULL, 'c0000000-0000-0000-0000-000000000001', 'TCH-004', 'Conversation & Speaking', 'TEFL, Drama in Education Certificate', 6, 'Canada', 'Canadian teacher making speaking practice fun and effective. Uses drama and role-play techniques.', 'Giáo viên Canada làm luyện nói trở nên vui và hiệu quả. Sử dụng kỹ thuật kịch và nhập vai.', 500000, 'FULL_TIME', true, true, 'ACTIVE', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000005', NULL, 'c0000000-0000-0000-0000-000000000002', 'TCH-005', 'Grammar & Writing', 'MA English Literature, CELTA', 15, 'Vietnam', 'Vietnamese teacher with excellent grammar knowledge and teaching methodology. Bilingual advantage for beginners.', 'Giáo viên Việt Nam với kiến thức ngữ pháp xuất sắc và phương pháp giảng dạy. Lợi thế song ngữ cho người mới bắt đầu.', 400000, 'FULL_TIME', false, true, 'ACTIVE', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000006', NULL, 'c0000000-0000-0000-0000-000000000003', 'TCH-006', 'SAT & Test Prep', 'MA Education, SAT Perfect Score', 9, 'United States', 'American test prep specialist with perfect SAT score. Strategic approach to standardized testing success.', 'Chuyên gia luyện thi Mỹ đạt điểm SAT tuyệt đối. Phương pháp chiến lược để thành công trong các kỳ thi chuẩn hóa.', 700000, 'PART_TIME', true, false, 'ACTIVE', NOW(), NOW())
ON CONFLICT (teacher_code) DO UPDATE SET
    specialization = EXCLUDED.specialization,
    qualification = EXCLUDED.qualification,
    bio = EXCLUDED.bio,
    bio_vi = EXCLUDED.bio_vi,
    updated_at = NOW();

-- =====================================================
-- STUDENTS (Sample students)
-- =====================================================
INSERT INTO students (id, user_id, center_id, student_code, fullname, fullname_vi, date_of_birth, gender, school_name, grade, parent_name, parent_phone, parent_email, status, enrollment_date, created_at, updated_at)
VALUES 
    ('50000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000001', 'STU-2024-001', 'Nguyen Minh Anh', 'Nguyễn Minh Anh', '2015-03-15', 'MALE', 'Le Hong Phong Primary', 'Grade 3', 'Nguyen Van Parent', '+84 900 000 040', 'parent1@gmail.com', 'ACTIVE', '2024-01-15', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000001', 'STU-2024-002', 'Tran Bao Ngoc', 'Trần Bảo Ngọc', '2014-07-22', 'FEMALE', 'Nguyen Du Primary', 'Grade 4', 'Tran Thi Parent', '+84 900 000 041', 'parent2@gmail.com', 'ACTIVE', '2024-02-01', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000003', NULL, 'c0000000-0000-0000-0000-000000000001', 'STU-2024-003', 'Le Hoang Nam', 'Lê Hoàng Nam', '2013-11-08', 'MALE', 'Marie Curie School', 'Grade 5', 'Le Van Minh', '+84 912 345 678', 'levminh@gmail.com', 'ACTIVE', '2024-01-20', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000004', NULL, 'c0000000-0000-0000-0000-000000000001', 'STU-2024-004', 'Pham Thu Ha', 'Phạm Thu Hà', '2016-02-28', 'FEMALE', 'Vinschool Central Park', 'Grade 2', 'Pham Duc Anh', '+84 909 876 543', 'phamduc@gmail.com', 'ACTIVE', '2024-03-01', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000005', NULL, 'c0000000-0000-0000-0000-000000000002', 'STU-2024-005', 'Vo Minh Khoa', 'Võ Minh Khoa', '2012-09-10', 'MALE', 'BIS Ho Chi Minh', 'Grade 6', 'Vo Van Tuan', '+84 918 765 432', 'vvtuan@gmail.com', 'ACTIVE', '2024-01-10', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000006', NULL, 'c0000000-0000-0000-0000-000000000002', 'STU-2024-006', 'Hoang Gia Bao', 'Hoàng Gia Bảo', '2015-05-20', 'MALE', 'SSIS', 'Grade 3', 'Hoang Van Long', '+84 905 432 109', 'hvlong@gmail.com', 'ACTIVE', '2024-02-15', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000007', NULL, 'c0000000-0000-0000-0000-000000000003', 'STU-2024-007', 'Dang Thuy Linh', 'Đặng Thùy Linh', '2014-12-05', 'FEMALE', 'AIS Saigon', 'Grade 4', 'Dang Minh Tuan', '+84 903 210 987', 'dmtuan@gmail.com', 'ACTIVE', '2024-01-25', NOW(), NOW()),
    ('50000000-0000-0000-0000-000000000008', NULL, 'c0000000-0000-0000-0000-000000000003', 'STU-2024-008', 'Bui Duc Huy', 'Bùi Đức Huy', '2013-08-18', 'MALE', 'European International School', 'Grade 5', 'Bui Van Thanh', '+84 901 098 765', 'bvthanh@gmail.com', 'ACTIVE', '2024-02-20', NOW(), NOW())
ON CONFLICT (student_code) DO UPDATE SET
    fullname = EXCLUDED.fullname,
    updated_at = NOW();

-- =====================================================
-- CLASSES (Training classes)
-- =====================================================
INSERT INTO classes (id, center_id, program_id, name, teacher_id, room, schedule_days, schedule_time_start, schedule_time_end, start_date, end_date, max_students, status, created_at, updated_at)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'LERA Starters - Morning A', 'b0000000-0000-0000-0000-000000000002', 'Room A1', 'MON,WED,FRI', '08:00', '09:30', '2024-01-15', '2024-06-15', 12, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'LERA Starters - Afternoon B', 'b0000000-0000-0000-0000-000000000002', 'Room A1', 'TUE,THU,SAT', '15:00', '16:30', '2024-01-15', '2024-06-15', 12, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'LERA Explorers - Morning', 'b0000000-0000-0000-0000-000000000002', 'Room B1', 'MON,WED,FRI', '09:00', '10:30', '2024-02-01', '2024-07-01', 10, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'LERA Primary - Evening', 'b0000000-0000-0000-0000-000000000005', 'Room C1', 'TUE,THU', '17:00', '18:30', '2024-01-20', '2024-06-20', 15, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'LERA Teens - Weekend', 'b0000000-0000-0000-0000-000000000001', 'Room D1', 'SAT,SUN', '08:00', '10:00', '2024-02-01', '2024-07-01', 15, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'IELTS Intensive - Evening', 'b0000000-0000-0000-0000-000000000001', 'Room E1', 'MON,WED,FRI', '18:00', '20:00', '2024-01-10', '2024-06-10', 12, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'Business English - Saturday', 'b0000000-0000-0000-0000-000000000003', 'Room F1', 'SAT', '09:00', '12:00', '2024-02-01', '2024-07-01', 10, 'ACTIVE', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'Phonics & Reading - Elite', 'b0000000-0000-0000-0000-000000000002', 'Room G1', 'MON,WED,FRI,SAT', '16:00', '17:30', '2024-01-15', '2024-06-15', 10, 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENROLLMENTS (Student class enrollments)
-- =====================================================
INSERT INTO enrollments (id, student_id, class_id, enrollment_date, start_date, status, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2024-01-15', '2024-01-15', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', '2024-02-01', '2024-02-01', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '2024-02-01', '2024-02-01', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', '2024-01-20', '2024-01-20', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008', '2024-01-20', '2024-01-20', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', '2024-03-01', '2024-03-01', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', '2024-02-01', '2024-02-01', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', '2024-01-10', '2024-01-10', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', '2024-02-15', '2024-02-15', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', '2024-02-01', '2024-02-01', 'ACTIVE', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002', '2024-01-15', '2024-01-15', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- EXAMS (Assessment schedules)
-- =====================================================
INSERT INTO exams (id, class_id, title, description, exam_type, exam_date, duration_minutes, max_score, passing_score, status, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 'LERA Starters Q1 Assessment', 'Quarterly progress assessment for young learners', 'ORAL', '2024-03-15', 30, 100, 60, 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000003', 'Explorers Level Test', 'Speaking and listening proficiency test', 'ORAL', '2024-04-01', 45, 100, 70, 'SCHEDULED', NOW(), NOW()),
    (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000004', 'Primary English Assessment', 'Reading, writing, listening, speaking test', 'WRITTEN', '2024-03-20', 60, 100, 65, 'SCHEDULED', NOW(), NOW()),
    (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000006', 'IELTS Practice Test', 'Full IELTS simulation test', 'WRITTEN', '2024-04-10', 180, 9, 6.5, 'SCHEDULED', NOW(), NOW()),
    (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000008', 'Phonics Mastery Test', 'Phonics knowledge and reading assessment', 'ORAL', '2024-03-30', 45, 100, 70, 'SCHEDULED', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- CERTIFICATES (Achievement certificates)
-- =====================================================
INSERT INTO certificates (id, student_id, certificate_type, title, description, issue_date, status, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'COMPLETION', 'LERA Starters Level 1', 'Successfully completed LERA Starters program', '2024-03-15', 'ISSUED', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'ACHIEVEMENT', 'English Speaking Star', 'Outstanding achievement in speaking class', '2024-03-20', 'ISSUED', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', 'PARTICIPATION', 'English Speech Contest 2024', 'Participated in Junior English Speech Championship', '2024-02-28', 'ISSUED', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- BANNERS (Website banners)
-- =====================================================
INSERT INTO banners (id, title, subtitle, image_url, link_url, button_text, display_order, is_active, start_date, end_date, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Welcome to LERA Academy', 'Where English Dreams Come True', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', '/programs', 'Explore Programs', 1, true, '2024-01-01', '2024-12-31', NOW(), NOW()),
    (gen_random_uuid(), 'Summer English Camp 2024', 'Register Now - Limited Spots!', 'https://images.unsplash.com/photo-1577896851231-70ef18881754', '/summer-camp', 'Register Now', 2, true, '2024-04-01', '2024-07-31', NOW(), NOW()),
    (gen_random_uuid(), 'IELTS Preparation Course', 'Achieve Your Target Score', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173', '/programs/ielts', 'Learn More', 3, true, '2024-01-01', '2024-06-30', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TESTIMONIALS (Customer reviews)
-- =====================================================
INSERT INTO testimonials (id, name, role, content, rating, image_url, is_featured, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Nguyen Van Minh', 'Parent', 'My son has improved tremendously since joining LERA. The teachers are professional and engaging. His English confidence has grown significantly!', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', true, true, NOW(), NOW()),
    (gen_random_uuid(), 'Tran Thi Lan', 'Parent', 'The facilities are excellent and the teaching programs are well-structured. My daughter loves her LERA Explorers class. Highly recommended!', 5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', true, true, NOW(), NOW()),
    (gen_random_uuid(), 'Le Van Duc', 'Parent', 'Great experience for my daughter. She loves coming to class every week. The phonics program has really helped her reading skills.', 4, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', false, true, NOW(), NOW()),
    (gen_random_uuid(), 'Pham Thi Huong', 'Parent', 'Professional staff and great communication. We always know about our childs progress. The IELTS prep course is excellent!', 5, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- FAQS (Frequently Asked Questions)
-- =====================================================
INSERT INTO faqs (id, question, answer, category, display_order, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'What age groups do you accept?', 'We accept students from ages 2 to adult for various English programs. Each program has specific age requirements tailored for optimal learning.', 'ENROLLMENT', 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'How do I enroll my child?', 'You can enroll online through our website or visit any of our centers. A free trial class is available for new students.', 'ENROLLMENT', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'What are the payment options?', 'We accept cash, bank transfer, and credit card payments. Monthly, quarterly, and annual payment plans are available with discounts.', 'PAYMENT', 3, true, NOW(), NOW()),
    (gen_random_uuid(), 'Do you offer trial classes?', 'Yes! We offer a FREE trial class for all new students to experience our programs and teaching methods before enrolling.', 'ENROLLMENT', 4, true, NOW(), NOW()),
    (gen_random_uuid(), 'What teaching methodology do you use?', 'We use communicative language teaching combined with Cambridge methodology. All classes are interactive with native and bilingual teachers.', 'GENERAL', 5, true, NOW(), NOW()),
    (gen_random_uuid(), 'How can I track my childs progress?', 'Parents can access the parent portal to view attendance, progress reports, test scores, and communicate directly with teachers.', 'GENERAL', 6, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- LEADERSHIP_MEMBERS (Team members for website)
-- =====================================================
INSERT INTO leadership_members (id, name, name_vi, position, position_vi, bio, bio_vi, image_url, display_order, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Dr. Nguyen Van A', 'TS. Nguyễn Văn A', 'Founder & Chairman', 'Nhà sáng lập & Chủ tịch', 'PhD in Education with 20+ years in English language education. Former Cambridge examiner.', 'Tiến sĩ Giáo dục với hơn 20 năm trong lĩnh vực giảng dạy tiếng Anh. Cựu giám khảo Cambridge.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a', 1, true, NOW(), NOW()),
    (gen_random_uuid(), 'Tran Thi B', 'Trần Thị B', 'CEO', 'Tổng Giám đốc', 'MBA graduate with extensive experience in education management. Passionate about innovative teaching.', 'Thạc sĩ MBA với nhiều năm kinh nghiệm quản lý giáo dục. Đam mê giảng dạy sáng tạo.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 2, true, NOW(), NOW()),
    (gen_random_uuid(), 'John Smith', 'John Smith', 'Head of Academic', 'Trưởng phòng Học vụ', 'CELTA & DELTA certified. British Council trained. 15+ years teaching experience internationally.', 'Chứng chỉ CELTA & DELTA. Được đào tạo British Council. Hơn 15 năm kinh nghiệm giảng dạy quốc tế.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 3, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
