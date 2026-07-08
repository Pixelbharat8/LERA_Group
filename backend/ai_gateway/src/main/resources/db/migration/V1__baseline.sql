-- V1__baseline.sql — AI Gateway indexes for 10M+ scale
--
-- Guarded: ai_tutor_sessions has NO JPA entity in this service (the ai-tutor feature was removed),
-- so on a fresh / entity-first bootstrap the table does not exist and an unguarded CREATE INDEX
-- aborts the whole migration ("relation \"ai_tutor_sessions\" does not exist" → deploy fails).
-- Create these only if the table is actually present (self-heals if the feature ever returns).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'ai_tutor_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_student_id ON ai_tutor_sessions (student_id);
        CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_subject ON ai_tutor_sessions (subject);
        CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_created_at ON ai_tutor_sessions (created_at);
    END IF;
END $$;
