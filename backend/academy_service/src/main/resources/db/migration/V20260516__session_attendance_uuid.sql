-- Per-session student attendance (academy LMS). UUID keys align with class_sessions and students.
CREATE TABLE IF NOT EXISTS session_attendance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL,
    student_id      UUID NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    minutes_late    INTEGER,
    participation_score INTEGER,
    behavior_score  INTEGER,
    notes           TEXT,
    parent_notified BOOLEAN DEFAULT FALSE,
    parent_notified_at TIMESTAMP,
    recorded_by     UUID,
    recorded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student ON session_attendance(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_attendance_session_student
    ON session_attendance(session_id, student_id);
