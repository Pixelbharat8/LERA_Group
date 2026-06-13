-- V1__baseline.sql — AI Gateway indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_student_id ON ai_tutor_sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_subject ON ai_tutor_sessions (subject);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_created_at ON ai_tutor_sessions (created_at);
