-- Link payroll teacher_sessions rows to academy class_sessions (idempotent sync).
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS class_session_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_sessions_class_session_id
    ON teacher_sessions(class_session_id)
    WHERE class_session_id IS NOT NULL;
