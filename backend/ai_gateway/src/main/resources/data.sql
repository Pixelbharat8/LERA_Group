-- =====================================================
--
-- NOTE: seed ids are FIXED, never gen_random_uuid(). Spring re-runs data.sql on every
-- startup (spring.sql.init.mode=always in dev; 'never' in prod). A random id can never
-- collide, so ON CONFLICT DO NOTHING cannot fire and the rows are re-INSERTED each boot —
-- which duplicated this dev DB's seed data many times over. Keep ids literal.
-- LERA AI Gateway Service - Seed Data
-- =====================================================
-- This file creates initial data for AI conversations, learning paths, assessments, recommendations
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- LEARNING_PATHS (AI-generated learning paths)
-- =====================================================
INSERT INTO learning_paths (id, student_id, path_name, description, subject, difficulty_level, total_steps, completed_steps, estimated_duration_hours, actual_duration_hours, learning_objectives, milestones, progress_percentage, started_at, target_completion_date, status, ai_generated, created_at, updated_at)
VALUES 
    ('1a000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'English Fundamentals Mastery', 'Complete path to master basic English skills including speaking, listening, and vocabulary', 'ENGLISH', 'BEGINNER', 12, 5, 24, 10, '["Master basic vocabulary", "Develop speaking confidence", "Learn sentence structures", "Understand pronunciation"]', '["Complete vocabulary module", "Speaking accuracy 80%+", "Pass listening test", "Complete grammar test"]', 41.67, '2024-01-20 10:00:00', '2024-04-20', 'IN_PROGRESS', true, NOW(), NOW()),
    ('1a000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Phonics Confidence Builder', 'Build reading confidence through phonics mastery', 'PHONICS', 'BEGINNER', 8, 3, 16, 6, '["Learn letter sounds", "Master blending", "Read simple words", "Develop fluency"]', '["Sound recognition", "Blend 3-letter words", "Read short sentences", "Reading test"]', 37.50, '2024-02-05 09:00:00', '2024-05-01', 'IN_PROGRESS', true, NOW(), NOW()),
    ('1a000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'Advanced English Communication', 'Learn advanced speaking and writing techniques', 'ENGLISH', 'ADVANCED', 15, 8, 40, 22, '["Master essay writing", "Debate skills", "Advanced grammar", "Public speaking"]', '["Complete writing module", "Lead debate", "Grammar proficiency", "Presentation success"]', 53.33, '2024-01-15 14:00:00', '2024-05-30', 'IN_PROGRESS', true, NOW(), NOW()),
    ('1a000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', 'IELTS Writing Mastery', 'Develop excellent IELTS writing skills', 'IELTS', 'INTERMEDIATE', 10, 10, 20, 18, '["Task 1 mastery", "Task 2 structure", "Vocabulary range", "Grammar accuracy"]', '["Task 1 band 7+", "Task 2 band 7+", "Vocabulary test pass", "Full writing test"]', 100.00, '2024-01-10 11:00:00', '2024-03-10', 'COMPLETED', true, NOW(), NOW()),
    ('1a000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000006', 'Business English Foundation', 'Build core business English skills', 'BUSINESS_ENGLISH', 'BEGINNER', 20, 0, 50, 0, '["Professional vocabulary", "Email writing", "Meeting participation", "Presentation skills"]', '["Vocabulary test", "Email assessment", "Mock meeting", "Final presentation"]', 0.00, NULL, '2024-06-30', 'NOT_STARTED', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_CONVERSATIONS (AI tutoring sessions)
-- =====================================================
INSERT INTO ai_conversations (id, user_id, student_id, conversation_type, subject, topic, ai_model, message_count, session_duration_minutes, started_at, ended_at, status, satisfaction_rating, learning_outcome, key_concepts, follow_up_needed, notes, created_at, updated_at)
VALUES 
    -- Completed tutoring sessions
    ('5eed0002-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'TUTORING', 'ENGLISH', 'Speaking confidence', 'GPT-4', 15, 25, '2024-02-10 15:00:00', '2024-02-10 15:25:00', 'ENDED', 4.5, 'Student learned self-introduction and basic conversation starters', '["self-introduction", "greetings", "simple questions"]', false, 'Very engaged session, student asked good questions', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000051', '50000000-0000-0000-0000-000000000002', 'TUTORING', 'PHONICS', 'Letter sounds', 'GPT-4', 12, 20, '2024-02-12 16:00:00', '2024-02-12 16:20:00', 'ENDED', 5.0, 'Excellent understanding of vowel sounds and blending', '["vowel sounds", "blending", "CVC words"]', false, 'Student showed immediate improvement in reading', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'ASSESSMENT', 'GRAMMAR', 'Tenses knowledge', 'GPT-4', 20, 30, '2024-02-15 10:00:00', '2024-02-15 10:30:00', 'ENDED', 4.0, 'Good understanding of present tense, needs work on past tense', '["present simple", "present continuous", "past simple"]', true, 'Schedule follow-up on irregular verbs', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000004', NULL, '50000000-0000-0000-0000-000000000003', 'PRACTICE', 'IELTS', 'Writing Task 2', 'GPT-4', 25, 40, '2024-02-18 14:00:00', '2024-02-18 14:40:00', 'ENDED', 4.8, 'Advanced understanding of essay structure and argument development', '["essay structure", "thesis statement", "supporting evidence"]', false, 'Ready for advanced writing module', NOW(), NOW()),
    -- Active session
    ('5eed0002-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'HOMEWORK_HELP', 'ENGLISH', 'Reading comprehension help', 'GPT-4', 8, 15, '2024-03-10 18:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, false, 'Helping with reading passage analysis', NOW(), NOW()),
    -- General inquiry
    ('5eed0002-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000040', NULL, 'GENERAL', 'GENERAL', 'Program information', 'GPT-4', 5, 8, '2024-03-05 09:00:00', '2024-03-05 09:08:00', 'ENDED', 4.0, 'Parent got all information about IELTS prep course', '["IELTS prep", "schedule", "pricing"]', false, 'Potential enrollment for IELTS', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_ASSESSMENTS (AI-driven skill assessments)
-- =====================================================
-- real cols: topic/questions_data/score_percentage/skill_analysis/improvement_areas.
-- There is no title/description/answers_json/score/max_score/passing_score/time_limit_minutes/strengths.
INSERT INTO ai_assessments (id, student_id, assessment_type, subject, topic, questions_data, total_questions, questions_attempted, correct_answers, score_percentage, difficulty_level, status, started_at, completed_at, time_taken_minutes, ai_feedback, skill_analysis, improvement_areas, recommended_resources, created_at, updated_at)
VALUES
    ('5eed0002-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000001', 'SKILL_CHECK', 'ENGLISH', 'English Basics', '["Vocabulary test", "Grammar quiz", "Speaking test", "Listening test"]', 20, 20, 16, 78.00, 'INTERMEDIATE', 'COMPLETED', '2024-02-01 10:00:00', '2024-02-01 10:45:00', 45, 'Good overall performance. Vocabulary and listening are strengths. Work on speaking confidence.', 'Strong: vocabulary, listening. Weak: speaking fluency, grammar accuracy.', 'Speaking fluency, Grammar accuracy', 'Extra speaking practice, Grammar exercises', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000001', 'SKILL_CHECK', 'PHONICS', 'Phonics Fundamentals', '["Letter sounds", "Blending ability", "Word reading", "Sentence reading"]', 20, 20, 13, 65.00, 'BEGINNER', 'COMPLETED', '2024-02-15 11:00:00', '2024-02-15 11:30:00', 30, 'Meets basic requirements. Letter sounds are good. Focus needed on blending longer words.', 'Strong: letter recognition, sound awareness. Weak: blending, reading fluency.', 'Blending longer words, Reading fluency', 'Blending drills, Reading practice', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_RECOMMENDATIONS (Personalized recommendations)
-- =====================================================
-- real cols: recommendation_title (NOT NULL), reasoning (not reason); no action_taken_at.
INSERT INTO ai_recommendations (id, student_id, recommendation_type, recommendation_title, description, reasoning, subject, priority, status, confidence_score, expires_at, created_at, updated_at)
VALUES
    ('5eed0002-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000001', 'SKILL_DEVELOPMENT', 'Focus on Speaking Practice', 'Increase speaking practice sessions to improve fluency', 'Assessment shows speaking as weakest area, but good improvement potential', 'ENGLISH', 'HIGH', 'ACTIVE', 0.87, '2024-04-30', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000001', 'PROGRAM', 'Consider LERA Primary Level', 'Student shows readiness for primary level English', 'Vocabulary has improved significantly, ready for more challenging content', 'ENGLISH', 'MEDIUM', 'ACTIVE', 0.79, '2024-05-15', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000003', 'SKILL_DEVELOPMENT', 'Strengthen Grammar Accuracy', 'Targeted grammar drills on complex sentence structures', 'Recurring errors with past perfect and conditionals', 'ENGLISH', 'HIGH', 'ACTIVE', 0.82, '2024-05-01', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000005', 'RESOURCE', 'Daily Reading Practice', 'Assign 15 minutes of graded reading per day', 'Reading fluency below level benchmark for age group', 'PHONICS', 'MEDIUM', 'ACTIVE', 0.74, '2024-06-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_LEARNING_PROGRESS (Progress tracking)
-- =====================================================
-- real cols: subject/topic/proficiency_score/skill_level (no skill_name/current_level/progress_percentage).
INSERT INTO ai_learning_progress (id, student_id, learning_path_id, subject, topic, skill_level, proficiency_score, previous_score, score_change, exercises_completed, exercises_accuracy, study_time_hours, strengths, weaknesses, last_activity_date, created_at, updated_at)
VALUES
    ('5eed0002-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', 'ENGLISH', 'Vocabulary', 'INTERMEDIATE', 60.00, 52.00, 8.00, 24, 78.50, 12.5, 'Retains new words well', 'Struggles with academic vocabulary', '2024-03-01', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', 'ENGLISH', 'Grammar', 'INTERMEDIATE', 55.00, 50.00, 5.00, 18, 71.00, 9.0, 'Solid with basic tenses', 'Complex sentences need work', '2024-03-01', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000003', '1a000000-0000-0000-0000-000000000001', 'ENGLISH', 'Speaking', 'BEGINNER', 42.00, 35.00, 7.00, 11, 64.00, 6.5, 'Willing to participate', 'Hesitant, limited fluency', '2024-03-05', NOW(), NOW()),
    ('5eed0002-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000005', '1a000000-0000-0000-0000-000000000001', 'PHONICS', 'Reading', 'BEGINNER', 48.00, 40.00, 8.00, 15, 68.00, 7.0, 'Good letter-sound mapping', 'Blending longer words', '2024-03-05', NOW(), NOW())
ON CONFLICT DO NOTHING;
