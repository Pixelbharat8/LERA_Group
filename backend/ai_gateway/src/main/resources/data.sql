-- =====================================================
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
    (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'TUTORING', 'ENGLISH', 'Speaking confidence', 'GPT-4', 15, 25, '2024-02-10 15:00:00', '2024-02-10 15:25:00', 'ENDED', 4.5, 'Student learned self-introduction and basic conversation starters', '["self-introduction", "greetings", "simple questions"]', false, 'Very engaged session, student asked good questions', NOW(), NOW()),
    (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000051', '50000000-0000-0000-0000-000000000002', 'TUTORING', 'PHONICS', 'Letter sounds', 'GPT-4', 12, 20, '2024-02-12 16:00:00', '2024-02-12 16:20:00', 'ENDED', 5.0, 'Excellent understanding of vowel sounds and blending', '["vowel sounds", "blending", "CVC words"]', false, 'Student showed immediate improvement in reading', NOW(), NOW()),
    (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'ASSESSMENT', 'GRAMMAR', 'Tenses knowledge', 'GPT-4', 20, 30, '2024-02-15 10:00:00', '2024-02-15 10:30:00', 'ENDED', 4.0, 'Good understanding of present tense, needs work on past tense', '["present simple", "present continuous", "past simple"]', true, 'Schedule follow-up on irregular verbs', NOW(), NOW()),
    (gen_random_uuid(), NULL, '50000000-0000-0000-0000-000000000003', 'PRACTICE', 'IELTS', 'Writing Task 2', 'GPT-4', 25, 40, '2024-02-18 14:00:00', '2024-02-18 14:40:00', 'ENDED', 4.8, 'Advanced understanding of essay structure and argument development', '["essay structure", "thesis statement", "supporting evidence"]', false, 'Ready for advanced writing module', NOW(), NOW()),
    -- Active session
    (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000001', 'HOMEWORK_HELP', 'ENGLISH', 'Reading comprehension help', 'GPT-4', 8, 15, '2024-03-10 18:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, false, 'Helping with reading passage analysis', NOW(), NOW()),
    -- General inquiry
    (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000040', NULL, 'GENERAL', 'GENERAL', 'Program information', 'GPT-4', 5, 8, '2024-03-05 09:00:00', '2024-03-05 09:08:00', 'ENDED', 4.0, 'Parent got all information about IELTS prep course', '["IELTS prep", "schedule", "pricing"]', false, 'Potential enrollment for IELTS', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_ASSESSMENTS (AI-driven skill assessments)
-- =====================================================
INSERT INTO ai_assessments (id, student_id, assessment_type, subject, title, description, questions_json, answers_json, score, max_score, passing_score, status, started_at, completed_at, time_limit_minutes, ai_feedback, strengths, areas_for_improvement, recommended_actions, created_at, updated_at)
VALUES 
    ('aa000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'SKILL_CHECK', 'ENGLISH', 'English Basics Assessment', 'Assessment of fundamental English knowledge and skills', '["Vocabulary test", "Grammar quiz", "Speaking test", "Listening test"]', '["4/5", "75%", "3/5", "90%"]', 78, 100, 60, 'COMPLETED', '2024-02-01 10:00:00', '2024-02-01 10:45:00', 60, 'Good overall performance. Vocabulary and listening are strengths. Work on speaking confidence.', '["Good vocabulary", "Strong listening skills", "Consistent effort"]', '["Speaking fluency", "Grammar accuracy"]', '["Extra speaking practice", "Grammar exercises"]', NOW(), NOW()),
    ('aa000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'SKILL_CHECK', 'PHONICS', 'Phonics Fundamentals Test', 'Basic phonics skills and reading assessment', '["Letter sounds", "Blending ability", "Word reading", "Sentence reading"]', '["4/5", "3/5", "2/5", "4/5"]', 65, 100, 60, 'COMPLETED', '2024-02-15 11:00:00', '2024-02-15 11:30:00', 45, 'Meets basic requirements. Letter sounds are good. Focus needed on blending longer words.', '["Letter recognition", "Sound awareness"]', '["Blending longer words", "Reading fluency"]', '["Blending drills", "Reading practice"]', NOW(), NOW()),
    ('aa000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'PLACEMENT', 'ENGLISH', 'Advanced English Placement', 'Placement test for advanced English program', '["Essay writing", "Speaking test", "Grammar test", "Comprehension"]', '["5/5", "4/5", "4/5", "5/5"]', 90, 100, 75, 'COMPLETED', '2024-01-10 14:00:00', '2024-01-10 15:30:00', 90, 'Excellent performance. Ready for advanced program. Strong writing skills.', '["Exceptional writing", "Critical thinking", "High vocabulary"]', '["Public speaking", "Debate skills"]', '["Presentation practice", "Debate club"]', NOW(), NOW()),
    ('aa000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', 'PROGRESS', 'IELTS', 'IELTS Writing Progress Check', 'Monthly progress assessment on IELTS writing', '["Task 1 score", "Task 2 score", "Vocabulary range", "Grammar accuracy"]', '["Band 7", "Band 6.5", "Good", "Good"]', 82, 100, 70, 'COMPLETED', '2024-02-28 09:00:00', '2024-02-28 09:40:00', 45, 'Great progress this month. Task 1 improved significantly.', '["Data analysis", "Task completion"]', '["Opinion essays", "Argument structure"]', '["Essay structure practice", "Timed writing"]', NOW(), NOW()),
    -- Pending assessment
    ('aa000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'SKILL_CHECK', 'ENGLISH', 'Monthly Skills Assessment', 'Regular monthly skills evaluation', '["Speaking", "Listening", "Reading", "Writing"]', NULL, NULL, 100, 60, 'PENDING', NULL, NULL, 60, NULL, NULL, NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_RECOMMENDATIONS (Personalized recommendations)
-- =====================================================
INSERT INTO ai_recommendations (id, student_id, recommendation_type, title, description, reason, priority, status, expires_at, action_taken_at, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'SKILL_DEVELOPMENT', 'Focus on Speaking Practice', 'Increase speaking practice sessions to improve fluency', 'Assessment shows speaking as weakest area, but good improvement potential', 'HIGH', 'ACTIVE', '2024-04-30', NULL, NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', 'PROGRAM', 'Consider LERA Primary Level', 'Student shows readiness for primary level English', 'Vocabulary has improved significantly, ready for more challenging content', 'MEDIUM', 'ACTIVE', '2024-05-15', NULL, NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000002', 'PRACTICE', 'Extra Reading Drills', 'Schedule 2 additional reading practice sessions per week', 'Recent performance shows need for more reading fluency practice', 'HIGH', 'ACCEPTED', '2024-03-31', '2024-03-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'COMPETITION', 'Register for Speech Contest', 'Student is ready for competitive speaking at regional level', 'Excellent assessment results and teacher recommendation', 'HIGH', 'ACCEPTED', '2024-04-15', '2024-02-20 14:00:00', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'SKILL_DEVELOPMENT', 'Debate Skills Module', 'Enroll in debate and public speaking program', 'Shows natural communication abilities that should be developed', 'MEDIUM', 'ACTIVE', '2024-06-30', NULL, NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', 'PROGRAM', 'IELTS Exam Ready', 'Schedule official IELTS exam', 'Completed IELTS writing path with excellent results', 'HIGH', 'ACTIVE', '2024-04-30', NULL, NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000006', 'SCHEDULE', 'Increase Study Frequency', 'Add one more study session per week', 'Progress is slower than expected, additional practice recommended', 'MEDIUM', 'PENDING', '2024-04-15', NULL, NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000004', 'STUDY_TIPS', 'Vocabulary Building', 'Use flashcards and spaced repetition for vocabulary', 'Vocabulary retention could be improved with better techniques', 'LOW', 'DISMISSED', '2024-03-01', '2024-02-15 09:00:00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- AI_LEARNING_PROGRESS (Progress tracking)
-- =====================================================
INSERT INTO ai_learning_progress (id, student_id, learning_path_id, skill_name, skill_category, current_level, target_level, progress_percentage, last_assessed_at, notes, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', 'Vocabulary', 'LANGUAGE', 3, 5, 60.00, '2024-03-01', 'Good progress, maintaining consistency', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', 'Grammar', 'LANGUAGE', 3, 5, 55.00, '2024-03-01', 'Accuracy improving, work on complex sentences', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000001', 'Speaking', 'COMMUNICATION', 2, 5, 30.00, '2024-03-01', 'Needs focused practice', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000002', 'Letter Recognition', 'PHONICS', 4, 5, 80.00, '2024-02-28', 'Excellent improvement', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000001', '1a000000-0000-0000-0000-000000000002', 'Blending', 'PHONICS', 2, 5, 35.00, '2024-02-28', 'Technique needs refinement', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', '1a000000-0000-0000-0000-000000000003', 'Reading Comprehension', 'COGNITIVE', 4, 5, 85.00, '2024-03-05', 'Exceptional understanding', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', '1a000000-0000-0000-0000-000000000003', 'Essay Writing', 'WRITING', 3, 5, 65.00, '2024-03-05', 'Good structure, work on arguments', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', '1a000000-0000-0000-0000-000000000004', 'IELTS Writing Task 1', 'ACADEMIC', 5, 5, 100.00, '2024-03-01', 'Mastered', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', '1a000000-0000-0000-0000-000000000004', 'IELTS Writing Task 2', 'ACADEMIC', 5, 5, 100.00, '2024-03-01', 'Mastered', NOW(), NOW())
ON CONFLICT DO NOTHING;
