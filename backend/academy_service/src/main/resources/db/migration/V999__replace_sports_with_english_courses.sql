-- =====================================================
-- V999: Replace Sports Courses with English Language Courses
-- =====================================================
-- Safe on existing dev DBs: deletes only unreferenced rows; upserts by primary key (id).

-- Step 1: Delete sports programs not referenced by classes
DELETE FROM course_programs
WHERE category IN ('SPORTS', 'FOOTBALL', 'SWIMMING', 'TENNIS', 'BASKETBALL', 'MARTIAL_ARTS', 'YOGA')
  AND id NOT IN (SELECT DISTINCT program_id FROM classes WHERE program_id IS NOT NULL);

DELETE FROM course_programs
WHERE (
    code LIKE '%FOOTBALL%'
 OR code LIKE '%SWIM%'
 OR code LIKE '%TENNIS%'
 OR code LIKE '%BASKETBALL%'
 OR code LIKE '%MARTIAL%'
 OR code LIKE '%YOGA%'
)
  AND id NOT IN (SELECT DISTINCT program_id FROM classes WHERE program_id IS NOT NULL);

-- Step 1b: If another row already owns one of our canonical codes, rename it (unique, <= 50 chars) so unique(code) allows the upsert
UPDATE course_programs cp
SET code = left('LEG_' || replace(cp.id::text, '-', ''), 50),
    updated_at = NOW()
WHERE cp.code IN (
    'STARTERS', 'EXPLORERS', 'PRIMARY', 'TEENS', 'IELTS_SAT', 'BUSINESS', 'CONVERSATION', 'PHONICS'
)
  AND cp.id NOT IN (
    'a0000001-0000-0000-0000-000000000001'::uuid,
    'a0000001-0000-0000-0000-000000000002'::uuid,
    'a0000001-0000-0000-0000-000000000003'::uuid,
    'a0000001-0000-0000-0000-000000000004'::uuid,
    'a0000001-0000-0000-0000-000000000005'::uuid,
    'a0000001-0000-0000-0000-000000000006'::uuid,
    'a0000001-0000-0000-0000-000000000007'::uuid,
    'a0000001-0000-0000-0000-000000000008'::uuid
);

-- Step 2: Upsert English programs (per-row ON CONFLICT (id); Step 1b avoids unique(code) clashes)
INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000001', 'STARTERS', 'LERA Starters', 'LERA Khởi Đầu', 'Fun English learning for toddlers through play, songs, and interactive activities. Building foundation for language love.', 'Học tiếng Anh vui nhộn cho trẻ nhỏ qua trò chơi, bài hát và hoạt động tương tác. Xây dựng nền tảng yêu thích ngôn ngữ.', 2, 4, 'ENGLISH', 'BEGINNER', 2500000, '#EC4899', true, true, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000002', 'EXPLORERS', 'LERA Explorers', 'LERA Khám Phá', 'Discover English through stories, crafts, and games. Develop listening and speaking confidence.', 'Khám phá tiếng Anh qua câu chuyện, thủ công và trò chơi. Phát triển sự tự tin nghe và nói.', 5, 6, 'ENGLISH', 'BEGINNER', 2800000, '#3B82F6', true, true, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000003', 'PRIMARY', 'LERA Primary', 'LERA Tiểu Học', 'Comprehensive English for primary school students. Reading, writing, speaking, and listening skills.', 'Tiếng Anh toàn diện cho học sinh tiểu học. Kỹ năng đọc, viết, nói và nghe.', 7, 10, 'ENGLISH', 'ELEMENTARY', 3000000, '#10B981', true, true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000004', 'TEENS', 'LERA Teens', 'LERA Thiếu Niên', 'Academic English and exam preparation for teenagers. Cambridge, TOEFL Junior prep included.', 'Tiếng Anh học thuật và luyện thi cho thiếu niên. Bao gồm luyện Cambridge, TOEFL Junior.', 11, 14, 'ENGLISH', 'INTERMEDIATE', 3500000, '#8B5CF6', true, true, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000005', 'IELTS_SAT', 'IELTS & SAT Preparation', 'Luyện Thi IELTS & SAT', 'Intensive preparation for IELTS, SAT, and university admission. Expert instructors and proven methods.', 'Luyện thi chuyên sâu IELTS, SAT và tuyển sinh đại học. Giáo viên chuyên gia và phương pháp đã chứng minh.', 15, 99, 'ENGLISH', 'ADVANCED', 4500000, '#4F46E5', true, true, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000006', 'BUSINESS', 'Business English', 'Tiếng Anh Thương Mại', 'Professional English for the workplace. Presentations, negotiations, business writing, and communication.', 'Tiếng Anh chuyên nghiệp cho môi trường làm việc. Thuyết trình, đàm phán, viết và giao tiếp công việc.', 18, 99, 'ENGLISH', 'ADVANCED', 4000000, '#7C3AED', true, true, 6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000007', 'CONVERSATION', 'English Conversation Club', 'Câu Lạc Bộ Giao Tiếp', 'Practice speaking English with native speakers. Fun topics, debates, and real-life scenarios.', 'Luyện nói tiếng Anh với người bản xứ. Chủ đề vui, tranh luận và tình huống thực tế.', 10, 99, 'ENGLISH', 'ALL_LEVELS', 2000000, '#06B6D4', false, true, 7, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();

INSERT INTO course_programs (id, code, name, name_vi, description, description_vi, age_from, age_to, category, level, price, color, is_featured, is_active, display_order, created_at, updated_at)
VALUES ('a0000001-0000-0000-0000-000000000008', 'PHONICS', 'Phonics & Reading', 'Ngữ Âm & Đọc', 'Master English pronunciation and reading skills. Systematic phonics approach for all ages.', 'Làm chủ phát âm và kỹ năng đọc tiếng Anh. Phương pháp ngữ âm hệ thống cho mọi lứa tuổi.', 5, 12, 'ENGLISH', 'BEGINNER', 2200000, '#F59E0B', false, true, 8, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code, name = EXCLUDED.name, name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description, description_vi = EXCLUDED.description_vi,
    category = EXCLUDED.category, age_from = EXCLUDED.age_from, age_to = EXCLUDED.age_to,
    level = EXCLUDED.level, price = EXCLUDED.price, color = EXCLUDED.color,
    is_featured = EXCLUDED.is_featured, is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order, updated_at = NOW();
